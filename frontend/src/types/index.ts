// src/types/index.ts
export interface TokenInfo {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  timestamp?: number;
}

export interface Brand {
  id: string;
  name: string;
  description?: string;
  brand: string;
  status: string;
}

export interface BrandProfile extends Brand {
  brand_essence: {
    core_identity: string;
    heritage: string;
    brand_voice: string;
  };
  aesthetic_pillars: {
    visual_language: string[];
    emotional_attributes: string[];
    signature_elements: string[];
  };
  cultural_positioning: {
    philosophy: string;
    core_values: string[];
    cultural_codes: string[];
  };
  target_mindset: {
    aspirations: string[];
    lifestyle_attributes: string[];
  };
  brand_expressions: {
    tone: string[];
    experience: string[];
  };
}

export interface MusicSuggestion {
  track: string;
  artist: string;
  reason: string;
  spotify_data?: {
    preview_url?: string;
    uri?: string;
  };
}

export interface PlaylistTrack {
  id: string;
  name: string;
  artists: Array<{
    name: string;
    id: string;
  }>;
  album: {
    name: string;
    images: Array<{
      url: string;
      height: number;
      width: number;
    }>;
  };
  uri: string;
  preview_url?: string;
}

export interface PlaylistResponse {
  playlist_id: string;
  playlist_url: string;
}

export interface Playlist {
  id: string;
  name: string;
  images?: Array<{ url: string; height: number; width: number; }>;
  tracks: { total: number };
  owner: { display_name: string };
  isOwner?: boolean;
}