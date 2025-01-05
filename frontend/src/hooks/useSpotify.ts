// src/hooks/useSpotify.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiClient } from '../api/client';
import { Brand, BrandProfile, PlaylistTrack, MusicSuggestion } from '../types';

// Query Keys
export const queryKeys = {
  profile: ['profile'] as const,
  playlists: ['playlists'] as const,
  brands: ['brands'] as const,
  brand: (id: string) => ['brand', id] as const,
  suggestions: (brandId: string) => ['suggestions', brandId] as const,
  search: (query: string) => ['search', query] as const,
};

// Spotify Profile
export const useSpotifyProfile = () => {
  const { token, logout } = useAuth();
  const { showToast } = useToast();

  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => apiClient.getProfile(),
    enabled: !!token,
    onError: (error: Error) => {
      showToast(`Error fetching profile: ${error.message}`, 'error');
      if (error.message.includes('401')) {
        logout();
      }
    },
  });
};

// Playlists
export const useSpotifyPlaylists = () => {
  const { token, logout } = useAuth();
  const { showToast } = useToast();

  return useQuery({
    queryKey: queryKeys.playlists,
    queryFn: () => apiClient.getPlaylists(),
    enabled: !!token,
    onError: (error: Error) => {
      showToast(`Error fetching playlists: ${error.message}`, 'error');
      if (error.message.includes('401')) {
        logout();
      }
    },
  });
};

// Search Tracks
export const useSpotifySearch = (query: string) => {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => apiClient.searchTracks(query),
    enabled: !!token && !!query,
    onError: (error: Error) => {
      showToast(`Search failed: ${error.message}`, 'error');
    },
  });
};

// Brands
export const useBrands = () => {
  const { token } = useAuth();
  const { showToast } = useToast();

  return useQuery({
    queryKey: queryKeys.brands,
    queryFn: () => apiClient.getBrands(),
    enabled: !!token,
    onError: (error: Error) => {
      showToast(`Error fetching brands: ${error.message}`, 'error');
    },
  });
};

export const useBrandProfile = (brandId: string) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: queryKeys.brand(brandId),
    queryFn: () => apiClient.getBrandProfile(brandId),
    enabled: !!token && !!brandId,
  });
};

// Mutations
export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (brandData: Partial<BrandProfile>) => 
      apiClient.createBrandProfile(brandData),
    onSuccess: (newBrand) => {
      queryClient.setQueryData<Brand[]>(queryKeys.brands, (old = []) => [
        ...old,
        newBrand,
      ]);
      queryClient.setQueryData(queryKeys.brand(newBrand.id), newBrand);
      showToast('Brand created successfully', 'success');
      navigate(`/brands/${newBrand.id}`);
    },
    onError: (error: Error) => {
      showToast(`Failed to create brand: ${error.message}`, 'error');
    },
  });
};

export const useSuggestMusic = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: (brandProfile: BrandProfile) => 
      apiClient.suggestMusic(brandProfile),
    onSuccess: (suggestions, brandProfile) => {
      queryClient.setQueryData(
        queryKeys.suggestions(brandProfile.id),
        suggestions
      );
      showToast('Music suggestions generated', 'success');
    },
    onError: (error: Error) => {
      showToast(`Failed to generate suggestions: ${error.message}`, 'error');
    },
  });
};

export const useCreatePlaylist = () => {
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ brandId, suggestions }: {
      brandId: string;
      suggestions: MusicSuggestion[];
    }) => apiClient.createPlaylist(brandId, suggestions),
    onSuccess: (data) => {
      showToast(
        `Playlist created successfully! Open in Spotify: ${data.playlist_url}`,
        'success'
      );
    },
    onError: (error: Error) => {
      showToast(`Failed to create playlist: ${error.message}`, 'error');
    },
  });
};

// Track Management
export const useAddTrackToPlaylist = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ playlistId, trackUri }: { playlistId: string; trackUri: string }) =>
      apiClient.addTrackToPlaylist(playlistId, trackUri),
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries(queryKeys.playlists);
      showToast('Track added to playlist', 'success');
    },
    onError: (error: Error) => {
      showToast(`Failed to add track: ${error.message}`, 'error');
    },
  });
};

export const useRemoveTrackFromPlaylist = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  return useMutation({
    mutationFn: ({ playlistId, trackUri }: { playlistId: string; trackUri: string }) =>
      apiClient.removeTrackFromPlaylist(playlistId, trackUri),
    onSuccess: (_, { playlistId }) => {
      queryClient.invalidateQueries(queryKeys.playlists);
      showToast('Track removed from playlist', 'success');
    },
    onError: (error: Error) => {
      showToast(`Failed to remove track: ${error.message}`, 'error');
    },
  });
};