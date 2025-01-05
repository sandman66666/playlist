# backend/api/__init__.py
from .auth import router as auth_router, validate_token_string
from .playlist import router as playlist_router
from .search import router as search_router
from .brands import router as brands_router

# Export the routers and utilities
__all__ = [
    'auth_router',
    'playlist_router',
    'search_router',
    'brands_router',
    'validate_token_string'
]

# Make routers available at the package level
auth = auth_router
playlist = playlist_router
search = search_router
brands = brands_router