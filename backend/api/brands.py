from fastapi import APIRouter, HTTPException, Header
from typing import Dict, List
import json
import os
from pathlib import Path
import logging
import random
import asyncio

import spotipy
from spotipy.oauth2 import SpotifyOAuth
from dotenv import load_dotenv

# For Anthropic
from anthropic import Anthropic, HUMAN_PROMPT, AI_PROMPT

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

BRAND_PROFILES_DIR = Path(__file__).parent.parent / "data" / "brand_profiles"

@router.get("")
async def get_all_brands():
    try:
        if not BRAND_PROFILES_DIR.exists():
            BRAND_PROFILES_DIR.mkdir(parents=True, exist_ok=True)
            return {"brands": []}
        
        brand_files = list(BRAND_PROFILES_DIR.glob("*.json"))
        brands = []
        
        for file in brand_files:
            with open(file, 'r') as f:
                brand_data = json.load(f)
                brands.append({
                    "id": file.stem,
                    "name": brand_data.get("brand", file.stem),
                    "description": brand_data.get("description", ""),
                    "core_identity": brand_data.get("brand_essence", {}).get("core_identity", "")
                })
        
        return {"brands": brands}
    except Exception as e:
        logger.error(f"Error getting brands: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{brand_id}")
async def get_brand_profile(brand_id: str):
    try:
        file_path = BRAND_PROFILES_DIR / f"{brand_id}.json"
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Brand not found: {brand_id}")
        
        with open(file_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Error getting brand {brand_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/describe")
async def get_brand_description(brand_data: Dict):
    try:
        logger.info("Starting brand description endpoint")
        brand_name = brand_data.get("brand")
        if not brand_name:
            raise HTTPException(status_code=400, detail="Brand name required")

        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.error("ANTHROPIC_API_KEY not found")
            raise ValueError("ANTHROPIC_API_KEY not set")

        client = Anthropic(api_key=api_key.strip())

        # Add delay before making API call
        await asyncio.sleep(1)

        # Get brand description and profile from Claude with Gucci-like format
        user_prompt = f"""
You are a luxury brand strategist. For the brand "{brand_name}", create a detailed brand profile following this exact JSON structure:

{{
    "description": "A concise 2-3 sentence description of the brand's market position and essence",
    "profile": {{
        "brand_essence": {{
            "core_identity": "One sentence capturing the brand's fundamental essence",
            "brand_voice": "Description of how the brand communicates",
            "brand_personality": "Key personality traits that define the brand"
        }},
        "brand_values": [
            "Value 1",
            "Value 2",
            "Value 3",
            "Value 4"
        ],
        "target_audience": {{
            "primary": "Description of core customer segment",
            "psychographics": "Lifestyle, values, and aspirations of target customers",
            "demographics": "Key demographic characteristics"
        }},
        "aesthetic_pillars": {{
            "visual_language": [
                "Key visual element 1",
                "Key visual element 2",
                "Key visual element 3",
                "Key visual element 4"
            ],
            "design_principles": [
                "Design principle 1",
                "Design principle 2",
                "Design principle 3"
            ]
        }},
        "brand_expression": {{
            "tone_of_voice": "Description of brand's communication style",
            "key_messages": [
                "Message 1",
                "Message 2",
                "Message 3"
            ]
        }}
    }}
}}

Ensure the response is valid JSON and maintains this exact structure. Make the content sophisticated and fitting for a luxury/premium brand positioning.
"""

        prompt = f"{HUMAN_PROMPT}{user_prompt}{AI_PROMPT}"
        response = client.completions.create(
            model="claude-2",
            prompt=prompt,
            max_tokens_to_sample=2000,
            stop_sequences=[HUMAN_PROMPT]
        )

        # Add delay after API call
        await asyncio.sleep(1)

        # Parse the response and extract JSON
        text_response = response.completion
        try:
            # Find JSON content between curly braces
            json_start = text_response.find('{')
            json_end = text_response.rfind('}') + 1
            if json_start >= 0 and json_end > json_start:
                json_content = text_response[json_start:json_end]
                data = json.loads(json_content)
            else:
                # Fallback structure matching Gucci format
                data = {
                    "description": "",
                    "profile": {
                        "brand_essence": {
                            "core_identity": "",
                            "brand_voice": "",
                            "brand_personality": ""
                        },
                        "brand_values": [],
                        "target_audience": {
                            "primary": "",
                            "psychographics": "",
                            "demographics": ""
                        },
                        "aesthetic_pillars": {
                            "visual_language": [],
                            "design_principles": []
                        },
                        "brand_expression": {
                            "tone_of_voice": "",
                            "key_messages": []
                        }
                    }
                }

                # Parse the response manually if needed
                lines = text_response.split('\n')
                current_section = None
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    if line.startswith('Description:'):
                        data['description'] = line.replace('Description:', '').strip()
                    elif line.startswith('Core Identity:'):
                        data['profile']['brand_essence']['core_identity'] = line.replace('Core Identity:', '').strip()
                    elif line.startswith('Brand Voice:'):
                        data['profile']['brand_essence']['brand_voice'] = line.replace('Brand Voice:', '').strip()
                    # Add more manual parsing if needed

        except Exception as e:
            logger.error(f"Error parsing Claude response: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to parse brand profile")

        return data

    except Exception as e:
        logger.error(f"Error in describe endpoint: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/suggest-music")
async def suggest_music(brand_profile: Dict):
    try:
        logger.info("Starting suggest-music endpoint")
        logger.info(f"Brand Profile: {brand_profile}")
        
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.error("ANTHROPIC_API_KEY not found")
            raise ValueError("ANTHROPIC_API_KEY not set")
            
        logger.info("Got API key, initializing Anthropic client")
        client = Anthropic(api_key=api_key.strip())

        # Add delay before API call
        await asyncio.sleep(1)

        brand_name = brand_profile.get("brand", "Unknown Brand")
        core_identity = brand_profile.get("brand_essence", {}).get("core_identity", "")
        brand_values = brand_profile.get("brand_values", [])
        target_audience = brand_profile.get("target_audience", "")

        user_prompt = f"""
You are a music curator. Suggest 10 songs that match this brand:
Brand: {brand_name}
Identity: {core_identity}
Values: {', '.join(brand_values)}
Target Audience: {target_audience}

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

        # Add delay after API call
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
async def create_brand_playlist(payload: Dict, authorization: str = Header(None)):
    """
    If a playlist exists, replace half of its songs with new ones while maintaining the same total count.
    If no playlist exists, create a new one with all suggested songs.
    """
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="No authorization header")
            
        token = authorization.replace('Bearer ', '')
        brand_id = payload.get("brand_id")
        suggestions = payload.get("suggestions")

        if not all([brand_id, suggestions]):
            raise HTTPException(status_code=422, detail="Missing required fields")

        file_path = BRAND_PROFILES_DIR / f"{brand_id}.json"
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Brand not found: {brand_id}")

        # Read existing brand profile
        with open(file_path, 'r') as f:
            brand_profile = json.load(f)

        # Store suggestions in brand profile
        brand_profile['suggested_songs'] = suggestions

        # Write updated profile back to file
        with open(file_path, 'w') as f:
            json.dump(brand_profile, f, indent=2)

        # Create Spotify client with access token
        sp = spotipy.Spotify(auth=token)
        
        try:
            user_id = sp.current_user()["id"]
            logger.info(f"Creating playlist for user: {user_id}")
        except Exception as e:
            logger.error(f"Error getting user profile: {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        # Add delay before Spotify operations
        await asyncio.sleep(1)

        playlist_name = f"{brand_profile['brand']} Brand Playlist"
        description = f"A curated playlist for {brand_profile['brand']}"

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
            # Add small delay between pagination requests
            await asyncio.sleep(0.5)

        # Search for new tracks
        new_track_uris = []
        not_found = []
        for item in suggestions:
            try:
                # Add small delay between track searches
                await asyncio.sleep(0.2)
                
                query = f"track:{item['track']} artist:{item['artist']}"
                results = sp.search(q=query, type='track', limit=1)
                if results['tracks']['items']:
                    track = results['tracks']['items'][0]
                    new_track_uris.append(track['uri'])
                    # Store Spotify track data in suggestions
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
        brand_profile['suggested_songs'] = suggestions
        with open(file_path, 'w') as f:
            json.dump(brand_profile, f, indent=2)

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
                    # Add small delay between pagination requests
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
                
                # Add delay before modifying playlist
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
                # Add delay before creating playlist
                await asyncio.sleep(1)
                
                new_playlist = sp.user_playlist_create(
                    user=user_id,
                    name=playlist_name,
                    public=False,
                    description=description
                )
                playlist_id = new_playlist['id']
                if new_track_uris:
                    # Add delay before adding tracks
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
        raise HTTPException(status_code=500, detail=str(e))

@router.post("")
async def create_brand_profile(brand_data: Dict):
    try:
        if "brand" not in brand_data:
            raise HTTPException(status_code=400, detail="Brand name required")
        
        BRAND_PROFILES_DIR.mkdir(parents=True, exist_ok=True)
        brand_id = brand_data["brand"].lower().replace(" ", "_")
        file_path = BRAND_PROFILES_DIR / f"{brand_id}.json"

        if file_path.exists():
            raise HTTPException(status_code=400, detail=f"Brand exists: {brand_id}")

        with open(file_path, 'w') as f:
            json.dump(brand_data, f, indent=2)

        return {"message": "Brand profile created", "brand_id": brand_id}
    except Exception as e:
        logger.error(f"Error creating brand: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{brand_id}")
async def update_brand_profile(brand_id: str, brand_data: Dict):
    try:
        file_path = BRAND_PROFILES_DIR / f"{brand_id}.json"
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Brand not found: {brand_id}")

        with open(file_path, 'w') as f:
            json.dump(brand_data, f, indent=2)

        return {"message": "Brand profile updated"}
    except Exception as e:
        logger.error(f"Error updating brand {brand_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{brand_id}")
async def delete_brand_profile(brand_id: str):
    try:
        file_path = BRAND_PROFILES_DIR / f"{brand_id}.json"
        if not file_path.exists():
            raise HTTPException(status_code=404, detail=f"Brand not found: {brand_id}")

        os.remove(file_path)
        return {"message": "Brand profile deleted"}
    except Exception as e:
        logger.error(f"Error deleting brand {brand_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))