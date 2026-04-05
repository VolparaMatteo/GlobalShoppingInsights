# ---------------------------------------------------------------------------
# api/unsplash.py  --  Proxy for Unsplash image search
# ---------------------------------------------------------------------------
from fastapi import APIRouter, Depends, HTTPException, Query
import httpx

from app.config import settings
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/unsplash", tags=["unsplash"])

UNSPLASH_BASE = "https://api.unsplash.com"


def _headers() -> dict[str, str]:
    if not settings.UNSPLASH_ACCESS_KEY:
        raise HTTPException(status_code=503, detail="Unsplash API key not configured")
    return {"Authorization": f"Client-ID {settings.UNSPLASH_ACCESS_KEY}"}


@router.get("/search")
async def search_photos(
    query: str = Query(..., min_length=1),
    page: int = Query(1, ge=1),
    per_page: int = Query(12, ge=1, le=30),
    _current_user: User = Depends(get_current_user),
):
    """Proxy search to Unsplash, returning a lightweight payload."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{UNSPLASH_BASE}/search/photos",
            headers=_headers(),
            params={"query": query, "page": page, "per_page": per_page},
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Unsplash API error")
        data = resp.json()

    results = []
    for photo in data.get("results", []):
        results.append(
            {
                "id": photo["id"],
                "thumb": photo["urls"]["thumb"],
                "small": photo["urls"]["small"],
                "regular": photo["urls"]["regular"],
                "photographer": photo["user"]["name"],
                "photographer_url": photo["user"]["links"]["html"],
                "download_location": photo["links"]["download_location"],
            }
        )

    return {
        "total": data.get("total", 0),
        "total_pages": data.get("total_pages", 0),
        "results": results,
    }


@router.post("/download")
async def track_download(
    download_location: str = Query(...),
    _current_user: User = Depends(get_current_user),
):
    """Trigger Unsplash download tracking (required by API guidelines)."""
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            download_location,
            headers=_headers(),
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Unsplash download tracking failed")
    return {"ok": True}
