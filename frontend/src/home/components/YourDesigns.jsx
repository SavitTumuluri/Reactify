import React, { useState, useEffect } from 'react'
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline'
import { canvaService } from '../../lib/canvaService'
import { useAuth } from '../../lib/AuthContext'

const YourDesigns = ({ onItemClick }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCanvasName, setNewCanvasName] = useState('')
  const [canvases, setCanvases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  // Fetch canvases from API
  useEffect(() => {
    const fetchCanvases = async () => {
      if (!user) return
      
      try {
        setLoading(true)
        setError(null)
        const fetchedCanvases = await canvaService.getAllCanvases()
        setCanvases(fetchedCanvases)
      } catch (err) {
        console.error('Error fetching canvases:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchCanvases()
  }, [user])

  const handleCreateCanvas = async () => {
    if (newCanvasName.trim()) {
      try {
        setLoading(true)
        
        const newCanvas = await canvaService.createCanvas(newCanvasName.trim())
        
        // Add the new canvas to the list
        setCanvases(prev => [...prev, newCanvas])
        setNewCanvasName('')
        setShowCreateForm(false)
        
        // Automatically open the new canvas
        handleLoadCanvas(newCanvas)
      } catch (err) {
        console.error('Error creating canvas:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleDeleteCanvas = async (canvasId, e) => {
    e.stopPropagation()
    
    if (window.confirm('Are you sure you want to delete this canvas?')) {
      try {
        setLoading(true)
        
        await canvaService.deleteCanvas(canvasId)
        
        // Remove the canvas from the list
        setCanvases(prev => prev.filter(canvas => canvas.canvasId !== canvasId))
      } catch (err) {
        console.error('Error deleting canvas:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  }

  // Handle loading canvas
  const handleLoadCanvas = (canvas) => {
    const canvasId = canvas.canvasId || canvas.id || canvas._id
    onItemClick({
      id: canvasId,
      title: canvas.name || `Canvas ${canvasId?.slice(-8)}`,
      type: 'canvas',
      canvasData: canvas.canvasData || {},
      timestamp: canvas.timestamp || canvas.updatedAt,
      preview: '🎨',
      size: 'Auto-saved',
      dimensions: canvas.canvasData?.bounds ? `${canvas.canvasData.bounds.w}x${canvas.canvasData.bounds.h}` : '1200x800',
      lastModified: (canvas.timestamp || canvas.updatedAt) ? new Date(canvas.timestamp || canvas.updatedAt).toLocaleDateString() : 'Unknown',
      createdBy: 'You'
    })
  }

  // Filter canvases based on search query
  const filteredCanvases = canvases.filter(canvas => {
    const canvasId = canvas.canvasId || canvas.id || canvas._id
    return canvas && canvasId && (canvas.name || `Canvas ${canvasId.slice(-8)}`).toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Convert canvases to design format for display
  const canvasDesigns = filteredCanvases.map(canvas => {
    const canvasId = canvas.canvasId || canvas.id || canvas._id
    return {
      id: canvasId,
      title: canvas.name || `Canvas ${canvasId?.slice(-8) || 'Unknown'}`,
      status: 'blue',
      time: (canvas.timestamp || canvas.updatedAt) ? new Date(canvas.timestamp || canvas.updatedAt).toLocaleDateString() : 'Unknown',
      preview: '🎨',
      type: 'canvas',
      size: 'Auto-saved',
      dimensions: canvas.canvasData?.bounds ? `${canvas.canvasData.bounds.w}x${canvas.canvasData.bounds.h}` : '1200x800',
      lastModified: (canvas.timestamp || canvas.updatedAt) ? new Date(canvas.timestamp || canvas.updatedAt).toLocaleDateString() : 'Unknown',
      createdBy: 'You',
      canvasData: canvas.canvasData || {}
    }
  })

  const getStatusColor = (status) => {
    const colors = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
    }
    return colors[status] || 'bg-gray-500'
  }

  return (
    <div className="space-y-8">
      {/* Search Bar */}
      <div className="relative">
        <div className="flex items-center bg-gray-800 rounded-xl px-4 py-3">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search your designs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
          />
          <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Your Designs Section */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Your Designs</h2>
            <div className="flex items-center space-x-4">
              <select className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm">
                <option>Owner</option>
              </select>
              <select className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm">
                <option>Designs</option>
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

          {/* Create Canvas Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gray-700 rounded-xl">
              <h3 className="text-lg font-semibold text-white mb-3">Create New Canvas</h3>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newCanvasName}
                  onChange={(e) => setNewCanvasName(e.target.value)}
                  placeholder="Enter canvas name..."
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={handleCreateCanvas}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={!newCanvasName.trim()}
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewCanvasName('')
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-xl">
              <p className="text-red-200">Error: {error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading your canvases...</p>
            </div>
          )}

          {/* Design Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Create New Canvas Card */}
            <div
              onClick={() => setShowCreateForm(true)}
              className="bg-gray-700 rounded-xl p-4 hover:bg-gray-600 transition-colors cursor-pointer group border-2 border-dashed border-gray-500 hover:border-blue-500"
            >
              <div className="aspect-video bg-gray-600 rounded-lg mb-3 flex items-center justify-center text-4xl">
                <PlusIcon className="h-12 w-12 text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">Create New Canvas</p>
                <p className="text-xs text-gray-400 mt-1">Start a new design</p>
              </div>
            </div>

            {/* Canvas Cards */}
            {canvasDesigns.map((design) => (
              <div
                key={design.id}
                onClick={() => handleLoadCanvas(design)}
                className="bg-gray-700 rounded-xl p-4 hover:bg-gray-600 transition-colors cursor-pointer group relative"
              >
                <div className="aspect-video bg-white rounded-lg mb-3 flex items-center justify-center text-4xl">
                  {design.preview}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{design.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(design.status)}`}></div>
                      <p className="text-xs text-gray-400">{design.time}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteCanvas(design.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-red-400 hover:text-red-300"
                    title="Delete canvas"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Empty State */}
            {!loading && canvasDesigns.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-white mb-2">No canvases yet</h3>
                <p className="text-gray-400 mb-4">Create your first canvas to get started</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Canvas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default YourDesigns
