import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Search, 
  Filter, 
  ChevronDown, 
  Menu, 
  X, 
  Plus, 
  Trash2,
  Palette,
  Calendar,
  Sparkles
} from 'lucide-react'
import { canvaService } from '../../lib/canvaService'
import { useAuth } from '../../lib/AuthContext'
import { usePopup } from '../../lib/PopupContext'

const YourDesigns = ({ onItemClick, refreshTrigger }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newCanvasName, setNewCanvasName] = useState('')
  const [canvases, setCanvases] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingCanvasId, setDeletingCanvasId] = useState(null)
  const { user } = useAuth()
  const { confirm } = usePopup()

  // Fetch canvases from API
  useEffect(() => {
    const fetchCanvases = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
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
  }, [user, refreshTrigger])

  const handleCreateCanvas = async () => {
    if (newCanvasName.trim()) {
      try {
        setLoading(true)
        
        const newCanvas = await canvaService.createCanvas(newCanvasName.trim())
        
        // Add the new canvas to the list
        setCanvases(prev => [...prev, newCanvas])
        setNewCanvasName('')
        setShowCreateForm(false)
        
        // Automatically open the new canvas by creating a design object
        const canvasId = newCanvas.canvasId || newCanvas.id || newCanvas._id
        const designObject = {
          id: canvasId,
          title: newCanvas.name || `Canvas ${canvasId?.slice(-8) || 'Unknown'}`,
          status: 'blue',
          time: new Date().toLocaleDateString(),
          preview: '🎨',
          type: 'canvas',
          canvasData: newCanvas.canvasData || {},
          timestamp: newCanvas.timestamp || newCanvas.updatedAt
        }
        handleLoadCanvas(designObject)
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
    
    // Prevent multiple clicks on the same canvas
    if (deletingCanvasId === canvasId) return
    
    setDeletingCanvasId(canvasId)
    
    try {
      const confirmed = await confirm(
        'Are you sure you want to delete this canvas? This action cannot be undone.',
        {
          title: 'Delete Canvas',
          confirmText: 'Delete',
          cancelText: 'Cancel'
        }
      )
      
      if (confirmed) {
        setLoading(true)
        
        await canvaService.deleteCanvas(canvasId)
        
        // Remove the canvas from the list
        setCanvases(prev => prev.filter(canvas => canvas.canvasId !== canvasId))
      }
    } catch (err) {
      console.error('Error deleting canvas:', err)
      setError(err.message)
    } finally {
      setLoading(false)
      setDeletingCanvasId(null)
    }
  }

  // Handle loading canvas
  const handleLoadCanvas = (design) => {
    const canvasId = design.id
    onItemClick({
      id: canvasId,
      title: design.title,
      type: 'canvas',
      canvasData: design.canvasData || {},
      timestamp: design.timestamp,
      preview: '🎨'
    })
  }

  // Filter canvases based on search query
  const filteredCanvases = canvases.filter(canvas => {
    const canvasId = canvas.canvasId || canvas.id || canvas._id
    return canvas && canvasId && (canvas.name || `Canvas ${canvasId.slice(-8)}`).toLowerCase().includes(searchQuery.toLowerCase())
  })

  const canvasDesigns = filteredCanvases.map(canvas => {
    const canvasId = canvas.canvasId || canvas.id || canvas._id
    const previewUrl = canvas.previewUrl || canvaService.getCanvasPreviewUrl(canvasId)
    return {
      id: canvasId,
      title: canvas.name || `Canvas ${canvasId?.slice(-8) || 'Unknown'}`,
      status: 'blue',
      time: (canvas.timestamp || canvas.updatedAt) ? new Date(canvas.timestamp || canvas.updatedAt).toLocaleDateString() : 'Unknown',
      preview: previewUrl,
      type: 'canvas',
      canvasData: canvas.canvasData || {},
      timestamp: canvas.timestamp || canvas.updatedAt
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
      {/* Electric Search Bar */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center bg-gradient-to-r from-gray-800 to-gray-700 rounded-xl px-4 py-3 border border-gray-600 hover:border-purple-500 transition-all duration-300 group">
          <motion.div
            animate={{ rotate: searchQuery ? 360 : 0 }}
            transition={{ duration: 0.5 }}
          >
            <Search className="h-5 w-5 text-gray-400 group-hover:text-purple-400 mr-3 transition-colors duration-300" />
          </motion.div>
          <input
            type="text"
            placeholder="Search your designs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:placeholder-purple-300 transition-colors duration-300"
          />
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <Filter className="h-5 w-5 text-gray-400 group-hover:text-purple-400 transition-colors duration-300" />
          </motion.div>
        </div>
      </motion.div>

      {/* Your Designs Section */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <motion.h2 
              className="text-xl font-bold text-white flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <Sparkles className="h-5 w-5 text-purple-400" />
              Your Designs
            </motion.h2>
            <div className="flex items-center space-x-4">
              <select className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors duration-300">
                <option>Owner</option>
              </select>
              <select className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-600 transition-colors duration-300">
                <option>Designs</option>
              </select>
              <div className="flex space-x-2">
                <button className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                  <ChevronDown className="h-4 w-4" />
                </button>
                <button className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors duration-300">
                  <Menu className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Create Canvas Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 bg-gradient-to-r from-gray-700 to-gray-600 rounded-xl border border-gray-600">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Palette className="h-5 w-5 text-purple-400" />
                Create New Canvas
              </h3>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newCanvasName}
                  onChange={(e) => setNewCanvasName(e.target.value)}
                  placeholder="Enter canvas name..."
                  className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-purple-500 focus:outline-none transition-colors duration-300"
                  autoFocus
                />
                <button
                  onClick={handleCreateCanvas}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-300 flex items-center gap-2"
                  disabled={!newCanvasName.trim()}
                >
                  <Sparkles className="h-4 w-4" />
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewCanvasName('')
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors duration-300"
                >
                  <X className="h-4 w-4" />
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
            {/* Simple Create New Canvas Card */}
            <div
              onClick={() => setShowCreateForm(true)}
              className="bg-gray-700 rounded-xl p-4 hover:bg-gray-600 transition-colors duration-200 cursor-pointer group border-2 border-dashed border-gray-500 hover:border-purple-400"
            >
              <div className="aspect-video bg-gray-600 rounded-lg mb-3 flex items-center justify-center text-4xl group-hover:bg-gray-500 transition-colors duration-200">
                <Plus className="h-12 w-12 text-gray-400 group-hover:text-white transition-colors duration-200" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-white">Create New Canvas</p>
                <p className="text-xs text-gray-400 mt-1">Start a new design</p>
              </div>
            </div>

            {/* Canvas Cards */}
            {canvasDesigns.map((design, index) => (
              <div
                key={design.id}
                onClick={() => handleLoadCanvas(design)}
                className="bg-gray-700 rounded-xl p-4 hover:bg-gray-600 transition-colors duration-200 cursor-pointer group relative"
              >
                  <div className="aspect-video bg-white rounded-lg mb-3 flex items-center justify-center text-4xl group-hover:bg-gray-50 transition-colors duration-200 overflow-hidden">
                    {design.preview && design.preview.startsWith('http') ? (
                      <img 
                        src={design.preview} 
                        alt={design.title}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center ${design.preview && design.preview.startsWith('http') ? 'hidden' : 'flex'}`}>
                      🎨
                    </div>
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
                      disabled={deletingCanvasId === design.id}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg ${
                        deletingCanvasId === design.id 
                          ? 'text-gray-500 cursor-not-allowed' 
                          : 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                      }`}
                      title={deletingCanvasId === design.id ? "Deleting..." : "Delete canvas"}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

          </div>
        </div>
      </div>
    </div>
  )
}

export default YourDesigns
