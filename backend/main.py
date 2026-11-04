import logging
from typing import Optional
from collections import Counter
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from services.openalex import OpenAlexClient
from core.nlp import ResearchAnalyzer

# Gabungkan import skema di sini:
from models.schemas import AnalysisResponse, Overview, TimelineYear, SearchResponse, SearchPaperItem

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

# --- TAMBAHKAN DI BAWAH ROUTE YANG SUDAH ADA ---

# Pastikan class dari schemas dan fungsi dari openalex di-import di bagian atas file Anda:


@app.get("/api/search", response_model=SearchResponse)
async def search_journals(q: str):
    """
    Endpoint untuk mencari jurnal berdasarkan keyword/topik (maksimal 500 paper).
    """
    if not q:
        return {"query": q, "total_results": 0, "papers": []}
        
    # Memanggil fungsi dari openalex.py
    from services.openalex import search_papers
    raw_papers = search_papers(query=q, max_results=500)
    
    return {
        "query": q,
        "total_results": len(raw_papers),
        "papers": raw_papers
    }

# --- PLACEHOLDER ENDPOINT BOOKMARK (Persiapan Login) ---
@app.post("/api/bookmarks")
async def save_bookmark(paper_id: str):
    # Sementara hanya mengembalikan pesan sukses
    return {"status": "success", "message": f"Paper {paper_id} saved (dummy)"}

@app.get("/api/bookmarks/{user_id}")
async def get_bookmarks(user_id: str):
    # Sementara mengembalikan list kosong
    return {"status": "success", "user_id": user_id, "saved_papers": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=2000, reload=True)