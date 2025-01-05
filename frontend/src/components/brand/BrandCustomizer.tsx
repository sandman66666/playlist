// src/components/brand/BrandCustomizer.tsx
import React, { useState } from 'react';
import { useBrandProfile, useSuggestMusic, useCreatePlaylist } from '../../hooks/useSpotify';
import { FormSection } from '../shared/Form';
import { Button } from '../shared/Button';
import { Modal } from '../shared/Modal';
import { BrandProfile, MusicSuggestion } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface BrandCustomizerProps {
  brandId: string;
}

export const BrandCustomizer: React.FC<BrandCustomizerProps> = ({ brandId }) => {
  const { showToast } = useToast();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  const { 
    data: brandProfile,
    isLoading: isLoadingProfile 
  } = useBrandProfile(brandId);
  
  const suggestMusicMutation = useSuggestMusic();
  const createPlaylistMutation = useCreatePlaylist();

  const handleGeneratePlaylist = async () => {
    if (!brandProfile) return;

    try {
      const suggestions = await suggestMusicMutation.mutateAsync(brandProfile);
      const result = await createPlaylistMutation.mutateAsync({
        brandId,
        suggestions
      });

      showToast('Playlist created successfully!', 'success');
      window.open(result.playlist_url, '_blank');
    } catch (error) {
      showToast('Failed to create playlist', 'error');
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  if (!brandProfile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Brand profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Brand Overview */}
      <FormSection
        title="Brand Overview"
        description="Review and customize your brand's profile"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium">Brand Essence</h4>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-600">Core Identity</p>
              <p className="mt-1">{brandProfile.brand_essence.core_identity}</p>
            </div>
          </div>

          <div>
            <h4 className="font-medium">Visual Language</h4>
            <ul className="list-disc pl-5 space-y-2">
              {brandProfile.aesthetic_pillars.visual_language.map((item: string, index: number) => (
                <li key={index} className="text-gray-700">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </FormSection>

      {/* Controls */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="secondary"
          onClick={() => setShowPreviewModal(true)}
        >
          Preview Settings
        </Button>
        <Button
          onClick={handleGeneratePlaylist}
          isLoading={suggestMusicMutation.isPending || createPlaylistMutation.isPending}
        >
          Generate Playlist
        </Button>
      </div>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Music Generation Settings"
      >
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Generation Settings</h3>
          <div className="space-y-4">
            <p>Based on brand essence and visual language...</p>
          </div>
        </div>
      </Modal>
    </div>
  );
};