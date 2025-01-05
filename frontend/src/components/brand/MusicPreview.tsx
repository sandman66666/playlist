interface MusicPreviewProps {
    suggestions: MusicSuggestion[];
    onCreatePlaylist: () => void;
    isCreating: boolean;
  }
  
  export const MusicPreview: React.FC<MusicPreviewProps> = ({
    suggestions,
    onCreatePlaylist,
    isCreating
  }) => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Suggested Tracks</h3>
          <Button
            onClick={onCreatePlaylist}
            isLoading={isCreating}
          >
            Create Playlist
          </Button>
        </div>
  
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="bg-white p-4 rounded-lg border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{suggestion.track}</p>
                  <p className="text-sm text-gray-600">{suggestion.artist}</p>
                </div>
                {suggestion.spotify_data?.preview_url && (
                  <audio
                    controls
                    className="w-32"
                    src={suggestion.spotify_data.preview_url}
                  >
                    Your browser does not support the audio element.
                  </audio>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">{suggestion.reason}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };