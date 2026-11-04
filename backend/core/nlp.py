import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from models.schemas import Paper, GapResult, PaperGapScore
from typing import List, Dict, Any
import nltk

# Download required NLTK data securely on startup
try:
    nltk.data.find('tokenizers/punkt')
    nltk.data.find('tokenizers/punkt_tab')
    nltk.data.find('taggers/averaged_perceptron_tagger')
    nltk.data.find('taggers/averaged_perceptron_tagger_eng')
except LookupError:
    nltk.download('punkt', quiet=True)
    nltk.download('punkt_tab', quiet=True)
    nltk.download('averaged_perceptron_tagger', quiet=True)
    nltk.download('averaged_perceptron_tagger_eng', quiet=True)

GAP_PROFILES = {
    "Knowledge Gap": "unknown lack of understanding scant literature lacks not well understood unaddressed",
    "Methodological Gap": "methodological limitations previous methods new method better approach measurement errors inadequate design",
    "Empirical Gap": "empirical evidence untested not empirically proven requires empirical validation lacks empirical support",
    "Theoretical Gap": "theoretical framework missing theory does not explain lack of theory conceptual gap",
    "Population Gap": "underrepresented specific demographic not studied in this population different cohort unexamined group",
    "Evidence Gap": "contradictory findings mixed results insufficient evidence lack of consensus inconsistent literature",
    "Practical-Knowledge Gap": "practical implementation real-world application practice differs from theory operationalize clinical practice"
}

class ResearchAnalyzer:
    def __init__(self):
        self.tfidf = TfidfVectorizer(stop_words='english', lowercase=True)
        self.gap_names = list(GAP_PROFILES.keys())
        self.gap_texts = list(GAP_PROFILES.values())

    def _preprocess_gap(self, text: str) -> str:
        if not text: return ""
        return re.sub(r'[^a-zA-Z\s]', '', text).lower()

    def _extract_nouns(self, text: str) -> str:
        # Part-of-Speech Tagging to extract clean nouns
        if not text: return ""
        text = re.sub(r'[^a-zA-Z\s]', ' ', text).lower()
        tokens = nltk.word_tokenize(text)
        tags = nltk.pos_tag(tokens)
        
        # Keep only Nouns (NN, NNS) and Adjectives (JJ)
        allowed_tags = {'NN', 'NNS', 'JJ'}
        filtered = [word for word, tag in tags if tag in allowed_tags and len(word) > 2]
        return " ".join(filtered)

    def analyze(self, papers: List[Paper]) -> Dict[str, Any]:
        valid_papers = [p for p in papers if p.abstract]
        
        # --- PART 1: GAP ANALYSIS ---
        gaps_result = []
        if valid_papers:
            abstracts = [self._preprocess_gap(p.abstract) for p in valid_papers]
            corpus = self.gap_texts + abstracts
            
            tfidf_matrix = self.tfidf.fit_transform(corpus)
            gap_vectors = tfidf_matrix[:len(self.gap_texts)]
            paper_vectors = tfidf_matrix[len(self.gap_texts):]
            
            similarity_matrix = cosine_similarity(paper_vectors, gap_vectors)
            aggregated_scores = np.sum(similarity_matrix, axis=0)
            total_score = np.sum(aggregated_scores)
            percentages = (aggregated_scores / total_score) * 100 if total_score > 0 else np.zeros(len(self.gap_names))

            for idx, gap_name in enumerate(self.gap_names):
                supporting = []
                for p_idx, paper in enumerate(valid_papers):
                    score = float(similarity_matrix[p_idx][idx])
                    if score > 0:
                        supporting.append(PaperGapScore(
                            paper_id=paper.id,
                            title=paper.title,
                            scores={gap_name: round(score, 4)}
                        ))
                
                # Keep top 15 supporting papers per gap for rich frontend viewing
                supporting = sorted(supporting, key=lambda x: x.scores[gap_name], reverse=True)[:15]
                gaps_result.append(GapResult(
                    gap_name=gap_name,
                    percentage_score=round(float(percentages[idx]), 2),
                    supporting_papers=supporting
                ))
            
            gaps_result = sorted(gaps_result, key=lambda x: x.percentage_score, reverse=True)

        # --- PART 2: WORD CLOUD ---
        word_cloud = []
        network_papers = [p for p in papers if p.abstract or p.title]
        
        if network_papers:
            texts = [self._extract_nouns(f"{p.title} {p.abstract or ''} {' '.join(p.keywords)}") for p in network_papers]
            
            # Use ngram_range to capture multi-word concepts, extracting the top 100
            vec = CountVectorizer(stop_words='english', ngram_range=(1, 3), max_features=100, binary=True)
            X = vec.fit_transform(texts)
            words = vec.get_feature_names_out()
            term_freqs = np.asarray(X.sum(axis=0)).flatten()

            for i, word in enumerate(words):
                if term_freqs[i] > 1: # Require at least 2 occurrences
                    word_cloud.append({
                        "text": word,
                        "value": int(term_freqs[i])
                    })

        return {
            "gaps": gaps_result,
            "word_cloud": sorted(word_cloud, key=lambda x: x["value"], reverse=True)
        }