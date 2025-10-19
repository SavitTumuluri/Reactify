import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

const Notification = ({ 
  id, 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(id), 300) // Wait for animation to complete
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, id, onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose?.(id), 300)
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-400" />
    }
  }

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-900/90 border-green-700'
      case 'error':
        return 'bg-red-900/90 border-red-700'
      case 'warning':
        return 'bg-yellow-900/90 border-yellow-700'
      default:
        return 'bg-blue-900/90 border-blue-700'
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 100, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 100, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`relative w-full max-w-sm ${getBackgroundColor()} border rounded-lg shadow-lg backdrop-blur-sm`}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                {getIcon()}
              </div>
              <div className="flex-1 min-w-0">
                {title && (
                  <p className="text-sm font-medium text-white truncate">
                    {title}
                  </p>
                )}
                <p className={`text-sm ${title ? 'text-gray-300' : 'text-white'} break-words`}>
                  {message}
                </p>
              </div>
              <div className="flex-shrink-0">
                <button
                  className="inline-flex text-gray-400 hover:text-white focus:outline-none focus:text-white transition-colors p-1 rounded"
                  onClick={handleClose}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Notification
