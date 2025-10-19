import React, { createContext, useContext, useState } from 'react'
import PopupManager from '../components/ui/PopupManager'

const PopupContext = createContext()

export const usePopup = () => {
  const context = useContext(PopupContext)
  if (!context) {
    throw new Error('usePopup must be used within a PopupProvider')
  }
  return context
}

export const PopupProvider = ({ children }) => {
  const [popups, setPopups] = useState([])

  const addPopup = (popup) => {
    const id = Date.now() + Math.random()
    const newPopup = {
      id,
      type: 'confirm',
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: () => {},
      onCancel: () => {},
      ...popup
    }
    
    setPopups(prev => [...prev, newPopup])
    return id
  }

  const removePopup = (id) => {
    setPopups(prev => prev.filter(popup => popup.id !== id))
  }

  const confirm = (message, options = {}) => {
    return new Promise((resolve) => {
      const popup = {
        type: 'confirm',
        title: options.title || 'Confirm Action',
        message,
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        onConfirm: () => {
          removePopup(popup.id)
          resolve(true)
        },
        onCancel: () => {
          removePopup(popup.id)
          resolve(false)
        }
      }
      
      addPopup(popup)
    })
  }

  const showSuccess = (message, options = {}) => {
    return new Promise((resolve) => {
      const popup = {
        type: 'success',
        title: options.title || 'Success',
        message,
        confirmText: options.confirmText || 'OK',
        cancelText: null,
        onConfirm: () => {
          removePopup(popup.id)
          resolve(true)
        },
        onCancel: () => {
          removePopup(popup.id)
          resolve(false)
        }
      }
      
      addPopup(popup)
    })
  }

  const showError = (message, options = {}) => {
    return new Promise((resolve) => {
      const popup = {
        type: 'error',
        title: options.title || 'Error',
        message,
        confirmText: options.confirmText || 'OK',
        cancelText: null,
        onConfirm: () => {
          removePopup(popup.id)
          resolve(true)
        },
        onCancel: () => {
          removePopup(popup.id)
          resolve(false)
        }
      }
      
      addPopup(popup)
    })
  }

  const value = {
    addPopup,
    removePopup,
    confirm,
    showSuccess,
    showError
  }

  return (
    <PopupContext.Provider value={value}>
      {children}
      
      {/* Popup Container */}
      {popups.map((popup) => (
        <PopupManager
          key={popup.id}
          {...popup}
        />
      ))}
    </PopupContext.Provider>
  )
}
