// src/api/client.ts
import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { TokenInfo, Brand, BrandProfile, PlaylistTrack } from '../types';
import config from '../config';

// API Response Types
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

interface ErrorResponse {
  detail: string;
  status: number;
}

// API Client Class
class ApiClient {
  private client: AxiosInstance;
  private retryCount: number = 3;
  private retryDelay: number = 1000;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request Interceptor
    this.client.interceptors.request.use(
      async (config) => {
        const token = localStorage.getItem('spotify_token');
        if (token) {
          const tokenInfo: TokenInfo = JSON.parse(token);
          config.headers.Authorization = `Bearer ${tokenInfo.access_token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response Interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Implement retry logic for network errors
        if (error.message === 'Network Error' && !originalRequest._retry) {
          originalRequest._retry = true;
          return this.retryRequest(originalRequest);
        }

        // Handle token expiration
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          const newToken = await this.refreshToken();
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private async retryRequest(config: any): Promise<AxiosResponse> {
    let retries = 0;
    while (retries < this.retryCount) {
      try {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (retries + 1)));
        return await this.client(config);
      } catch (error) {
        retries++;
        if (retries === this.retryCount) {
          throw error;
        }
      }
    }
    throw new Error('Max retries reached');
  }

  private handleError(error: AxiosError): ErrorResponse {
    if (error.response) {
      return {
        detail: error.response.data.detail || 'An error occurred',
        status: error.response.status
      };
    }
    return {
      detail: error.message || 'Network error',
      status: 500
    };
  }

  private async refreshToken(): Promise<string | null> {
    try {
      const storedToken = localStorage.getItem('spotify_token');
      if (!storedToken) return null;

      const tokenInfo: TokenInfo = JSON.parse(storedToken);
      const response = await this.client.post<TokenInfo>(
        config.endpoints.auth.refresh,
        { refresh_token: tokenInfo.refresh_token }
      );

      if (response.data) {
        localStorage.setItem('spotify_token', JSON.stringify(response.data));
        return response.data.access_token;
      }
      return null;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return null;
    }
  }

  // Auth Endpoints
  async login(): Promise<string> {
    const response = await this.client.get<{ auth_url: string }>(config.endpoints.auth.login);
    return response.data.auth_url;
  }

  async validateToken(tokenInfo: TokenInfo): Promise<boolean> {
    try {
      const response = await this.client.post(
        config.endpoints.auth.validate,
        { token_info: tokenInfo }
      );
      return response.data.valid;
    } catch {
      return false;
    }
  }

  // Brand Endpoints
  async getBrands(): Promise<Brand[]> {
    const response = await this.client.get<ApiResponse<{ brands: Brand[] }>>(
      config.endpoints.brands.list
    );
    return response.data.data.brands;
  }

  async getBrandProfile(brandId: string): Promise<BrandProfile> {
    const response = await this.client.get<ApiResponse<BrandProfile>>(
      config.endpoints.brands.details(brandId)
    );
    return response.data.data;
  }

  async createBrandProfile(brandData: Partial<BrandProfile>): Promise<BrandProfile> {
    const response = await this.client.post<ApiResponse<BrandProfile>>(
      config.endpoints.brands.list,
      brandData
    );
    return response.data.data;
  }

  async suggestMusic(brandProfile: BrandProfile): Promise<MusicSuggestion[]> {
    const response = await this.client.post<ApiResponse<{ suggestions: MusicSuggestion[] }>>(
      config.endpoints.brands.suggestMusic,
      brandProfile
    );
    return response.data.data.suggestions;
  }

  // Playlist Endpoints
  async searchTracks(query: string): Promise<PlaylistTrack[]> {
    const response = await this.client.get<ApiResponse<{ tracks: PlaylistTrack[] }>>(
      `${config.endpoints.playlist.search}?q=${encodeURIComponent(query)}`
    );
    return response.data.data.tracks;
  }

  async createPlaylist(brandId: string, suggestions: MusicSuggestion[]): Promise<{
    playlist_id: string;
    playlist_url: string;
  }> {
    const response = await this.client.post(
      config.endpoints.brands.createPlaylist,
      { brand_id: brandId, suggestions }
    );
    return response.data;
  }
}

export const apiClient = new ApiClient();