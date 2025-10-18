import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import HeroSection from './components/layout/hero-section'
import Home from './components/home/App'
import Editor from './editor/Editor'
import Preview from './preview/Preview'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'


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
            loading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-xl font-semibold">Loading...</h1>
                </div>
              </div>
            ) : isAuthenticated ? (
              <Home />
            ) : (
              <Navigate to="/" replace />
            )
          } 
        />
        <Route 
          path="/editor/:id" 
          element={
            loading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-xl font-semibold">Loading...</h1>
                </div>
              </div>
            ) : isAuthenticated ? (
              <Editor />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route 
          path="/preview/:id" 
          element={
            loading ? (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-xl font-semibold">Loading...</h1>
                </div>
              </div>
            ) : isAuthenticated ? (
              <Preview />
            ) : (
              <Navigate to="/" replace />
            )
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
