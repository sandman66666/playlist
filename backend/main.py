# backend/main.py
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://playlist-mgr-39a919ee8105.herokuapp.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
try:
    from backend.api import auth_router, playlist_router, search_router, brands_router
    
    # Include routers
    logger.info("Mounting routes...")
    
    app.include_router(auth_router, prefix="/auth", tags=["auth"])
    logger.info("✓ Auth routes mounted")
    
    app.include_router(playlist_router, prefix="/playlist", tags=["playlist"])
    logger.info("✓ Playlist routes mounted")
    
    app.include_router(search_router, prefix="/search", tags=["search"])
    logger.info("✓ Search routes mounted")
    
    app.include_router(brands_router, prefix="/brands", tags=["brands"])
    logger.info("✓ Brands routes mounted")
    
except Exception as e:
    logger.error(f"Error mounting routes: {str(e)}")
    raise

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "spotify_configured": bool(os.getenv("SPOTIFY_CLIENT_ID")),
    }