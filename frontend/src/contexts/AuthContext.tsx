// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import type { TokenInfo } from '../types';

interface AuthContextType {
  token: string | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  getAuthHeader: () => Promise<string | null>;
  setToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('spotify_token');
    if (storedToken) {
      try {
        const tokenInfo: TokenInfo = JSON.parse(storedToken);
        setToken(tokenInfo.access_token);
      } catch (e) {
        localStorage.removeItem('spotify_token');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async () => {
    try {
      const authUrl = await apiClient.login();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('spotify_token');
    setToken(null);
    navigate('/login');
  }, [navigate]);

  const getAuthHeader = useCallback(async () => {
    if (!token) return null;
    const storedToken = localStorage.getItem('spotify_token');
    if (!storedToken) return null;
    
    const tokenInfo: TokenInfo = JSON.parse(storedToken);
    return `Bearer ${tokenInfo.access_token}`;
  }, [token]);

  const handleSetToken = useCallback((newToken: string) => {
    const tokenInfo: TokenInfo = {
      access_token: newToken,
      timestamp: new Date().getTime()
    };
    localStorage.setItem('spotify_token', JSON.stringify(tokenInfo));
    setToken(newToken);
  }, []);

  const value = {
    token,
    loading,
    login,
    logout,
    getAuthHeader,
    setToken: handleSetToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};