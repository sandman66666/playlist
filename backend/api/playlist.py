from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
from datetime import datetime
from pydantic import BaseModel, Field

from ..database import get_db
from ..models import Playlist, Track, BrandProfile

router = APIRouter()

# Pydantic models for request/response validation
class PlaylistCreate(BaseModel):
    brand_id: str
    name: str
    description: Optional[str] = None
    spotify_id: Optional[str] = None
    metadata: Optional[Dict] = Field(default_factory=dict)

class PlaylistResponse(BaseModel):
    id: str
    brand_id: str
    name: str
    description: Optional[str]
    spotify_id: Optional[str]
    metadata: Optional[Dict]
    created_at: datetime
    updated_at: datetime

class TrackCreate(BaseModel):
    spotify_id: str
    name: str
    artist: str
    album: Optional[str] = None
    duration_ms: Optional[int] = None
    preview_url: Optional[str] = None
    metadata: Optional[Dict] = Field(default_factory=dict)

class TrackResponse(BaseModel):
    id: str
    spotify_id: str
    name: str
    artist: str
    album: Optional[str]
    duration_ms: Optional[int]
    preview_url: Optional[str]
    metadata: Optional[Dict]
    created_at: datetime
    updated_at: datetime

# Playlist endpoints
@router.post("/playlists/", response_model=PlaylistResponse)
async def create_playlist(playlist: PlaylistCreate, db: Session = Depends(get_db)):
    # Verify brand exists
    brand = db.query(BrandProfile).filter(BrandProfile.id == playlist.brand_id).first()
    if not brand:
        raise HTTPException(status_code=404, detail="Brand not found")

    db_playlist = Playlist(
        brand_id=playlist.brand_id,
        name=playlist.name,
        description=playlist.description,
        spotify_id=playlist.spotify_id,
        metadata=playlist.metadata
    )
    db.add(db_playlist)
    try:
        db.commit()
        db.refresh(db_playlist)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_playlist

@router.get("/playlists/", response_model=List[PlaylistResponse])
async def get_playlists(
    brand_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Playlist)
    if brand_id:
        query = query.filter(Playlist.brand_id == brand_id)
    playlists = query.offset(skip).limit(limit).all()
    return playlists

@router.get("/playlists/{playlist_id}", response_model=PlaylistResponse)
async def get_playlist(playlist_id: str, db: Session = Depends(get_db)):
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist

@router.put("/playlists/{playlist_id}", response_model=PlaylistResponse)
async def update_playlist(
    playlist_id: str,
    playlist_update: PlaylistCreate,
    db: Session = Depends(get_db)
):
    db_playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not db_playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    # Update playlist attributes
    for key, value in playlist_update.dict(exclude_unset=True).items():
        setattr(db_playlist, key, value)

    try:
        db.commit()
        db.refresh(db_playlist)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return db_playlist

@router.delete("/playlists/{playlist_id}")
async def delete_playlist(playlist_id: str, db: Session = Depends(get_db)):
    db_playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not db_playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    try:
        db.delete(db_playlist)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    return {"message": "Playlist deleted successfully"}

# Track management endpoints
@router.post("/playlists/{playlist_id}/tracks", response_model=TrackResponse)
async def add_track_to_playlist(
    playlist_id: str,
    track: TrackCreate,
    position: Optional[int] = None,
    db: Session = Depends(get_db)
):
    # Verify playlist exists
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    # Check if track already exists
    db_track = db.query(Track).filter(Track.spotify_id == track.spotify_id).first()
    if not db_track:
        # Create new track if it doesn't exist
        db_track = Track(**track.dict())
        db.add(db_track)
        try:
            db.commit()
            db.refresh(db_track)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

    # Add track to playlist
    if db_track not in playlist.tracks:
        playlist.tracks.append(db_track)
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

    return db_track

@router.get("/playlists/{playlist_id}/tracks", response_model=List[TrackResponse])
async def get_playlist_tracks(playlist_id: str, db: Session = Depends(get_db)):
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")
    return playlist.tracks

@router.delete("/playlists/{playlist_id}/tracks/{track_id}")
async def remove_track_from_playlist(
    playlist_id: str,
    track_id: str,
    db: Session = Depends(get_db)
):
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    track = db.query(Track).filter(Track.id == track_id).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    if track in playlist.tracks:
        playlist.tracks.remove(track)
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=400, detail=str(e))
        return {"message": "Track removed from playlist successfully"}
    else:
        raise HTTPException(status_code=404, detail="Track not found in playlist")

@router.put("/playlists/{playlist_id}/tracks/reorder")
async def reorder_playlist_tracks(
    playlist_id: str,
    track_positions: List[Dict[str, int]],  # List of {track_id: position}
    db: Session = Depends(get_db)
):
    playlist = db.query(Playlist).filter(Playlist.id == playlist_id).first()
    if not playlist:
        raise HTTPException(status_code=404, detail="Playlist not found")

    try:
        # Update track positions in the association table
        for track_pos in track_positions:
            track_id = track_pos["track_id"]
            position = track_pos["position"]
            
            # Update the position in the association table
            stmt = playlist_tracks.update().where(
                playlist_tracks.c.playlist_id == playlist_id,
                playlist_tracks.c.track_id == track_id
            ).values(position=position)
            
            db.execute(stmt)
        
        db.commit()
        return {"message": "Playlist tracks reordered successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))