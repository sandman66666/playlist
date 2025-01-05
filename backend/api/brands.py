from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Dict, List
import json
import os
import logging
import random
import asyncio
import traceback
from sqlalchemy.orm import Session

import spotipy
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv

# For Anthropic
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT

# Import database and models
from ..database import get_db
from ..models import BrandProfile

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("")
async def get_all_brands(db: Session = Depends(get_db)):
    """Get all brand profiles"""
    try:
        brands = db.query(BrandProfile).all()
        return {
            "brands": [{
                "id": brand.id,
                "name": brand.name,
                "description": brand.data.get("description", ""),
                "core_identity": brand.data.get("brand_essence", {}).get("core_identity", ""),
                "status": brand.data.get("status", "pending_approval")
            } for brand in brands]
        }
    except Exception as e:
        logger.error(f"Error getting brands: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{brand_id}")
async def get_brand_profile(brand_id: str, db: Session = Depends(get_db)):
    """Get a specific brand profile"""
    try:
        brand = db.query(BrandProfile).filter(BrandProfile.id == brand_id).first()
        if not brand:
            raise HTTPException(status_code=404, detail=f"Brand not found: {brand_id}")
        return brand.data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting brand {brand_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def generate_brand_profile(brand_name: str) -> Dict:
    """Generate comprehensive brand profile using Claude"""
    try:
        logger.info(f"Starting brand profile generation for {brand_name}")
        
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.error("ANTHROPIC_API_KEY not found in environment variables")
            raise ValueError("ANTHROPIC_API_KEY not set")

        logger.info("Initializing Anthropic client")
        client = Anthropic(api_key=api_key.strip())
        await asyncio.sleep(1)

        user_prompt = f"""
You are a luxury brand strategist. For the brand "{brand_name}", create a detailed brand profile following this exact JSON structure:

{{
    "brand": "{brand_name}",
    "description": "A comprehensive description of the brand's identity, heritage, and market position",
    "brand_essence": {{
        "core_identity": "Key brand identity traits",
        "heritage": "Brand's history and heritage statement",
        "brand_voice": "Brand's communication style and tone"
    }},
    "aesthetic_pillars": {{
        "visual_language": [
            "Key visual element 1",
            "Key visual element 2",
            "Key visual element 3",
            "Key visual element 4",
            "Key visual element 5"
        ],
        "emotional_attributes": [
            "Emotional attribute 1",
            "Emotional attribute 2",
            "Emotional attribute 3",
            "Emotional attribute 4",
            "Emotional attribute 5"
        ],
        "signature_elements": [
            "Signature element 1",
            "Signature element 2",
            "Signature element 3",
            "Signature element 4",
            "Signature element 5"
        ]
    }},
    "cultural_positioning": {{
        "philosophy": "Brand philosophy statement",
        "core_values": [
            "Core value 1",
            "Core value 2",
            "Core value 3",
            "Core value 4",
            "Core value 5"
        ],
        "cultural_codes": [
            "Cultural code 1",
            "Cultural code 2",
            "Cultural code 3",
            "Cultural code 4",
            "Cultural code 5"
        ]
    }},
    "target_mindset": {{
        "aspirations": [
            "Aspiration 1",
            "Aspiration 2",
            "Aspiration 3",
            "Aspiration 4",
            "Aspiration 5"
        ],
        "lifestyle_attributes": [
            "Lifestyle attribute 1",
            "Lifestyle attribute 2",
            "Lifestyle attribute 3",
            "Lifestyle attribute 4",
            "Lifestyle attribute 5"
        ]
    }},
    "brand_expressions": {{
        "tone": [
            "Tone attribute 1",
            "Tone attribute 2",
            "Tone attribute 3",
            "Tone attribute 4",
            "Tone attribute 5"
        ],
        "experience": [
            "Experience element 1",
            "Experience element 2",
            "Experience element 3",
            "Experience element 4",
            "Experience element 5"
        ]
    }},
    "status": "pending_approval"
}}

Ensure the response is valid JSON and maintains this exact structure. Make the content sophisticated and fitting for a luxury/premium brand positioning. Replace all placeholder text with actual, meaningful content specific to {brand_name}. If you don't have enough information about the brand, indicate this in the description field and I will fall back to manual input.
"""

        logger.info("Sending request to Claude API")
        prompt = f"{HUMAN_PROMPT}{user_prompt}{AI_PROMPT}"
        response = client.completions.create(
            model="claude-2",
            prompt=prompt,
            max_tokens_to_sample=2000,
            stop_sequences=[HUMAN_PROMPT]
        )

        await asyncio.sleep(1)

        logger.info("Processing Claude API response")
        text_response = response.completion
        logger.info(f"Raw response from Claude: {text_response}")

        json_start = text_response.find('{')
        json_end = text_response.rfind('}') + 1
        
        if json_start >= 0 and json_end > json_start:
            json_content = text_response[json_start:json_end]
            try:
                data = json.loads(json_content)
                logger.info("Successfully parsed JSON response")
                
                # Check if Claude indicated insufficient information
                description = data.get("description", "").lower()
                if "don't have enough information" in description or "insufficient information" in description:
                    logger.info("Claude indicated insufficient information")
                    raise ValueError("Insufficient brand information")
                    
                return data
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse JSON: {str(e)}")
                logger.error(f"JSON content: {json_content}")
                raise
        else:
            logger.error("No JSON content found in Claude response")
            raise ValueError("Failed to extract valid JSON from Claude response")

    except Exception as e:
        logger.error(f"Error generating brand profile: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise

@router.post("")
async def create_brand_profile(brand_data: Dict, db: Session = Depends(get_db)):
    """Create a new brand profile with Claude-generated assessment"""
    try:
        logger.info(f"Starting brand profile creation for: {brand_data}")
        
        if "brand" not in brand_data:
            raise HTTPException(status_code=400, detail="Brand name required")
        
        brand_id = brand_data["brand"].lower().replace(" ", "_")
        
        # Check if brand already exists
        existing_brand = db.query(BrandProfile).filter(BrandProfile.id == brand_id).first()
        if existing_brand:
            raise HTTPException(status_code=400, detail=f"Brand exists: {brand_id}")

        try:
            # Try to generate profile with Claude
            logger.info("Generating brand profile with Claude")
            brand_profile = await generate_brand_profile(brand_data["brand"])
            needs_manual_input = False
        except Exception as e:
            logger.warning(f"Claude generation failed: {str(e)}")
            # Fall back to manual input template
            needs_manual_input = True
            brand_profile = {
                "brand": brand_data["brand"],
                "description": "",
                "brand_essence": {
                    "core_identity": "",
                    "heritage": "",
                    "brand_voice": ""
                },
                "aesthetic_pillars": {
                    "visual_language": ["", "", "", "", ""],
                    "emotional_attributes": ["", "", "", "", ""],
                    "signature_elements": ["", "", "", "", ""]
                },
                "cultural_positioning": {
                    "philosophy": "",
                    "core_values": ["", "", "", "", ""],
                    "cultural_codes": ["", "", "", "", ""]
                },
                "target_mindset": {
                    "aspirations": ["", "", "", "", ""],
                    "lifestyle_attributes": ["", "", "", "", ""]
                },
                "brand_expressions": {
                    "tone": ["", "", "", "", ""],
                    "experience": ["", "", "", "", ""]
                },
                "status": "pending_manual_input"
            }
        
        # Create new brand profile in database
        new_brand = BrandProfile(
            id=brand_id,
            name=brand_data["brand"],
            data=brand_profile
        )
        db.add(new_brand)
        db.commit()
        
        return {
            "message": "Brand profile created",
            "brand_id": brand_id,
            "profile": brand_profile,
            "needs_manual_input": needs_manual_input
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating brand: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{brand_id}/approve")
async def approve_brand_profile(brand_id: str, db: Session = Depends(get_db)):
    """Approve a brand profile to enable playlist creation"""
    try:
        brand = db.query(BrandProfile).filter(BrandProfile.id == brand_id).first()
        if not brand:
            raise HTTPException(status_code=404, detail=f"Brand not found: {brand_id}")

        # Update status in the JSON data
        brand_data = brand.data
        brand_data["status"] = "approved"
        brand.data = brand_data
        
        db.commit()
        return {"message": "Brand profile approved"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving brand {brand_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suggest-music")
async def suggest_music(brand_profile: Dict):
    """Suggest music for an approved brand profile"""
    try:
        # Check if brand is approved
        if brand_profile.get("status") != "approved":
            raise HTTPException(
                status_code=400,
                detail="Brand profile must be approved before suggesting music"
            )

        logger.info("Starting suggest-music endpoint")
        logger.info(f"Brand Profile: {brand_profile}")
        
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.error("ANTHROPIC_API_KEY not found")
            raise ValueError("ANTHROPIC_API_KEY not set")
            
        logger.info("Got API key, initializing Anthropic client")
        client = Anthropic(api_key=api_key.strip())

        await asyncio.sleep(1)

        brand_name = brand_profile.get("brand", "Unknown Brand")
        core_identity = brand_profile.get("brand_essence", {}).get("core_identity", "")
        brand_values = brand_profile.get("cultural_positioning", {}).get("core_values", [])
        target_mindset = brand_profile.get("target_mindset", {})

        user_prompt = f"""
You are a music curator. Suggest 10 songs that match this brand:
Brand: {brand_name}
Identity: {core_identity}
Values: {', '.join(brand_values)}
Target Mindset: {json.dumps(target_mindset)}

Format each suggestion as:
Song: [title]
Artist: [artist name]
Why it fits: [one sentence explaining how it matches the brand values and identity]
"""

        prompt = f"{HUMAN_PROMPT}{user_prompt}{AI_PROMPT}"
        logger.info("Sending request to Anthropic using completions.create()")
        response = client.completions.create(
            model="claude-2",
            prompt=prompt,
            max_tokens_to_sample=1500,
            stop_sequences=[HUMAN_PROMPT]
        )

        await asyncio.sleep(1)

        text_response = response.completion
        logger.info(f"Anthropic response:\n{text_response}")

        suggestions = []
        song_sections = text_response.split("\n\n")
        for section in song_sections:
            if "Song:" in section and "Artist:" in section:
                lines = section.strip().split("\n")
                track_line = lines[0].replace("Song:", "").strip()
                artist_line = lines[1].replace("Artist:", "").strip()
                reason_line = ""
                if len(lines) > 2:
                    reason_line = " ".join(lines[2:]).replace("Why it fits:", "").strip()

                suggestions.append({
                    "track": track_line,
                    "artist": artist_line,
                    "reason": reason_line
                })

        return {"suggestions": suggestions}

    except Exception as e:
        logger.error(f"Error in suggest-music: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-playlist")
async def create_brand_playlist(payload: Dict, authorization: str = Header(None), db: Session = Depends(get_db)):
    """Create or update playlist for an approved brand"""
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No authorization header")
            
        token = authorization.replace('Bearer ', '')
        brand_id = payload.get("brand_id")
        suggestions = payload.get("suggestions")

        if not all([brand_id, suggestions]):
            raise HTTPException(status_code=422, detail="Missing required fields")

        # Get brand from database
        brand = db.query(BrandProfile).filter(BrandProfile.id == brand_id).first()
        if not brand:
            raise HTTPException(status_code=404, detail=f"Brand not found: {brand_id}")

        # Check if brand is approved
        if brand.data.get("status") != "approved":
            raise HTTPException(
                status_code=400,
                detail="Brand profile must be approved before creating playlist"
            )

        # Store suggestions in brand profile
        brand_data = brand.data
        brand_data['suggested_songs'] = suggestions
        brand.data = brand_data
        db.commit()

        # Create Spotify client with access token
        sp = spotipy.Spotify(auth=token)
        
        try:
            user_id = sp.current_user()["id"]
            logger.info(f"Creating playlist for user: {user_id}")
        except Exception as e:
            logger.error(f"Error getting user profile: {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        await asyncio.sleep(1)

        playlist_name = f"{brand.name} Brand Playlist"
        description = f"A curated playlist for {brand.name}"

        # Search for existing playlist
        existing_playlist = None
        offset = 0
        limit = 50
        
        while True:
            playlists = sp.user_playlists(user_id, limit=limit, offset=offset)
            logger.info(f"Checking batch of {len(playlists['items'])} playlists")
            
            for pl in playlists['items']:
                if pl['name'] == playlist_name:
                    existing_playlist = pl
                    logger.info(f"Found existing playlist: {pl['id']}")
                    break

            if existing_playlist or not playlists['next']:
                break
                
            offset += limit
            await asyncio.sleep(0.5)

        # Search for new tracks
        new_track_uris = []
        not_found = []
        for item in suggestions:
            try:
                await asyncio.sleep(0.2)
                
                query = f"track:{item['track']} artist:{item['artist']}"
                results = sp.search(q=query, type='track', limit=1)
                if results['tracks']['items']:
                    track = results['tracks']['items'][0]
                    new_track_uris.append(track['uri'])
                    item['spotify_data'] = {
                        'uri': track['uri'],
                        'preview_url': track['preview_url'],
                        'external_url': track['external_urls']['spotify']
                    }
                else:
                    not_found.append(f"{item['track']} by {item['artist']}")
            except Exception as e:
                logger.error(f"Error searching for track {item['track']}: {str(e)}")
                continue

        # Update brand profile with Spotify track data
        brand_data['suggested_songs'] = suggestions
        brand.data = brand_data
        db.commit()

        if existing_playlist:
            playlist_id = existing_playlist['id']
            logger.info(f"Updating existing playlist: {playlist_id}")
            
            # Get current tracks
            current_tracks = []
            results = sp.playlist_items(playlist_id)
            while results:
                current_tracks.extend([item['track']['uri'] for item in results['items'] if item['track']])
                if results['next']:
                    results = sp.next(results)
                    await asyncio.sleep(0.5)
                else:
                    break

            total_tracks = len(current_tracks)
            if total_tracks > 0:
                # Keep half of the existing tracks
                tracks_to_keep = total_tracks // 2
                kept_tracks = random.sample(current_tracks, min(tracks_to_keep, len(current_tracks)))
                
                # Remove all current tracks and add back kept tracks + new tracks
                logger.info(f"Replacing playlist tracks. Keeping {len(kept_tracks)} existing tracks")
                all_tracks = kept_tracks + new_track_uris[:total_tracks - len(kept_tracks)]
                
                await asyncio.sleep(1)
                sp.playlist_replace_items(playlist_id, all_tracks)
            else:
                # If playlist is empty, just add all new tracks
                if new_track_uris:
                    await asyncio.sleep(1)
                    sp.playlist_add_items(playlist_id, new_track_uris)
            
        else:
            logger.info("Creating new playlist")
            try:
                await asyncio.sleep(1)
                
                new_playlist = sp.user_playlist_create(
                    user=user_id,
                    name=playlist_name,
                    public=False,
                    description=description
                )
                playlist_id = new_playlist['id']
                if new_track_uris:
                    await asyncio.sleep(1)
                    sp.playlist_add_items(playlist_id, new_track_uris)
            except Exception as e:
                logger.error(f"Error creating playlist: {str(e)}")
                raise HTTPException(status_code=500, detail="Failed to create playlist")

        return {
            "playlist_id": playlist_id,
            "tracks_added": len(new_track_uris),
            "tracks_not_found": not_found,
            "playlist_url": f"https://open.spotify.com/playlist/{playlist_id}"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating or updating playlist: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{brand_id}")
async def update_brand_profile(brand_id: str, brand_data: Dict, db: Session = Depends(get_db)):
    """Update an existing brand profile"""
    try:
        brand = db.query(BrandProfile).filter(BrandProfile.id == brand_id).first()
        if not brand:
            raise HTTPException(status_code=404, detail=f"Brand not found: {brand_id}")

        brand.data = brand_data
        db.commit()
        return {"message": "Brand profile updated"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating brand {brand_id}: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{brand_id}")
async def delete_brand_profile(brand_id: str, db: Session = Depends(get_db)):
    """Delete a brand profile"""
    try:
        brand = db.query(BrandProfile).filter(BrandProfile.id == brand_id).first()
        if not brand:
            raise HTTPException(status_code=404, detail=f"Brand not found: {brand_id}")

        db.delete(brand)
        db.commit()
        return {"message": "Brand profile deleted"}
    except Exception as e:
        logger.error(f"Error deleting brand {brand_id}: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))