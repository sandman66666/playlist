import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSpotifyPlaylists, useSpotifySearch, useAddTrackToPlaylist } from '../hooks/useSpotify';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/shared/Button';
import { PlaylistCard } from '../components/playlist/PlaylistCard';
import { PlaylistTrack } from '../types';

const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<PlaylistTrack | null>(null);

  // Queries and Mutations
  const { data: playlists, isLoading: playlistsLoading } = useSpotifyPlaylists();
  const { data: searchResults, isLoading: searchLoading } = useSpotifySearch(searchQuery);
  const addTrackMutation = useAddTrackToPlaylist();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddTrack = async (playlistId: string) => {
    if (!selectedTrack) return;

    try {
      await addTrackMutation.mutateAsync({
        playlistId,
        trackUri: selectedTrack.uri,
      });
      setSelectedTrack(null);
    } catch (error) {
      showToast('Failed to add track to playlist', 'error');
    }
  };

  if (playlistsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Playlists</h1>
        <div className="space-x-4">
          <Button variant="default" asChild>
            <Link to="/brands">Brand Profiles</Link>
          </Button>
          <Button variant="destructive" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Search Section */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search for songs..."
          value={searchQuery}
          onChange={handleSearch}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        {searchLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500" />
          </div>
        )}

        {searchResults && searchResults.length > 0 && (
          <div className="mt-4 bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Search Results</h2>
            <div className="space-y-4">
              {searchResults.map(track => (
                <div key={track.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div>
                    <p className="font-medium">{track.name}</p>
                    <p className="text-sm text-gray-600">
                      {track.artists.map(artist => artist.name).join(', ')}
                    </p>
                  </div>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => setSelectedTrack(track)}
                  >
                    Add to Playlist
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Playlists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {playlists?.map(playlist => (
          <PlaylistCard
            key={playlist.id}
            {...playlist}
            onAddTrack={selectedTrack ? () => handleAddTrack(playlist.id) : undefined}
          />
        ))}
      </div>

      {playlists?.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-600">No playlists found</p>
          <Button variant="link" asChild className="mt-4">
            <Link to="/brands">Create your first playlist</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;