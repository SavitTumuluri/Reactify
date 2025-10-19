import React, { createContext, useContext, useState } from 'react'
import Notification from '../components/ui/Notification'
import { motion } from 'motion/react'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const addNotification = (notification) => {
    const id = Date.now() + Math.random()
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification
    }
    
    setNotifications(prev => [...prev, newNotification])
    return id
  }

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const showSuccess = (message, title = 'Success') => {
    return addNotification({ type: 'success', title, message })
  }

  const showError = (message, title = 'Error') => {
    return addNotification({ type: 'error', title, message })
  }

  const showWarning = (message, title = 'Warning') => {
    return addNotification({ type: 'warning', title, message })
  }

  const showInfo = (message, title = 'Info') => {
    return addNotification({ type: 'info', title, message })
  }

  const value = {
    addNotification,
    removeNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Notification Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            {...notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
