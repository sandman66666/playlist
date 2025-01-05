from sqlalchemy import Column, String, JSON, Integer, ForeignKey, DateTime, Table
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

class BrandProfile(Base):
    __tablename__ = "brand_profiles"

    id = Column(String, primary_key=True)  # brand_id (e.g., "gucci", "nike")
    name = Column(String, nullable=False)   # Brand name
    data = Column(JSON, nullable=False)     # Full brand profile as JSON

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.data.get("description", ""),
            "brand_essence": self.data.get("brand_essence", {}),
            "aesthetic_pillars": self.data.get("aesthetic_pillars", {}),
            "cultural_positioning": self.data.get("cultural_positioning", {}),
            "target_mindset": self.data.get("target_mindset", {}),
            "brand_expressions": self.data.get("brand_expressions", {}),
            "status": self.data.get("status", "pending_approval")
        }

# Association table for playlist tracks
playlist_tracks = Table(
    'playlist_tracks',
    Base.metadata,
    Column('playlist_id', String, ForeignKey('playlists.id'), primary_key=True),
    Column('track_id', String, ForeignKey('tracks.id'), primary_key=True),
    Column('position', Integer),
    Column('added_at', DateTime, default=datetime.utcnow)
)

class Playlist(Base):
    __tablename__ = 'playlists'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    brand_id = Column(String, ForeignKey('brand_profiles.id'))
    name = Column(String, nullable=False)
    description = Column(String)
    spotify_id = Column(String, unique=True)  # Spotify playlist ID
    metadata = Column(JSON)  # Additional playlist metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    brand = relationship("BrandProfile")
    tracks = relationship("Track", secondary=playlist_tracks, back_populates="playlists")

    def to_dict(self):
        return {
            "id": self.id,
            "brand_id": self.brand_id,
            "name": self.name,
            "description": self.description,
            "spotify_id": self.spotify_id,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }

class Track(Base):
    __tablename__ = 'tracks'

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    spotify_id = Column(String, unique=True, nullable=False)  # Spotify track ID
    name = Column(String, nullable=False)
    artist = Column(String, nullable=False)
    album = Column(String)
    duration_ms = Column(Integer)
    preview_url = Column(String)
    metadata = Column(JSON)  # Additional track metadata from Spotify
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    playlists = relationship("Playlist", secondary=playlist_tracks, back_populates="tracks")

    def to_dict(self):
        return {
            "id": self.id,
            "spotify_id": self.spotify_id,
            "name": self.name,
            "artist": self.artist,
            "album": self.album,
            "duration_ms": self.duration_ms,
            "preview_url": self.preview_url,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }