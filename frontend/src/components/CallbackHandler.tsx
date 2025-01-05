import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import config from '../config';
import { TokenInfo } from '../types';

const CallbackHandler: React.FC = () => {
  const navigate = useNavigate();
  const { token, setTokenInfo } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(true);

  useEffect(() => {
    const processAuth = async (): Promise<void> => {
      try {
        // Handle hash-based auth from Spotify
        if (window.location.hash) {
          const params = new URLSearchParams(
            window.location.hash.substring(1) // Remove the '#'
          );

          const tokenInfo: TokenInfo = {
            access_token: params.get('access_token') || '',
            refresh_token: params.get('refresh_token') || '',
            expires_in: parseInt(params.get('expires_in') || '0', 10),
            expires_at: Date.now() + parseInt(params.get('expires_in') || '0', 10) * 1000
          };

          if (tokenInfo.access_token && tokenInfo.refresh_token) {
            localStorage.setItem('spotify_token', JSON.stringify(tokenInfo));
            setTokenInfo(tokenInfo);
            navigate('/dashboard');
            return;
          }
        }

        // Handle code-based auth
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        if (code) {
          const storedState = localStorage.getItem('spotify_auth_state');
          
          if (state !== storedState) {
            throw new Error('State mismatch. Please try again.');
          }

          const response = await fetch(`${config.apiBaseUrl}/auth/callback?code=${code}&state=${state}`);
          if (!response.ok) throw new Error('Failed to exchange code for token');

          const data = await response.json();
          const tokenInfo: TokenInfo = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            expires_at: Date.now() + data.expires_in * 1000
          };

          localStorage.setItem('spotify_token', JSON.stringify(tokenInfo));
          setTokenInfo(tokenInfo);
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Auth processing error:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setProcessing(false);
      }
    };

    if (!token) {
      processAuth();
    } else {
      navigate('/dashboard');
    }
  }, [token, setTokenInfo, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl text-red-600 mb-4">Authentication Error</h2>
          <p className="text-gray-600">{error}</p>
          <p className="mt-4 text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="p-6 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-xl mb-4">Processing Authentication</h2>
          <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  return null;
};

export default CallbackHandler;