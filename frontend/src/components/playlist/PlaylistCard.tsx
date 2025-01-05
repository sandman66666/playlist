import React from 'react';
import { PlaylistTrack } from '../../types';

interface PlaylistCardProps {
  id: string;
  name: string;
  images?: Array<{ url: string; height: number; width: number; }>;
  tracksCount: number;
  owner: string;
  isOwner: boolean;
  onAddTrack?: (track: PlaylistTrack) => void;
}

export const PlaylistCard: React.FC<PlaylistCardProps> = ({
  name,
  images,
  tracksCount,
  owner,
  isOwner,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="aspect-w-1 aspect-h-1">
        {images?.[0] ? (
          <img
            src={images[0].url}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No Image</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 truncate" title={name}>
          {name}
        </h3>
        <p className="text-sm text-gray-600 mb-2">
          {tracksCount} tracks
        </p>
        <p className="text-xs text-gray-500">
          {isOwner ? 'Your playlist' : `By ${owner}`}
        </p>
      </div>
    </div>
  );
};
