import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSpotifyPlaylists, useSpotifySearch } from '../hooks/useQueries';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/shared/Button';
import { PlaylistCard } from '../components/playlist/PlaylistCard';
import { PlaylistTrack } from '../types';

const Dashboard: React.FC = () => {
  const { logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: playlists, isLoading: playlistsLoading } = useSpotifyPlaylists();
  const { data: searchResults, isLoading: searchLoading } = useSpotifySearch(searchQuery);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Playlists</h1>
        <div className="space-x-4">
          <Button asChild>
            <Link to="/brands">Brand Profiles</Link>
          </Button>
          <Button variant="destructive" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      <div className="relative mb-8">
        <input
          type="text"
          placeholder="Search for songs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
        {searchLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500" />
          </div>
        )}
      </div>

      {playlistsLoading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {playlists?.map((playlist) => (
            <PlaylistCard key={playlist.id} {...playlist} />
          ))}
        </div>
      )}

      {searchResults && searchResults.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <div className="space-y-2">
            {searchResults.map((track: PlaylistTrack) => (
              <div key={track.id} className="flex justify-between items-center p-4 bg-white rounded-lg shadow">
                <div>
                  <p className="font-medium">{track.name}</p>
                  <p className="text-sm text-gray-600">
                    {track.artists.map(artist => artist.name).join(', ')}
                  </p>
                </div>
                <Button size="sm">Add to Playlist</Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;