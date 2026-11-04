import logging
from typing import Optional
from collections import Counter
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.openalex import OpenAlexClient
from core.nlp import ResearchAnalyzer
from models.schemas import AnalysisResponse, Overview, TimelineYear

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Research Dashboard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openalex_client = OpenAlexClient()
analyzer = ResearchAnalyzer()

@app.get("/api/analyze", response_model=AnalysisResponse)
def analyze_topic(
    topic: str, 
    limit: int = 200, 
    start_year: Optional[int] = None, 
    end_year: Optional[int] = None
):
    try:
        logger.info(f"Fetching up to {limit} papers for topic: {topic}")
        papers = openalex_client.search_papers(topic, limit, start_year, end_year)
        
        # Calculate Overview Stats
        with_abstracts = sum(1 for p in papers if p.abstract)
        year_counts = Counter(p.publication_year for p in papers if p.publication_year)
        timeline = [TimelineYear(year=y, count=c) for y, c in sorted(year_counts.items())]
        
        overview = Overview(
            total_retrieved=len(papers),
            with_abstracts=with_abstracts,
            timeline=timeline
        )

        if not papers:
            return AnalysisResponse(
                query=topic, overview=overview, gaps=[], word_cloud=[], papers=[]
            )
        
        logger.info(f"Analyzing {len(papers)} papers...")
        analysis_data = analyzer.analyze(papers)
        
        return AnalysisResponse(
            query=topic,
            overview=overview,
            gaps=analysis_data["gaps"],
            word_cloud=analysis_data["word_cloud"],
            papers=papers
        )
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)