import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';

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
  const [newBrandName, setNewBrandName] = useState('');
  const [showAddBrandForm, setShowAddBrandForm] = useState(false);

  // Rest of your existing fetch functions remain the same
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

  // Your existing fetchExistingPlaylists function
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

  // Your existing useEffect for initial data load
  useEffect(() => {
    if (token) {
      const loadInitialData = async () => {
        await Promise.all([
          fetchBrands(),
          fetchExistingPlaylists()
        ]);
      };
      loadInitialData();
    }
  }, [token, fetchBrands, fetchExistingPlaylists]);

  // Your existing handleBrandSelect function
  const handleBrandSelect = async (brandId) => {
    if (!brandId) return;
    try {
      setLoading(true);
      setError('');
      setShowAddBrandForm(false); // Hide add brand form when selecting a brand

      // Get brand profile
      const profileRes = await fetch(`${config.apiBaseUrl}${config.endpoints.brands.details(brandId)}`);
      if (!profileRes.ok) {
        throw new Error(`Failed to fetch brand profile: ${profileRes.statusText}`);
      }
      const profileData = await profileRes.json();
      setBrandProfile(profileData);
      setSelectedBrand(brandId);

      // Get music suggestions from Anthropic
      const suggestRes = await fetch(`${config.apiBaseUrl}${config.endpoints.brands.suggestMusic}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });
      if (!suggestRes.ok) {
        throw new Error(`Failed to get music suggestions: ${suggestRes.statusText}`);
      }
      const suggestionsData = await suggestRes.json();
      setSuggestions(suggestionsData.suggestions || []);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      setBrandProfile(null);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  // New function to handle brand creation
  const handleCreateBrand = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const brandData = {
        brand: newBrandName,
        brand_essence: {
          core_identity: `Modern, distinctive, and authentic ${newBrandName} brand experience`,
          brand_voice: 'Confident, innovative, and culturally relevant'
        },
        aesthetic_pillars: {
          visual_language: [
            'Contemporary design',
            'Bold expressions',
            'Cultural fusion',
            'Digital innovation'
          ]
        }
      };

      const response = await fetch(`${config.apiBaseUrl}${config.endpoints.brands.list}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(brandData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(errorData.detail || 'Failed to create brand');
      }

      const data = await response.json();
      await fetchBrands();
      setNewBrandName('');
      setShowAddBrandForm(false);
      handleBrandSelect(data.brand_id);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to create brand. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Your existing createPlaylist function
  const createPlaylist = async () => {
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
      
      // Refresh playlists after creation/update
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
  };

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
          onClick={() => setShowAddBrandForm(!showAddBrandForm)}
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          + Add New Brand
        </button>
      </div>

      {/* Add Brand Form */}
      {showAddBrandForm && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4">Add New Brand</h3>
          <form onSubmit={handleCreateBrand} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brand Name
              </label>
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
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
                {loading ? 'Creating...' : 'Create Brand'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddBrandForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && !showAddBrandForm && (
        <div className="flex justify-center items-center py-8">
          <div className="text-xl">Loading...</div>
        </div>
      )}

      {/* Brand Profile Info */}
      {brandProfile && !loading && (
        <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-4">{brandProfile.brand}</h3>
          <div className="prose">
            <h4 className="font-medium">Brand Essence</h4>
            <p>{brandProfile.brand_essence?.core_identity}</p>
            
            <h4 className="font-medium mt-4">Aesthetic Pillars</h4>
            <ul className="list-disc pl-5">
              {brandProfile.aesthetic_pillars?.visual_language?.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Claude Suggestions */}
      {suggestions.length > 0 && !loading && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Suggested Tracks</h3>
          <div className="space-y-4">
            {suggestions.map((s, idx) => (
              <div key={idx} className="p-4 bg-white rounded-lg shadow">
                <p className="font-medium">{s.track}</p>
                <p className="text-sm text-gray-600">{s.artist}</p>
                <p className="text-sm text-gray-500 mt-2">{s.reason}</p>
              </div>
            ))}
          </div>

          <button
            onClick={createPlaylist}
            disabled={loading}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
          >
            {loading ? 'Creating...' : 'Create/Update Playlist'}
          </button>
        </div>
      )}
    </div>
  );
}

export default BrandPlaylist;