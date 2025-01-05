# backend/api/auth.py
from fastapi import APIRouter, HTTPException, Depends, Header, Body
from spotipy.oauth2 import SpotifyOAuth
from typing import Optional, Dict
import logging
import os

router = APIRouter()
logger = logging.getLogger(__name__)

__all__ = ['router', 'validate_token_string']

def get_auth_manager():
    """Create SpotifyOAuth manager with configured scopes"""
    scopes = [
        'playlist-read-private',
        'playlist-read-collaborative',
        'playlist-modify-public',
        'playlist-modify-private',
        'user-library-read',
        'user-read-private',
        'user-read-email'
    ]
    
    try:
        redirect_uri = os.getenv('SPOTIFY_REDIRECT_URI')
        logger.info(f"Using redirect URI: {redirect_uri}")
        
        auth_manager = SpotifyOAuth(
            client_id=os.getenv('SPOTIFY_CLIENT_ID'),
            client_secret=os.getenv('SPOTIFY_CLIENT_SECRET'),
            redirect_uri=redirect_uri,
            scope=' '.join(scopes),
            open_browser=False
        )
        logger.info("Created SpotifyOAuth manager")
        return auth_manager
    except Exception as e:
        logger.error(f"Error creating SpotifyOAuth manager: {str(e)}")
        raise

def validate_token_string(token: Optional[str] = Header(None)) -> str:
    """Validate the authorization token"""
    if not token:
        raise HTTPException(status_code=401, detail="Authorization token is required")
    
    try:
        auth_manager = get_auth_manager()
        if not auth_manager.validate_token(token):
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return token
    except Exception as e:
        logger.error(f"Error validating token: {str(e)}")
        raise HTTPException(status_code=401, detail="Token validation failed")

@router.get("/login")
async def login():
    """Generate login URL for Spotify OAuth"""
    try:
        auth_manager = get_auth_manager()
        auth_url = auth_manager.get_authorize_url()
        logger.info(f"Generated auth URL: {auth_url}")
        return {"auth_url": auth_url}
    except Exception as e:
        logger.error(f"Error generating login URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/callback")
async def callback(code: str = Body(..., embed=True)):
    """Handle Spotify OAuth callback"""
    try:
        auth_manager = get_auth_manager()
        token_info = auth_manager.get_access_token(code)
        
        if not token_info or 'access_token' not in token_info:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        
        logger.info("Successfully obtained access token")
        return {
            "access_token": token_info["access_token"],
            "expires_in": token_info.get("expires_in"),
            "refresh_token": token_info.get("refresh_token")
        }
    except Exception as e:
        logger.error(f"Error in callback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh")
async def refresh_token(refresh_token: str = Body(..., embed=True)):
    """Refresh an expired access token"""
    try:
        auth_manager = get_auth_manager()
        token_info = auth_manager.refresh_access_token(refresh_token)
        
        if not token_info or 'access_token' not in token_info:
            raise HTTPException(status_code=400, detail="Failed to refresh token")
        
        logger.info("Successfully refreshed access token")
        return {
            "access_token": token_info["access_token"],
            "expires_in": token_info.get("expires_in"),
            "refresh_token": token_info.get("refresh_token")
        }
    except Exception as e:
        logger.error(f"Error refreshing token: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))