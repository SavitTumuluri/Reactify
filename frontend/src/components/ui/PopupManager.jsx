import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  ExclamationTriangleIcon, 
  XMarkIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline'

const PopupManager = ({ 
  id, 
  type = 'confirm', 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm, 
  onCancel,
  isVisible = true
}) => {
  const [isOpen, setIsOpen] = useState(isVisible)

  useEffect(() => {
    setIsOpen(isVisible)
  }, [isVisible])

  const handleConfirm = () => {
    setIsOpen(false)
    setTimeout(() => onConfirm?.(), 150) // Wait for animation
  }

  const handleCancel = () => {
    setIsOpen(false)
    setTimeout(() => onCancel?.(), 150) // Wait for animation
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel()
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'confirm':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-400" />
      case 'error':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-400" />
    }
  }

  const getConfirmButtonColor = () => {
    switch (type) {
      case 'confirm':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      case 'success':
        return 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
      case 'error':
        return 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      default:
        return 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />
          
          {/* Popup */}
          <div className="flex min-h-full items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md bg-gray-800 rounded-xl shadow-2xl border border-gray-700"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <div className="flex items-center gap-3">
                  {getIcon()}
                  <h3 className="text-lg font-semibold text-white">
                    {title}
                  </h3>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-300 leading-relaxed">
                  {message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors focus:outline-none focus:ring-2 ${getConfirmButtonColor()}`}
                >
                  {confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default PopupManager
