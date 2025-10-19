import React from 'react'
import { XMarkIcon, StarIcon, HeartIcon, ArrowDownTrayIcon, CalendarIcon, UserIcon } from '@heroicons/react/24/outline'

const ItemSidebar = ({ item, isOpen, onClose, type, onOpenDesign }) => {
  if (!isOpen || !item) return null

  const isTemplate = type === 'template'

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
            <div className="aspect-video bg-white rounded-lg flex items-center justify-center text-6xl">
              {item.preview}
            </div>

            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400">{isTemplate ? item.category : 'Canvas Design'}</p>
            </div>

             

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
              onClick={isTemplate ? undefined : onOpenDesign}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {isTemplate ? 'Use Template' : 'Open Design'}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemSidebar
