import React, { createContext, useContext, useState, useEffect } from 'react'
import { authService } from './authService'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = () => {
    const currentUser = authService.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = () => {
    window.location.href = authService.getLoginUrl()
  }

  const logout = () => {
    authService.logout()
    setUser(null)
  }

  const handleAuthCallback = async (code) => {
    try {
      const result = await authService.handleCallback(code)
      // REMOVE IN PRODUCTION
      if (result && result.tokens && result.tokens.access_token) {
        console.log('(FOR DEBUGGING APIs) Access Token:', result.tokens.access_token)
      }
      checkAuth()
    } catch (error) {
      console.error('Auth callback error:', error)
    }
  }

  const value = {
    user,
    loading,
    login,
    logout,
    handleAuthCallback,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
