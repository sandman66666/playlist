// src/config.ts
interface ImportMetaEnv {
  PROD: boolean;
  VITE_API_URL: string;
  VITE_SPOTIFY_REDIRECT_URI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export interface Config {
    apiBaseUrl: string;
    spotifyRedirectUri: string;
    endpoints: {
      auth: {
        login: string;
        callback: string;
        refresh: string;
        validate: string;
      };
      playlist: {
        user: string;
        search: string;
      };
      brands: {
        list: string;
        details: (id: string) => string;
        suggestMusic: string;
        createPlaylist: string;
      };
    };
  }
  
  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const spotifyRedirectUri = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback';
  
  const config: Config = {
    apiBaseUrl,
    spotifyRedirectUri,
    endpoints: {
      auth: {
        login: '/auth/login',
        callback: '/auth/callback',
        refresh: '/auth/refresh',
        validate: '/auth/validate'
      },
      playlist: {
        user: '/playlist/user',
        search: '/search/tracks'
      },
      brands: {
        list: '/brands',
        details: (id: string) => `/brands/${id}`,
        suggestMusic: '/brands/suggest-music',
        createPlaylist: '/brands/create-playlist'
      }
    }
  };
  
  export default config;