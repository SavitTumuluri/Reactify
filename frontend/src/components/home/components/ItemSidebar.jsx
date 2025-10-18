import React from 'react'
import { XMarkIcon, StarIcon, HeartIcon, ArrowDownTrayIcon, CalendarIcon, UserIcon, TagIcon } from '@heroicons/react/24/outline'

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
              <p className="text-gray-400">{isTemplate ? item.category : item.type}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {isTemplate ? (
                <>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <StarIcon className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-gray-400">Rating</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{item.rating}/5</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowDownTrayIcon className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-400">Downloads</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{item.downloads}</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-400">Price</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{item.price}</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <UserIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-400">Author</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{item.author}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-400">Size</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{item.size}</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-400">Dimensions</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{item.dimensions}</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <UserIcon className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-400">Created By</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{item.createdBy}</p>
                  </div>
                  
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon className="h-4 w-4 text-purple-500" />
                      <span className="text-sm text-gray-400">Last Modified</span>
                    </div>
                    <p className="text-lg font-semibold text-white">{item.lastModified}</p>
                  </div>
                </>
              )}
            </div>
          {/* Tags */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TagIcon className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Tags</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.tags?.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-600 text-white text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          {isTemplate && (
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarIcon className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-400">Last Updated</span>
              </div>
              <p className="text-white">{item.lastUpdated}</p>
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
            
            <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
              <HeartIcon className="h-4 w-4" />
              {isTemplate ? 'Add to Favorites' : 'Add to Favorites'}
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ItemSidebar
