import os
import time
import logging
import requests
from dotenv import load_dotenv
from models.schemas import Paper, Author
from typing import List, Optional

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class OpenAlexClient:
    BASE_URL = "https://api.openalex.org/works"
    API_KEY = os.getenv("OPENALEX_API_KEY")

    def search_papers(self, topic: str, limit: int = 200, start_year: Optional[int] = None, end_year: Optional[int] = None) -> List[Paper]:
        actual_limit = min(limit, 200)
        
        filters = []
        if start_year and end_year:
            filters.append(f"publication_year:{start_year}-{end_year}")
        elif start_year:
            filters.append(f"publication_year:>{start_year-1}")
        elif end_year:
            filters.append(f"publication_year:<{end_year+1}")
            
        filter_str = ",".join(filters) if filters else ""
        
        params = {
            "search": topic,
            "sort": "relevance_score:desc",
            "select": "id,title,abstract_inverted_index,publication_year,authorships,primary_location,cited_by_count,open_access,keywords"
        }
        if filter_str:
            params["filter"] = filter_str
            
        if self.API_KEY:
            params["api_key"] = self.API_KEY
            
        max_retries = 3
        backoff_factor = 1
        papers = []
        page = 1

        while len(papers) < actual_limit:
            params["per-page"] = min(200, actual_limit - len(papers))
            params["page"] = page
            
            for attempt in range(max_retries + 1):
                try:
                    response = requests.get(self.BASE_URL, params=params, timeout=30)
                    if response.status_code == 429:
                        if attempt == max_retries:
                            response.raise_for_status()
                        sleep_time = backoff_factor * (2 ** attempt)
                        time.sleep(sleep_time)
                        continue

                    response.raise_for_status()
                    data = response.json()
                    results = data.get("results", [])
                    
                    if not results:
                        return papers
                        
                    for item in results:
                        abstract_inverted = item.get("abstract_inverted_index")
                        abstract = self._reconstruct_abstract(abstract_inverted) if abstract_inverted else None
                        
                        # Parse Authors
                        authors = []
                        for auth in item.get("authorships", [])[:5]:
                            inst = auth.get("institutions", [{}])
                            authors.append(Author(
                                name=auth.get("author", {}).get("display_name") or "Unknown",
                                institution=inst[0].get("display_name") if inst else None,
                                country=inst[0].get("country_code") if inst else None
                            ))
                            
                        # Parse Venue & OA
                        loc = item.get("primary_location") or {}
                        source = loc.get("source") or {}
                        
                        # Parse Keywords
                        keywords = [kw.get("display_name") for kw in item.get("keywords", []) if kw.get("display_name")]
                        
                        papers.append(Paper(
                            id=item.get("id"),
                            title=item.get("title") or "Untitled",
                            abstract=abstract,
                            publication_year=item.get("publication_year"),
                            url=item.get("id"),
                            authors=authors,
                            venue=source.get("display_name"),
                            citation_count=item.get("cited_by_count", 0),
                            is_oa=item.get("open_access", {}).get("is_oa", False),
                            keywords=keywords
                        ))
                    break
                except requests.exceptions.RequestException as e:
                    logger.error(f"Request failed: {e}")
                    if attempt == max_retries:
                        return papers
                    time.sleep(backoff_factor * (2 ** attempt))

            page += 1

        return papers[:actual_limit]
        
    def _reconstruct_abstract(self, inverted_index: dict) -> str:
        if not inverted_index: return ""
        max_index = max([idx for positions in inverted_index.values() for idx in positions])
        words = [""] * (max_index + 1)
        for word, positions in inverted_index.items():
            for pos in positions: words[pos] = word
        return " ".join(words).strip()