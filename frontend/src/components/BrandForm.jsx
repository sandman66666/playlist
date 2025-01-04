import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';

const BrandForm = () => {
  const [brandName, setBrandName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [step, setStep] = useState('input'); // input, verify, complete
  const [brandDescription, setBrandDescription] = useState('');
  const [brandProfile, setBrandProfile] = useState(null);

  const handleGetDescription = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/brands/describe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brand: brandName })
      });

      if (!response.ok) {
        throw new Error('Failed to get brand description');
      }

      const data = await response.json();
      setBrandDescription(data.description);
      setBrandProfile(data.profile);
      setStep('verify');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // Create brand profile with the verified data
      const profileResponse = await fetch('/api/brands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand: brandName,
          description: brandDescription,
          ...brandProfile
        })
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to create brand profile');
      }

      const profile = await profileResponse.json();

      // Get music suggestions
      const suggestResponse = await fetch('/api/brands/suggest-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          brand_id: profile.brand_id,
          brand: brandName,
          profile: brandProfile
        })
      });

      if (!suggestResponse.ok) {
        throw new Error('Failed to get music suggestions');
      }

      const suggestions = await suggestResponse.json();

      // Create playlist and store suggestions
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
      setStep('complete');
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderBrandProfile = () => {
    if (!brandProfile) return null;

    return (
      <div className="space-y-4 mt-4">
        <h3 className="font-semibold text-lg">Brand Profile</h3>
        <div className="space-y-2">
          <h4 className="font-medium">Brand Essence</h4>
          <p className="text-sm">{brandProfile.brand_essence.core_identity}</p>
          <p className="text-sm">{brandProfile.brand_essence.brand_voice}</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium">Brand Values</h4>
          <ul className="list-disc list-inside text-sm">
            {brandProfile.brand_values?.map((value, index) => (
              <li key={index}>{value}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium">Target Audience</h4>
          <p className="text-sm">{brandProfile.target_audience}</p>
        </div>
        <div className="space-y-2">
          <h4 className="font-medium">Aesthetic Pillars</h4>
          <ul className="list-disc list-inside text-sm">
            {brandProfile.aesthetic_pillars.visual_language.map((pillar, index) => (
              <li key={index}>{pillar}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Create Brand Playlist</CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'input' && (
          <form onSubmit={(e) => { e.preventDefault(); handleGetDescription(); }} className="space-y-4">
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
              {loading ? 'Getting Description...' : 'Next'}
            </Button>
          </form>
        )}

        {step === 'verify' && (
          <div className="space-y-6">
            <Alert>
              <AlertDescription>
                Please verify that this is the correct brand and review the generated profile.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              <h3 className="font-semibold">Brand Description</h3>
              <Textarea
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {renderBrandProfile()}

            <div className="flex gap-4">
              <Button 
                onClick={() => setStep('input')}
                variant="outline"
                disabled={loading}
              >
                Back
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Creating...' : 'Create Brand Profile & Playlist'}
              </Button>
            </div>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4">
            {renderBrandProfile()}
            <p className={`mt-4 ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
              {message}
            </p>
            <Button 
              onClick={() => {
                setStep('input');
                setBrandName('');
                setBrandDescription('');
                setBrandProfile(null);
                setMessage('');
              }}
              className="w-full"
            >
              Create Another Brand
            </Button>
          </div>
        )}

        {message && step !== 'complete' && (
          <p className={`mt-4 text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
            {message}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default BrandForm;