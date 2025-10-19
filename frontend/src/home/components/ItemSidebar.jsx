import React, { useState } from 'react'
import { XMarkIcon, CalendarIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline'
import { authService } from '../../lib/authService'
import { useNotification } from '../../lib/NotificationContext'

const ItemSidebar = ({ item, isOpen, onClose, type, onOpenDesign, onRefreshDesigns }) => {
  if (!isOpen || !item) return null

  const isTemplate = type === 'template'
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { showSuccess, showError, showWarning } = useNotification()

  const handleStartEdit = () => {
    const currentName = isTemplate ? (item.name || 'Untitled Template') : (item.title || 'Untitled Design')
    setEditedName(currentName)
    setIsEditingName(true)
  }

  const handleCancelEdit = () => {
    setIsEditingName(false)
    setEditedName('')
  }

  const handleSaveName = async () => {
    if (!editedName.trim()) return
    
    try {
      setIsSaving(true)
      const token = authService.getAccessToken()
      
      if (!token) {
        showWarning('Please log in to update canvas name')
        return
      }

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/canvas/${item.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editedName.trim()
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update canvas name')
      }

      // Update the item with the new name
      item.title = editedName.trim()
      
      // Refresh the designs list to show the updated name
      if (onRefreshDesigns) {
        onRefreshDesigns()
      }
      
      setIsEditingName(false)
      setEditedName('')
      showSuccess('Canvas name updated successfully!')
      
    } catch (err) {
      console.error('Error updating canvas name:', err)
      showError(err.message || 'Failed to update canvas name. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTemplateCopy = async () => {
    try {
      const token = authService.getAccessToken()
      
      if (!token) {
        showWarning('Please log in to copy templates')
        return
      }
      
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/templates/${item.canvaId}/copy`
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Error:', error)
        throw new Error(error.error || 'Failed to copy template')
      }

      const data = await response.json()
      
      showSuccess('Template copied to your canvases!')
      
      // Small delay to show the notification before reload
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (err) {
      console.error('Error copying template:', err)
      showError(err.message || 'Failed to copy template. Please try again.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-96 bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="aspect-video bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-6xl relative overflow-hidden">
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>
              <span className="relative z-10">🎨</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                {isEditingName && !isTemplate ? (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
                      placeholder="Enter canvas name..."
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                    />
                    <button
                      onClick={handleSaveName}
                      disabled={isSaving || !editedName.trim()}
                      className="p-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                    >
                      <CheckIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-white flex-1">
                      {isTemplate ? (item.name || 'Untitled Template') : (item.title || 'Untitled Design')}
                    </h3>
                    {!isTemplate && (
                      <button
                        onClick={handleStartEdit}
                        className="p-2 hover:bg-gray-700 text-gray-400 hover:text-white rounded-lg transition-colors"
                        title="Edit name"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                  </>
                )}
              </div>
              <p className="text-gray-400">
                {isTemplate ? (item.category || 'Template') : 'Canvas Design'}
              </p>
            </div>

            {/* Template-specific additional info */}
            {isTemplate && (
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Template ID</span>
                </div>
                <p className="text-white font-mono text-sm">{item.canvaId}</p>
              </div>
            )}

            {/* Canvas-specific additional info */}
            {!isTemplate && item.canvasData && (
              <div className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Canvas ID</span>
                </div>
                <p className="text-white font-mono text-sm">{item.id}</p>
              </div>
            )}

          {/* Actions */}
          <div className="space-y-3">
            <button 
              onClick={isTemplate ? handleTemplateCopy : onOpenDesign}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {isTemplate ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Use Template
                </>
              ) : (
                'Open Design'
              )}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemSidebar
