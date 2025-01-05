// src/components/BrandPlaylist.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Brand, BrandProfile, MusicSuggestion } from '../types';
import {
  useBrands,
  useBrandProfile,
  useCreateBrand,
  useSuggestMusic,
  useCreatePlaylist
} from '../hooks/useQueries';

// AddBrandForm component remains mostly the same, but uses mutation
const AddBrandForm: React.FC<{
  onSubmit: (brandName: string) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [brandName, setBrandName] = useState('');
  const createBrand = useCreateBrand();

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Add New Brand</h3>
      <form onSubmit={(e) => {
        e.preventDefault();
        onSubmit(brandName);
      }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Name
          </label>
          <input
            type="text"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            placeholder="Enter brand name"
            required
            disabled={createBrand.isPending}
          />
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={createBrand.isPending}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {createBrand.isPending ? 'Creating...' : 'Create Brand'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const BrandProfile: React.FC<{
  brandProfile: BrandProfile;
  suggestions: MusicSuggestion[];
  onCreatePlaylist: () => void;
  isCreatingPlaylist: boolean;
}> = ({ brandProfile, suggestions, onCreatePlaylist, isCreatingPlaylist }) => (
  <>
    <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold mb-4">{brandProfile.brand}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-lg font-medium mb-2">Brand Essence</h4>
          <p>{brandProfile.brand_essence.core_identity}</p>
          <p className="mt-2">{brandProfile.brand_essence.brand_voice}</p>
        </div>
        <div>
          <h4 className="text-lg font-medium mb-2">Brand Values</h4>
          <ul className="list-disc pl-5">
            {brandProfile.cultural_positioning.core_values.map((value, idx) => (
              <li key={idx}>{value}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>

    {suggestions.length > 0 && (
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">Suggested Tracks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((suggestion, idx) => (
            <div key={idx} className="p-4 bg-white rounded-lg shadow-md">
              <p className="font-medium">{suggestion.track}</p>
              <p className="text-sm text-gray-600">{suggestion.artist}</p>
              <p className="text-sm text-gray-500 mt-2">{suggestion.reason}</p>
              {suggestion.spotify_data?.preview_url && (
                <audio
                  controls
                  className="mt-2 w-full"
                  src={suggestion.spotify_data.preview_url}
                >
                  Your browser does not support the audio element.
                </audio>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onCreatePlaylist}
          disabled={isCreatingPlaylist}
          className="mt-6 px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 w-full md:w-auto"
        >
          {isCreatingPlaylist ? 'Creating Playlist...' : 'Create/Update Playlist'}
        </button>
      </div>
    )}
  </>
);

// Main BrandPlaylist component
const BrandPlaylist: React.FC = () => {
  const { token, logout } = useAuth();
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Queries
  const brandsQuery = useBrands();
  const brandProfileQuery = useBrandProfile(selectedBrandId || '');
  
  // Mutations
  const createBrand = useCreateBrand();
  const suggestMusic = useSuggestMusic();
  const createPlaylist = useCreatePlaylist();

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
        <Link to="/login" className="text-green-500 hover:text-green-600">
          Go to Login
        </Link>
      </div>
    );
  }

  const handleBrandSelect = async (brandId: string) => {
    setSelectedBrandId(brandId);
    setShowAddForm(false);
  };

  const handleCreateBrand = async (brandName: string) => {
    try {
      const newBrand = await createBrand.mutateAsync({
        brand: brandName,
        // Add other required brand data
      });
      
      setSelectedBrandId(newBrand.id);
      setShowAddForm(false);
    } catch (error) {
      console.error('Error creating brand:', error);
      // Handle error (show toast, etc.)
    }
  };

  const handleCreatePlaylist = async () => {
    if (!selectedBrandId || !brandProfileQuery.data) return;

    try {
      const result = await createPlaylist.mutateAsync({
        brandId: selectedBrandId,
        suggestions: suggestMusic.data || []
      });

      // Show success message
      alert(`Playlist created successfully! View it here: ${result.playlist_url}`);
    } catch (error) {
      console.error('Error creating playlist:', error);
      // Handle error
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Brand-Based Playlist Creator</h2>
        <Link 
          to="/dashboard" 
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Error States */}
      {brandsQuery.error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error loading brands: {brandsQuery.error.message}
        </div>
      )}

      {/* Brand Selection */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Select a Brand</h3>
        {brandsQuery.isPending ? (
          <div>Loading brands...</div>
        ) : (
          <select
            className="w-full p-2 border border-gray-300 rounded-md mb-4"
            onChange={(e) => handleBrandSelect(e.target.value)}
            value={selectedBrandId || ''}
          >
            <option value="">Choose a brand...</option>
            {brandsQuery.data?.map((brand: Brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => setShowAddForm(true)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          + Add New Brand
        </button>
      </div>

      {/* Add Brand Form */}
      {showAddForm && (
        <AddBrandForm
          onSubmit={handleCreateBrand}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Brand Profile and Suggestions */}
      {selectedBrandId && brandProfileQuery.data && (
        <BrandProfile
          brandProfile={brandProfileQuery.data}
          suggestions={suggestMusic.data || []}
          onCreatePlaylist={handleCreatePlaylist}
          isCreatingPlaylist={createPlaylist.isPending}
        />
      )}

      {/* Loading States */}
      {brandProfileQuery.isPending && (
        <div className="flex justify-center items-center py-8">
          <div className="text-xl">Loading brand profile...</div>
        </div>
      )}
    </div>
  );
};

export default BrandPlaylist;