import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const BrandForm = () => {
  const [brandName, setBrandName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // First, generate brand profile
      const profileResponse = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand: brandName,
          brand_essence: {
            core_identity: `Modern, distinctive, and authentic ${brandName} brand experience`,
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
        })
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to create brand profile');
      }

      const profile = await profileResponse.json();

      // Now get music suggestions
      const suggestResponse = await fetch('/api/brands/suggest-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand_id: profile.brand_id,
          brand: brandName
        })
      });

      if (!suggestResponse.ok) {
        throw new Error('Failed to get music suggestions');
      }

      const suggestions = await suggestResponse.json();

      // Finally create playlist
      const playlistResponse = await fetch('/api/brands/create-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('spotify_token')}`
        },
        body: JSON.stringify({
          brand_id: profile.brand_id,
          suggestions: suggestions.suggestions
        })
      });

      if (!playlistResponse.ok) {
        throw new Error('Failed to create playlist');
      }

      const playlist = await playlistResponse.json();
      setMessage(`Successfully created playlist! View it on Spotify: ${playlist.playlist_url}`);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Create Brand Playlist</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Enter brand name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <Button 
            type="submit" 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Creating...' : 'Generate Playlist'}
          </Button>
          {message && (
            <p className={`mt-4 text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default BrandForm;