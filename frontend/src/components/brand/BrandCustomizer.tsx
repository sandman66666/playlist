import React, { useState } from 'react';
import { useBrandProfile, useSuggestMusic, useCreatePlaylist } from '../../hooks/useSpotify';
import { FormSection, Button } from '../shared/Form';
import { Modal } from '../shared/Modal';
import { BrandProfile, MusicSuggestion } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface BrandCustomizerProps {
  brandId: string;
}

export const BrandCustomizer: React.FC<BrandCustomizerProps> = ({ brandId }) => {
  const { showToast } = useToast();
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Queries and Mutations
  const { 
    data: brandProfile,
    isLoading: isLoadingProfile 
  } = useBrandProfile(brandId);
  
  const suggestMusicMutation = useSuggestMusic();
  const createPlaylistMutation = useCreatePlaylist();

  const handleGeneratePlaylist = async () => {
    if (!brandProfile) return;

    try {
      // First, get music suggestions
      const suggestions = await suggestMusicMutation.mutateAsync(brandProfile);
      
      // Then create the playlist
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
          <div className="space-y-4">
            <h4 className="font-medium">Brand Essence</h4>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-600">Core Identity</p>
              <p className="mt-1">{brandProfile.brand_essence.core_identity}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border">
              <p className="text-sm text-gray-600">Brand Voice</p>
              <p className="mt-1">{brandProfile.brand_essence.brand_voice}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Visual Language</h4>
            <ul className="list-disc pl-5 space-y-2">
              {brandProfile.aesthetic_pillars.visual_language.map((item, index) => (
                <li key={index} className="text-gray-700">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </FormSection>

      {/* Music Generation */}
      <FormSection
        title="Music Profile"
        description="Generate a playlist that matches your brand's identity"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Music Generation</h4>
              <p className="text-sm text-gray-500 mt-1">
                Our AI will analyze your brand profile and suggest music that matches your identity
              </p>
            </div>
            <div className="space-x-4">
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
          </div>
        </div>
      </FormSection>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Music Generation Settings"
      >
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Brand Elements Used for Generation</h4>
            <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600">
              <li>Core Identity: {brandProfile.brand_essence.core_identity}</li>
              <li>Brand Voice: {brandProfile.brand_essence.brand_voice}</li>
              <li>
                Visual Language: {brandProfile.aesthetic_pillars.visual_language.join(', ')}
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Generation Process</h4>
            <p className="text-sm text-gray-600">
              Our AI analyzes your brand's identity and matches it with musical elements
              including tempo, mood, genre, and lyrical themes to create a cohesive playlist
              that represents your brand.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};