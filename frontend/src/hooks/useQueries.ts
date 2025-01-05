// src/hooks/useQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { Brand, BrandProfile, MusicSuggestion, PlaylistTrack } from '../types';

// Query Keys
const queryKeys = {
  brands: ['brands'] as const,
  brand: (id: string) => ['brand', id] as const,
  playlists: ['playlists'] as const,
  search: (query: string) => ['search', query] as const,
};

// Brand Queries
export function useBrands() {
  return useQuery({
    queryKey: queryKeys.brands,
    queryFn: () => apiClient.getBrands(),
  });
}

export function useBrandProfile(brandId: string) {
  return useQuery({
    queryKey: queryKeys.brand(brandId),
    queryFn: () => apiClient.getBrandProfile(brandId),
    enabled: Boolean(brandId),
  });
}

// Brand Mutations
export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandData: Partial<Brand>) => 
      apiClient.createBrandProfile(brandData),
    onSuccess: (newBrand) => {
      queryClient.setQueryData<Brand[]>(queryKeys.brands, (old = []) => [...old, newBrand]);
    },
  });
}

export function useSuggestMusic() {
  return useMutation({
    mutationFn: (brandProfile: BrandProfile) =>
      apiClient.suggestMusic(brandProfile),
  });
}

export function useCreatePlaylist() {
  return useMutation({
    mutationFn: ({ brandId, suggestions }: { brandId: string; suggestions: MusicSuggestion[] }) =>
      apiClient.createPlaylist(brandId, suggestions),
  });
}

// Playlist Queries
export function useSpotifyPlaylists() {
  return useQuery({
    queryKey: queryKeys.playlists,
    queryFn: () => apiClient.getPlaylists(),
  });
}

export function useSpotifySearch(query: string) {
  return useQuery({
    queryKey: queryKeys.search(query),
    queryFn: () => apiClient.searchTracks(query),
    enabled: Boolean(query),
  });
}