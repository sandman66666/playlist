from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional, Dict, List
import httpx
from .auth import validate_token_string

router = APIRouter()

SPOTIFY_API_BASE = "https://api.spotify.com/v1"

@router.get("/tracks", response_model=Dict[str, List[dict]])
async def search_tracks(
    q: str,
    token: str = Depends(validate_token_string)
):
    try:
        # Create async HTTP client
        async with httpx.AsyncClient() as client:
            # Make request to Spotify search API
            response = await client.get(
                f"{SPOTIFY_API_BASE}/search",
                params={
                    "q": q,
                    "type": "track",
                    "limit": 20
                },
                headers={
                    "Authorization": f"Bearer {token}"
                }
            )
            # Check if request was successful
            response.raise_for_status()
            data = response.json()

            # Extract and format track results to match frontend expectations
            tracks = data.get("tracks", {}).get("items", [])
            formatted_tracks = []
            for track in tracks:
                formatted_track = {
                    "id": track["id"],
                    "name": track["name"],
                    "artists": track["artists"],  # Keep full artists array as frontend expects it
                    "album": {
                        "name": track["album"]["name"],
                        "images": track["album"]["images"]
                    },
                    "duration_ms": track["duration_ms"],
                    "preview_url": track["preview_url"],
                    "uri": track["uri"]  # Important for adding to playlist
                }
                formatted_tracks.append(formatted_track)

            return {"tracks": formatted_tracks}

    except httpx.HTTPStatusError as e:
        error_detail = "Failed to search tracks"
        if e.response.status_code == 401:
            error_detail = "Invalid or expired Spotify access token"
        elif e.response.status_code == 429:
            error_detail = "Too many requests to Spotify API"
        raise HTTPException(
            status_code=e.response.status_code,
            detail=error_detail
        )
    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Failed to connect to Spotify API"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )