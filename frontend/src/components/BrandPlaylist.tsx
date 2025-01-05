import React, { useState, useEffect, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';
import { Brand, BrandProfile } from '../types';

interface MusicSuggestion {
  track: string;
  artist: string;
  reason: string;
  spotify_data?: {
    uri: string;
    preview_url?: string;
    external_url?: string;
  };
}

interface AddBrandFormProps {
  onSubmit: (brandName: string) => Promise<void>;
  onCancel: () => void;
  loading: boolean;
}

// Separate AddBrandForm component
const AddBrandForm: React.FC<AddBrandFormProps> = memo(({ onSubmit, onCancel, loading }) => {
  const [brandName, setBrandName] = useState('');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(brandName);
  }, [brandName, onSubmit]);

  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Add New Brand</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={loading}
          />
        </div>
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? 'Getting Description...' : 'Next'}
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
});

interface VerifyBrandFormProps {
  brandProfile: BrandProfile | null;
  brandDescription: string;
  onBack: () => void;
  onSubmit: () => void;
  loading: boolean;
  onDescriptionChange: (value: string) => void;
}

// Separate VerifyBrandForm component
const VerifyBrandForm: React.FC<VerifyBrandFormProps> = memo(({
  brandProfile,
  brandDescription,
  onBack,
  onSubmit,
  loading,
  onDescriptionChange
}) => {
  return (
    <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-4">Verify Brand Information</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Description
          </label>
          <textarea
            value={brandDescription}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]"
            placeholder="Brand description..."
            disabled={loading}
          />
        </div>

        <BrandProfileDisplay brandProfile={brandProfile} />

        <div className="flex space-x-4">
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            disabled={loading}
          >
            Back
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create Brand'}
          </button>
        </div>
      </div>
    </div>
  );
});

interface BrandProfileDisplayProps {
  brandProfile: BrandProfile | null;
}

// Separate BrandProfileDisplay component
const BrandProfileDisplay: React.FC<BrandProfileDisplayProps> = memo(({ brandProfile }) => {
  if (!brandProfile) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="text-lg font-medium mb-2">Brand Essence</h4>
        <div className="space-y-2">
          <div>
            <p className="font-medium text-sm text-gray-600">Core Identity</p>
            <p>{brandProfile.brand_essence.core_identity}</p>
          </div>
          <div>
            <p className="font-medium text-sm text-gray-600">Brand Voice</p>
            <p>{brandProfile.brand_essence.brand_voice}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium mb-2">Brand Values</h4>
        <ul className="list-disc pl-5 space-y-1">
          {brandProfile.cultural_positioning.core_values.map((value, idx) => (
            <li key={idx} className="text-gray-700">{value}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-lg font-medium mb-2">Aesthetic Pillars</h4>
        <ul className="list-disc pl-5 space-y-1">
          {brandProfile.aesthetic_pillars.visual_language.map((pillar, idx) => (
            <li key={idx} className="text-gray-700">{pillar}</li>
          ))}
        </ul>
      </div>
    </div>
  );
});

interface SuggestedTracksProps {
  suggestions: MusicSuggestion[];
  onCreatePlaylist: () => Promise<void>;
  loading: boolean;
}

// Separate SuggestedTracks component
const SuggestedTracks: React.FC<SuggestedTracksProps> = memo(({
  suggestions,
  onCreatePlaylist,
  loading
}) => {
  if (!suggestions.length) return null;

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold mb-4">Suggested Tracks</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((s, idx) => (
          <div key={idx} className="p-4 bg-white rounded-lg shadow-md">
            <p className="font-medium">{s.track}</p>
            <p className="text-sm text-gray-600">{s.artist}</p>
            <p className="text-sm text-gray-500 mt-2">{s.reason}</p>
            {s.spotify_data?.preview_url && (
              <audio
                controls
                className="mt-2 w-full"
                src={s.spotify_data.preview_url}
              >
                Your browser does not support the audio element.
              </audio>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onCreatePlaylist}
        disabled={loading}
        className="mt-6 px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 w-full md:w-auto"
      >
        {loading ? 'Creating...' : 'Create/Update Playlist'}
      </button>
    </div>
  );
});

// Main BrandPlaylist component
const BrandPlaylist: React.FC = () => {
  const navigate = useNavigate();
  const { token, logout, getAuthHeader } = useAuth();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [suggestions, setSuggestions] = useState<MusicSuggestion[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showAddBrandForm, setShowAddBrandForm] = useState<boolean>(false);
  const [brandDescription, setBrandDescription] = useState<string>('');
  const [verifyingBrand, setVerifyingBrand] = useState<boolean>(false);

  const fetchBrands = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${config.apiBaseUrl}${config.endpoints.brands.list}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch brands: ${response.statusText}`);
      }
      const data = await response.json();
      setBrands(data.brands || []);
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError('Failed to load brands. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleBrandSelect = useCallback(async (brandId: string) => {
    if (!brandId) return;
    try {
      setLoading(true);
      setError('');
      setShowAddBrandForm(false);

      const profileRes = await fetch(`${config.apiBaseUrl}${config.endpoints.brands.details(brandId)}`);
      if (!profileRes.ok) {
        throw new Error(`Failed to fetch brand profile: ${profileRes.statusText}`);
      }
      const profileData = await profileRes.json();
      setBrandProfile(profileData);
      setSelectedBrand(brandId);
      setSuggestions(profileData.suggested_songs || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setBrandProfile(null);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGetBrandDescription = useCallback(async (brandName: string) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${config.apiBaseUrl}${config.endpoints.brands.describe}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: brandName }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || 'Failed to get brand description');
      }

      const data = await response.json();
      setBrandDescription(data.description);
      setBrandProfile(data.profile);
      setVerifyingBrand(true);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get brand description');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateBrand = useCallback(async () => {
    if (!brandProfile) return;
    
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${config.apiBaseUrl}${config.endpoints.brands.list}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: brandProfile.brand,
          description: brandDescription,
          ...brandProfile
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || 'Failed to create brand');
      }

      const data = await response.json();
      await fetchBrands();
      setBrandDescription('');
      setShowAddBrandForm(false);
      setVerifyingBrand(false);
      handleBrandSelect(data.brand_id);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create brand');
    } finally {
      setLoading(false);
    }
  }, [brandProfile, brandDescription, fetchBrands, handleBrandSelect]);

  const createPlaylist = useCallback(async () => {
    if (!selectedBrand) return;
    
    try {
      setLoading(true);
      setError('');

      const authHeader = await getAuthHeader();
      if (!authHeader) {
        throw new Error('No valid token available');
      }
      
      const response = await fetch(`${config.apiBaseUrl}${config.endpoints.brands.createPlaylist}`, {
        method: 'POST',
        headers: { 
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brand_id: selectedBrand,
          suggestions: suggestions
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || 'Failed to create playlist');
      }

      const data = await response.json();
      alert(`Playlist ${data.playlist_url ? 'updated' : 'created'} successfully! You can find it at: ${data.playlist_url}`);
    } catch (err) {
      console.error('Error:', err);
      if (err instanceof Error && err.message.includes('token')) {
        logout();
      } else {
        setError(err instanceof Error ? err.message : 'Failed to create playlist');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedBrand, suggestions, getAuthHeader, logout]);

  useEffect(() => {
    if (token) {
      fetchBrands();
    }
  }, [token, fetchBrands]);

  if (!token) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
          <Link to="/login" className="text-green-500 hover:text-green-600">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Brand-Based Playlist Creator</h2>
        <Link to="/dashboard" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
          Back to Dashboard
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Brand Selection Section */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Select a Brand</h3>
        <select
          className="w-full p-2 border border-gray-300 rounded-md mb-4"
          onChange={(e) => handleBrandSelect(e.target.value)}
          value={selectedBrand || ''}
          disabled={loading}
        >
          <option value="">Choose a brand...</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        {/* Add Brand Button */}
        <button
          onClick={() => {
            setShowAddBrandForm(true);
            setVerifyingBrand(false);
            setBrandProfile(null);
          }}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          + Add New Brand
        </button>
      </div>

      {/* Add Brand Form */}
      {showAddBrandForm && !verifyingBrand && (
        <AddBrandForm
          onSubmit={handleGetBrandDescription}
          onCancel={() => setShowAddBrandForm(false)}
          loading={loading}
        />
      )}

      {/* Brand Verification Form */}
      {showAddBrandForm && verifyingBrand && brandProfile && (
        <VerifyBrandForm
          brandProfile={brandProfile}
          brandDescription={brandDescription}
          onBack={() => setVerifyingBrand(false)}
          onSubmit={handleCreateBrand}
          loading={loading}
          onDescriptionChange={setBrandDescription}
        />
      )}

      {loading && !showAddBrandForm && (
        <div className="flex justify-center items-center py-8">
          <div className="text-xl">Loading...</div>
        </div>
      )}

      {/* Brand Profile Info */}
      {selectedBrand && brandProfile && !loading && !showAddBrandForm && (
        <>
          <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold mb-4">{brandProfile.brand}</h3>
            {brandDescription && (
              <p className="text-gray-600 mb-6">{brandDescription}</p>
            )}
            <BrandProfileDisplay brandProfile={brandProfile} />
          </div>

          <SuggestedTracks
            suggestions={suggestions}
            onCreatePlaylist={createPlaylist}
            loading={loading}
          />
        </>
      )}
    </div>
  );
};

export default BrandPlaylist;