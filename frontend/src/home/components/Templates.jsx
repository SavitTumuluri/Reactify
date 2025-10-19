import React, { useState, useEffect } from 'react'
import { authService } from '../../lib/authService'
import { useNotification } from '../../lib/NotificationContext'
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'

const Templates = ({ onItemClick }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('newest')
  const { showSuccess, showError, showWarning } = useNotification()

  useEffect(() => {
    fetchTemplates()
  }, [])
  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/templates`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      
      const data = await response.json()
      setTemplates(data.templates || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching templates:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }
  

  const handleCopy = async (e, template) => {
    e.stopPropagation()
    
    try {
      const token = authService.getAccessToken()
      
      if (!token) {
        showWarning('Please log in to copy templates')
        return
      }
      
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/templates/${template.canvaId}/copy`
      
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

  const filteredTemplates = templates
    .filter(template => {
      const matchesSearch = template.name?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      return 0
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-400 text-lg">Loading templates...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gray-800 rounded-xl p-8 text-center">
        <div className="text-red-500 mb-4">
          <svg className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold">Error Loading Templates</h3>
        </div>
        <p className="text-gray-400 mb-4">{error}</p>
        <button 
          onClick={fetchTemplates}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center bg-gray-800 rounded-xl px-4 py-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
          />
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Templates Section */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">
              Templates ({filteredTemplates.length})
            </h2>
            <div className="flex items-center space-x-4">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
              >
                <option value="newest">Newest</option>
              </select>
              <div className="flex space-x-2">
                <button className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">
                  <ChevronDownIcon className="h-4 w-4" />
                </button>
                <button className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">
                  <Bars3Icon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Template Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {templates.length === 0 ? 'No templates yet' : 'No templates found'}
              </h3>
              <p className="text-gray-500">
                {templates.length === 0 
                  ? 'Be the first to share a template!' 
                  : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.canvaId}
                  onClick={() => onItemClick && onItemClick(template)}
                  className="bg-gray-700 rounded-xl p-4 hover:bg-gray-600 transition-colors cursor-pointer group relative"
                >
                  
                  <div className="aspect-video bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg mb-3 flex items-center justify-center text-4xl relative overflow-hidden">
                    {(template.previewImage || template.previewUrl || template.s3) ? (
                      <img 
                        src={template.previewImage || template.previewUrl || template.s3} 
                        alt={template.name}
                        className="w-full h-full object-contain"
                        data-s3={template.s3 || template.previewUrl}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center ${(template.previewImage || template.previewUrl || template.s3) ? 'hidden' : 'flex'}`}>
                      <span className="relative z-10">🎨</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-white truncate flex-1 mr-2">
                        {template.name || 'Untitled Template'}
                      </h3>
                    </div>
                    
                    <p className="text-xs text-gray-400">
                      {template.category}
                    </p>
                    

                    {/* Use Template Button */}
                    <button
                      onClick={(e) => handleCopy(e, template)}
                      className="w-full mt-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Use Template
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Templates