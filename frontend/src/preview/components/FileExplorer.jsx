import React, { useState, useEffect } from 'react'
import { 
  DocumentIcon, 
  FolderIcon, 
  FolderOpenIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  LockClosedIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { getDirectoryService } from '../services/directoryService'
import { editableFiles, lockedFiles } from './projectFiles'

const FileExplorer = ({ onDownloadProject, onFileSelect, projectName = 'reactify-project' }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [fileTree, setFileTree] = useState([])
  const [expandedFolders, setExpandedFolders] = useState(new Set([projectName, `${projectName}/src`, `${projectName}/public`]))

  useEffect(() => {
    // Initialize directory service with current tabs
    const directoryService = getDirectoryService(projectName)
    
    // Load locked files if not already loaded
    if (directoryService.files.size === 0) {
      directoryService.loadLockedFiles(lockedFiles)
    }
    
    initializeDirectoryService()
    updateFileTree()
  }, [projectName])

  const initializeDirectoryService = () => {
    const directoryService = getDirectoryService(projectName)
    
    // Only clear and re-add editable files, don't touch the base structure
    const editableFileIds = Array.from(directoryService.files.keys()).filter(id => {
      const file = directoryService.files.get(id)
      return file && file.editable && !file.locked
    })
    
    editableFileIds.forEach(id => directoryService.files.delete(id))

    // Add App.jsx as editable file in src folder
    directoryService.addFile(
      `${projectName}/src/App.jsx`, 
      'App.jsx', 
      'jsx', 
      true, 
      false, 
      editableFiles['App.jsx'].content, 
      `${projectName}/src`
    )

    // Always ensure App.jsx is present
    const appJsxId = `${projectName}/src/App.jsx`
    if (!directoryService.files.has(appJsxId)) {
      directoryService.addFile(
        appJsxId,
        'App.jsx',
        'jsx',
        true,
        false,
        editableFiles['App.jsx'].content,
        `${projectName}/src`
      )
    }
  }

  const updateFileTree = () => {
    const directoryService = getDirectoryService(projectName)
    const tree = directoryService.getFileTree()
    setFileTree(tree)
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      await onDownloadProject()
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
    const directoryService = getDirectoryService(projectName)
    directoryService.toggleFolder(folderId)
    updateFileTree()
  }

  const handleFileClick = (file) => {
    if (onFileSelect) {
      onFileSelect(file)
    }
  }

  const getFileIcon = (type, locked = false) => {
    const directoryService = getDirectoryService(projectName)
    const iconClass = `h-4 w-4 ${directoryService.getFileTypeColor(type)}`
    
    if (locked) {
      return <LockClosedIcon className={`${iconClass} opacity-60`} />
    }
    
    switch (type) {
      case 'javascript':
      case 'jsx':
        return <DocumentIcon className={`${iconClass} text-yellow-400`} />
      case 'css':
        return <DocumentIcon className={`${iconClass} text-blue-400`} />
      case 'html':
        return <DocumentIcon className={`${iconClass} text-orange-400`} />
      case 'config':
        return <DocumentIcon className={`${iconClass} text-gray-400`} />
      case 'markdown':
        return <DocumentIcon className={`${iconClass} text-purple-400`} />
      default:
        return <DocumentIcon className={`${iconClass} text-gray-400`} />
    }
  }

  const renderFileTree = (nodes, level = 0) => {
    return nodes.map((node) => {
      if (node.type === 'folder') {
        const isExpanded = expandedFolders.has(node.id)
        // When searching, only show folders if they have matching files
        if (searchQuery && (!node.children || node.children.length === 0)) {
          return null
        }
        return (
          <div key={node.id}>
            <div
              className="flex items-center space-x-2 px-3 py-1 cursor-pointer hover:bg-gray-700 rounded-md"
              style={{ paddingLeft: `${level * 12 + 12}px` }}
              onClick={() => toggleFolder(node.id)}
            >
              {isExpanded ? (
                <FolderOpenIcon className="h-4 w-4 text-blue-400" />
              ) : (
                <FolderIcon className="h-4 w-4 text-blue-400" />
              )}
              <span className="text-sm text-gray-300">{node.name}</span>
            </div>
            {isExpanded && node.children && node.children.length > 0 && (
              <div>
                {renderFileTree(node.children, level + 1)}
              </div>
            )}
          </div>
        )
      } else {
        const isActive = false // No active tab highlighting in simplified version
        const isEditable = node.editable && !node.locked
        const isLocked = node.locked
        
        return (
          <div
            key={node.id}
            className={`flex items-center space-x-2 px-3 py-1 cursor-pointer rounded-md transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : isEditable
                ? 'text-gray-300 hover:bg-gray-700'
                : 'text-gray-500 hover:bg-gray-700'
            }`}
            style={{ paddingLeft: `${level * 12 + 12}px` }}
            onClick={() => handleFileClick(node)}
          >
            {getFileIcon(node.fileType, isLocked)}
            <span className="text-sm truncate flex-1">{node.name}</span>
            {node.isDirty && isEditable && (
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
            )}
            {isLocked && (
              <EyeIcon className="h-3 w-3 text-gray-500" title="Read-only" />
            )}
          </div>
        )
      }
    }).filter(Boolean)
  }

  // Filter project files based on search query
  const projectFiles = fileTree.filter(node => node.id === projectName)
  const filteredProjectFiles = searchQuery 
    ? projectFiles.map(project => {
        if (!project.children) return project
        
        const filteredChildren = project.children.map(child => {
          // If it's a folder, filter its children (files only)
          if (child.type === 'folder') {
            const matchingFiles = child.children ? child.children.filter(grandChild => 
              grandChild.type === 'file' && grandChild.name.toLowerCase().includes(searchQuery.toLowerCase())
            ) : []
            
            return {
              ...child,
              children: matchingFiles
            }
          }
          // If it's a file, check if it matches
          return child.type === 'file' && child.name.toLowerCase().includes(searchQuery.toLowerCase()) ? child : null
        }).filter(Boolean)
        
        return {
          ...project,
          children: filteredChildren
        }
      }).filter(project => 
        project.children && project.children.length > 0
      )
    : projectFiles

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Project Explorer</h2>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-3 w-3" />
            <span>{isDownloading ? 'Downloading...' : 'Download ZIP'}</span>
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-md text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-xs text-gray-400">
            Searching for: "{searchQuery}"
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Project Files Section */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center">
            <FolderIcon className="h-4 w-4 mr-2 text-blue-400" />
            {projectName}
          </h3>
          <div className="ml-4">
            {filteredProjectFiles.length > 0 ? (
              renderFileTree(filteredProjectFiles)
            ) : (
              <div className="text-center text-gray-500 text-sm py-4">
                {searchQuery ? 'No project files found matching your search.' : 'No project files found'}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-700 bg-gray-800">
        <div className="text-xs text-gray-400 text-center">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Editable</span>
            </div>
            <div className="flex items-center space-x-1">
              <LockClosedIcon className="h-3 w-3" />
              <span>Read-only</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FileExplorer
