import React, { useState, useEffect, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

// Separate AddBrandForm component to prevent re-renders
const AddBrandForm = memo(({ onSubmit, onCancel, loading }) => {
  const [brandName, setBrandName] = useState('');

  const handleSubmit = useCallback((e) => {
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

// Separate VerifyBrandForm component
const VerifyBrandForm = memo(({ brandProfile, brandDescription, onBack, onSubmit, loading, onDescriptionChange }) => {
  const handleDescriptionChange = useCallback((e) => {
    onDescriptionChange(e.target.value);
  }, [onDescriptionChange]);

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
            onChange={handleDescriptionChange}
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

// Separate BrandProfileDisplay component
const BrandProfileDisplay = memo(({ brandProfile }) => {
  if (!brandProfile) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h4 className="text-lg font-medium mb-2">Brand Essence</h4>
        <div className="space-y-2">
          <div>
            <p className="font-medium text-sm text-gray-600">Core Identity</p>
            <p>{brandProfile.brand_essence?.core_identity}</p>
          </div>
          <div>
            <p className="font-medium text-sm text-gray-600">Brand Voice</p>
            <p>{brandProfile.brand_essence?.brand_voice}</p>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-lg font-medium mb-2">Brand Values</h4>
        <ul className="list-disc pl-5 space-y-1">
          {brandProfile.brand_values?.map((value, idx) => (
            <li key={idx} className="text-gray-700">{value}</li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="text-lg font-medium mb-2">Target Audience</h4>
        <p className="text-gray-700">{brandProfile.target_audience}</p>
      </div>

      <div>
        <h4 className="text-lg font-medium mb-2">Aesthetic Pillars</h4>
        <ul className="list-disc pl-5 space-y-1">
          {brandProfile.aesthetic_pillars?.visual_language?.map((pillar, idx) => (
            <li key={idx} className="text-gray-700">{pillar}</li>
          ))}
        </ul>
      </div>
    </div>
  );
});

// Separate SuggestedTracks component
const SuggestedTracks = memo(({ suggestions, onCreatePlaylist, loading }) => {
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
function BrandPlaylist() {
  const navigate = useNavigate();
  const { token, logout, getAuthHeader } = useAuth();
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [brandProfile, setBrandProfile] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [existingPlaylists, setExistingPlaylists] = useState([]);
  const [showAddBrandForm, setShowAddBrandForm] = useState(false);
  const [brandDescription, setBrandDescription] = useState('');
  const [verifyingBrand, setVerifyingBrand] = useState(false);

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

  const fetchExistingPlaylists = useCallback(async () => {
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) {
        throw new Error('No valid token available');
      }

      const response = await fetch(`${config.apiBaseUrl}${config.endpoints.playlist.user}`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch playlists');
      }
      const data = await response.json();
      setExistingPlaylists(data.playlists || []);
    } catch (err) {
      console.error('Error fetching playlists:', err);
      if (err.message.includes('token')) {
        logout();
      }
    }
  }, [getAuthHeader, logout]);

  useEffect(() => {
    let mounted = true;
    
    if (token) {
      const loadInitialData = async () => {
        try {
          await Promise.all([
            fetchBrands(),
            fetchExistingPlaylists()
          ]);
        } catch (error) {
          console.error('Error loading initial data:', error);
        }
      };
      
      loadInitialData();
    }
    
    return () => {
      mounted = false;
    };
  }, [token, fetchBrands, fetchExistingPlaylists]);

  const handleBrandSelect = useCallback(async (brandId) => {
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
      setError(err.message);
      setBrandProfile(null);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGetBrandDescription = useCallback(async (brandName) => {
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
      setError(err.message || 'Failed to get brand description. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateBrand = useCallback(async () => {
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
      setError(err.message || 'Failed to create brand. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [brandProfile, brandDescription, fetchBrands, handleBrandSelect]);

  const createPlaylist = useCallback(async () => {
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
      await fetchExistingPlaylists();
      alert(`Playlist ${data.playlist_url ? 'updated' : 'created'} successfully! You can find it at: ${data.playlist_url}`);
    } catch (err) {
      console.error('Error:', err);
      if (err.message.includes('token')) {
        logout();
      } else {
        setError(err.message || 'Failed to create playlist. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedBrand, suggestions, getAuthHeader, fetchExistingPlaylists, logout]);

  const handleAddBrandClick = useCallback(() => {
    setShowAddBrandForm(true);
    setVerifyingBrand(false);
    setBrandDescription('');
    setBrandProfile(null);
  }, []);

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
          onClick={handleAddBrandClick}
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
      {showAddBrandForm && verifyingBrand && (
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
            {brandProfile.description && (
              <p className="text-gray-600 mb-6">{brandProfile.description}</p>
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
}

export default BrandPlaylist;