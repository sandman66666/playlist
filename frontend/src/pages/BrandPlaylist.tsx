import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiClient } from '../api/client';
import { Brand, BrandProfile, MusicSuggestion } from '../types';

const BrandPlaylist: React.FC = () => {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [suggestions, setSuggestions] = useState<MusicSuggestion[]>([]);

  // Fetch brands on mount
  React.useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await apiClient.getBrands();
        setBrands(data);
      } catch (error) {
        showToast('Failed to load brands', 'error');
      }
    };
    fetchBrands();
  }, [showToast]);

  const handleBrandSelect = async (brandId: string) => {
    try {
      setLoading(true);
      setSelectedBrandId(brandId);
      setShowAddForm(false);

      // Fetch brand profile
      const profile = await apiClient.getBrandProfile(brandId);
      setBrandProfile(profile);

      // Get music suggestions
      const musicSuggestions = await apiClient.suggestMusic(profile);
      setSuggestions(musicSuggestions);
    } catch (error) {
      showToast('Failed to load brand information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBrand = async (brandName: string) => {
    try {
      setLoading(true);
      const newBrand = await apiClient.createBrandProfile({
        brand: brandName,
      });
      setBrands(prev => [...prev, newBrand]);
      await handleBrandSelect(newBrand.id);
      showToast('Brand created successfully', 'success');
    } catch (error) {
      showToast('Failed to create brand', 'error');
    } finally {
      setLoading(false);
      setShowAddForm(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!selectedBrandId || !suggestions.length) return;

    try {
      setLoading(true);
      const result = await apiClient.createPlaylist(selectedBrandId, suggestions);
      showToast('Playlist created successfully!', 'success');
      window.open(result.playlist_url, '_blank');
    } catch (error) {
      showToast('Failed to create playlist', 'error');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Brand-Based Playlist Creator</h2>
        <Link 
          to="/dashboard" 
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Dashboard
        </Link>
      </div>

      {/* Brand Selection */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Select a Brand</h3>
        <select
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          onChange={(e) => handleBrandSelect(e.target.value)}
          value={selectedBrandId || ''}
          disabled={loading}
        >
          <option value="">Choose a brand...</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>

        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add New Brand
          </button>
        )}
      </div>

      {/* Add Brand Form */}
      {showAddForm && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Add New Brand</h3>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const input = form.elements.namedItem('brandName') as HTMLInputElement;
              handleCreateBrand(input.value);
            }}
            className="space-y-4"
          >
            <div>
              <input
                type="text"
                name="brandName"
                placeholder="Enter brand name"
                className="w-full p-2 border border-gray-300 rounded-md"
                required
                disabled={loading}
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {loading ? 'Creating...' : 'Create Brand'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                disabled={loading}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Brand Profile */}
      {brandProfile && (
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
      )}

      {/* Music Suggestions */}
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
            onClick={handleCreatePlaylist}
            disabled={loading}
            className="mt-6 px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 w-full md:w-auto"
          >
            {loading ? 'Creating Playlist...' : 'Create/Update Playlist'}
          </button>
        </div>
      )}
    </div>
  );
};

export default BrandPlaylist;