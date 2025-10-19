import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import HeroSection from './components/layout/hero-section'
import HomePage from './home/App'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import EditorPage from "./editor/Editor"
import PreviewPage from "../preview/Preview"
import LoadingScreen from './components/ui/LoadingScreen'

function AppContent() {
  const { handleAuthCallback, isAuthenticated, loading } = useAuth()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      console.error('Auth error:', error);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code) {
      handleAuthCallback(code).then(() => {
        window.history.replaceState({}, document.title, '/home');
      });
    }
  }, [handleAuthCallback])

  if (loading) {
    return <LoadingScreen message="Initializing Reactify..." />
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<HeroSection />}
        />
        <Route 
          path="/home" 
          element={
            isAuthenticated ? <HomePage /> : <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/editor/:canvasId?" 
          element={
            isAuthenticated ? <EditorPage /> : <Navigate to="/" replace />
          }
        />
        <Route 
          path="/preview/:canvasId" 
          element={
            isAuthenticated ? <PreviewPage /> : <Navigate to="/" replace />
          }
        />

      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
