// src/hooks/useQueries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { Brand, BrandProfile, MusicSuggestion } from '../types';

// Query Keys
export const queryKeys = {
  brands: ['brands'] as const,
  brand: (id: string) => ['brand', id] as const,
  suggestions: (brandId: string) => ['suggestions', brandId] as const,
};

// Brand Queries
export function useBrands() {
  return useQuery({
    queryKey: queryKeys.brands,
    queryFn: () => apiClient.getBrands(),
    staleTime: 5 * 60 * 1000, // 5 minutes
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
    mutationFn: (brandData: Partial<BrandProfile>) => 
      apiClient.createBrandProfile(brandData),
    onSuccess: (newBrand) => {
      // Update brands list
      queryClient.setQueryData<Brand[]>(queryKeys.brands, (old = []) => [
        ...old,
        newBrand,
      ]);
      // Set the new brand profile in cache
      queryClient.setQueryData(
        queryKeys.brand(newBrand.id),
        newBrand
      );
    },
  });
}

export function useSuggestMusic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandProfile: BrandProfile) => 
      apiClient.suggestMusic(brandProfile),
    onSuccess: (suggestions, brandProfile) => {
      queryClient.setQueryData(
        queryKeys.suggestions(brandProfile.id),
        suggestions
      );
    },
  });
}

export function useCreatePlaylist() {
  return useMutation({
    mutationFn: ({ brandId, suggestions }: {
      brandId: string;
      suggestions: MusicSuggestion[];
    }) => apiClient.createPlaylist(brandId, suggestions),
  });
}

// Track Search Query
export function useTrackSearch(query: string) {
  return useQuery({
    queryKey: ['tracks', query],
    queryFn: () => apiClient.searchTracks(query),
    enabled: Boolean(query),
    staleTime: 60 * 1000, // 1 minute
  });
}