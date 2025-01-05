import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { apiClient } from '../api/client';

const Callback: React.FC = () => {
  const navigate = useNavigate();
  const { setToken } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the code from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange code for token using apiClient's callback method
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (!data?.access_token) {
          throw new Error('No access token received');
        }

        // Store the token
        setToken(data.access_token);
        showToast('Successfully connected with Spotify', 'success');

        // Redirect to dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error('Callback error:', error);
        showToast('Failed to complete authentication', 'error');
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate, setToken, showToast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Completing Authentication...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
};

export default Callback;