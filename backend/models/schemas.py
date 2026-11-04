from pydantic import BaseModel
from typing import List, Optional, Dict

class Author(BaseModel):
    name: str
    institution: Optional[str] = None
    country: Optional[str] = None

class Paper(BaseModel):
    id: str
    title: str
    abstract: Optional[str] = None
    publication_year: Optional[int] = None
    url: Optional[str] = None
    authors: List[Author] = []
    venue: Optional[str] = None
    citation_count: int = 0
    is_oa: bool = False
    keywords: List[str] = []

class PaperGapScore(BaseModel):
    paper_id: str
    title: str
    scores: Dict[str, float]

class GapResult(BaseModel):
    gap_name: str
    percentage_score: float
    supporting_papers: List[PaperGapScore]

class WordFrequency(BaseModel):
    text: str
    value: int

class TimelineYear(BaseModel):
    year: int
    count: int

class Overview(BaseModel):
    total_retrieved: int
    with_abstracts: int
    timeline: List[TimelineYear]

class AnalysisResponse(BaseModel):
    query: str
    overview: Overview
    gaps: List[GapResult]
    word_cloud: List[WordFrequency]
    papers: List[Paper]

class SearchPaperItem(BaseModel):
    id: str
    title: str
    publication_year: Optional[int] = None
    authors: str
    journal_name: str
    url: str

class SearchResponse(BaseModel):
    query: str
    total_results: int
    papers: List[SearchPaperItem]