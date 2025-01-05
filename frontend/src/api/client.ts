// src/api/client.ts
import axios, { AxiosInstance } from 'axios';
import { TokenInfo, Brand, BrandProfile, PlaylistTrack, MusicSuggestion, Playlist } from '../types';

// Safe way to access environment variables in Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const IS_PROD = import.meta.env.PROD;

class ApiClientClass {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('spotify_token');
        if (token) {
          const tokenInfo: TokenInfo = JSON.parse(token);
          config.headers.Authorization = `Bearer ${tokenInfo.access_token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  // Auth methods
  async login(): Promise<string> {
    const response = await this.client.get<{ auth_url: string }>('/auth/login');
    return response.data.auth_url;
  }

  // Brand methods
  async getBrands(): Promise<Brand[]> {
    const response = await this.client.get('/brands');
    return response.data.brands;
  }

  async getBrandProfile(brandId: string): Promise<BrandProfile> {
    const response = await this.client.get(`/brands/${brandId}`);
    return response.data;
  }

  async createBrandProfile(data: Partial<Brand>): Promise<Brand> {
    const response = await this.client.post('/brands', data);
    return response.data;
  }

  async suggestMusic(brandProfile: BrandProfile): Promise<MusicSuggestion[]> {
    const response = await this.client.post('/brands/suggest-music', brandProfile);
    return response.data.suggestions;
  }

  // Playlist methods
  async getPlaylists(): Promise<Playlist[]> {
    const response = await this.client.get('/playlist/user');
    return response.data.playlists;
  }

  async searchTracks(query: string): Promise<PlaylistTrack[]> {
    const response = await this.client.get(`/search/tracks?q=${encodeURIComponent(query)}`);
    return response.data.tracks;
  }

  async createPlaylist(brandId: string, suggestions: MusicSuggestion[]): Promise<{ playlist_id: string; playlist_url: string }> {
    const response = await this.client.post('/brands/create-playlist', {
      brand_id: brandId,
      suggestions,
    });
    return response.data;
  }
}

export const apiClient = new ApiClientClass();