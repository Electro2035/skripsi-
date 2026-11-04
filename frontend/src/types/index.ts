export interface Author {
  name: string;
  institution?: string;
  country?: string;
}

export interface Paper {
  id: string;
  title: string;
  abstract?: string;
  publication_year?: number;
  url?: string;
  authors: Author[];
  venue?: string;
  citation_count: number;
  is_oa: boolean;
  keywords: string[];
}

export interface PaperGapScore {
  paper_id: string;
  title: string;
  scores: Record<string, number>;
}

export interface GapResult {
  gap_name: string;
  percentage_score: number;
  supporting_papers: PaperGapScore[];
}

export interface WordFrequency {
  text: string;
  value: number;
}

export interface TimelineYear {
  year: number;
  count: number;
}

export interface Overview {
  total_retrieved: number;
  with_abstracts: number;
  timeline: TimelineYear[];
}

export interface AnalysisResponse {
  query: string;
  overview: Overview;
  gaps: GapResult[];
  word_cloud: WordFrequency[];
  papers: Paper[];
}