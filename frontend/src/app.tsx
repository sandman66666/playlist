// src/app.tsx
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BrandPlaylist from './pages/BrandPlaylist';
import Callback from './pages/Callback';

// Components
import ProtectedRoute from './components/shared/ProtectedRoute';

// Styles
import './index.css';

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-screen bg-gray-50">
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/callback" element={<Callback />} />
                
                {/* Protected Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/brands"
                  element={
                    <ProtectedRoute>
                      <BrandPlaylist />
                    </ProtectedRoute>
                  }
                />
                
                {/* Default Route */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </div>
          </ToastProvider>
        </AuthProvider>
      </Router>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};

export default App;