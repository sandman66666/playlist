// src/pages/Login.tsx
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/shared/Button';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const { showToast } = useToast();

  const handleLogin = async () => {
    try {
      console.log('Starting login process...');
      setLoading(true);

      // Make the request to your backend login endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!data?.auth_url) {
        throw new Error('No authorization URL received');
      }

      // Redirect to Spotify's authorization page
      window.location.href = data.auth_url;
    } catch (error) {
      console.error('Login error:', error);
      showToast('Failed to connect with Spotify', 'error');
      setLoading(false);
    }
  };

  // If already logged in, redirect to dashboard
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Spotify Playlist Manager</h1>
        <Button
          onClick={handleLogin}
          isLoading={loading}
          size="lg"
          className="w-full md:w-auto"
        >
          Connect with Spotify
        </Button>
      </div>
    </div>
  );
};

export default Login;