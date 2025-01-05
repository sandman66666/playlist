interface Config {
    apiBaseUrl: string;
    spotifyCallbackUrl: string;
    endpoints: {
      auth: {
        login: string;
        callback: string;
        refresh: string;
        validate: string;
      };
      playlist: {
        user: string;
        details: (id: string) => string;
        tracks: (id: string) => string;
        addTracks: (id: string) => string;
        removeTracks: (id: string) => string;
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
  
  const isProd = process.env.NODE_ENV === 'production';
  const prodDomain = 'https://playlist-mgr-39a919ee8105-1641bf424db9.herokuapp.com';
  const devDomain = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  
  const config: Config = {
    apiBaseUrl: isProd ? prodDomain : devDomain,
    spotifyCallbackUrl: isProd ? `${prodDomain}/#/auth` : `${devDomain}/#/auth`,
    endpoints: {
      auth: {
        login: '/auth/login',
        callback: '/auth/callback',
        refresh: '/auth/refresh',
        validate: '/auth/validate'
      },
      playlist: {
        user: '/playlist/user',
        details: (id: string) => `/playlist/${id}`,
        tracks: (id: string) => `/playlist/${id}/tracks`,
        addTracks: (id: string) => `/playlist/${id}/tracks`,
        removeTracks: (id: string) => `/playlist/${id}/tracks`,
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