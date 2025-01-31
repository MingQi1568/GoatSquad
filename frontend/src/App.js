import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import News from './pages/News';
import Calendar from './components/Calendar';
import Preferences from './pages/Preferences';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import Profile from './pages/Profile';
import Register from './pages/Register';
import { AnimatePresence } from 'framer-motion';
import RecommendationsPage from './pages/RecommendationsPage';
import SavedVideos from './pages/SavedVideos';
import { Toaster } from 'react-hot-toast';

// Create a wrapper component that uses useLocation
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <Home />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/news" element={
          <ProtectedRoute>
            <MainLayout>
              <News />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/calendar" element={
          <ProtectedRoute>
            <MainLayout>
              <Calendar />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/preferences" element={
          <ProtectedRoute>
            <MainLayout>
              <Preferences />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <MainLayout>
              <Profile />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/recommendations" element={
          <ProtectedRoute>
            <MainLayout>
              <RecommendationsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        <Route path="/saved-videos" element={
          <ProtectedRoute>
            <MainLayout>
              <SavedVideos />
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Router>
          <AnimatedRoutes />
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                duration: 3000,
                theme: {
                  primary: '#4aed88',
                }
              },
            }}
          />
        </Router>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
