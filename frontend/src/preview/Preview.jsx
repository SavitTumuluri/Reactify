import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../lib/AuthContext'
import { authService } from '../lib/authService'
import { useParams } from 'react-router-dom'
import JSZip from 'jszip'
import { editableFiles, lockedFiles } from './components/projectFiles'
import { getDirectoryService } from './services/directoryService'
// import { Load } from '../editor/state/Save'
// import { NameRegistry } from '../editor/state/ComponentRegistry'
// Import components to register them for Load function
import FileExplorer from './components/FileExplorer'
import CodeEditor from './components/CodeEditor'
import ResizeHandle from './components/ResizeHandle'
import StatusBar from './components/StatusBar'

const Preview = () => {
  const { user } = useAuth()
  const { canvasId } = useParams()
  const [loading, setLoading] = useState(false)
  const [appContent, setAppContent] = useState('')
  const [readOnlyFile, setReadOnlyFile] = useState(null)
  const [compilationError, setCompilationError] = useState(null)
  const [projectName, setProjectName] = useState('reactify-project')
  const [sidebarWidth, setSidebarWidth] = useState(25) 
  const [isResizingSidebar, setIsResizingSidebar] = useState(false)

  // API call to get canvas data
  const fetchCanvasData = async () => {
    if (!canvasId || !user?.sub) {
      console.error('Missing canvasId or user authentication')
      return
    }

    try {
      setLoading(true)
      const accessToken = authService.getAccessToken()
      if (!accessToken) {
        throw new Error('No access token available')
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/api/canvas/${canvasId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch canvas data: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('Canvas data received:', data)

      if (data.canvas && data.canvas.canvasData) {
        // Extract project name from canvas data
        const canvasName = data.canvas.name || 'reactify-project'
        setProjectName(canvasName)
        
        // Parse the canvas data
        const canvasData = typeof data.canvas.canvasData === 'string' 
          ? JSON.parse(data.canvas.canvasData) 
          : data.canvas.canvasData

        const irData = canvasData.irString?.ir || canvasData.ir || canvasData
        // const ir = Load(irData)
        
        // if (ir) {
        //   const reactCode = ir.toReact()
        //   setAppContent(reactCode)
        //   editableFiles['App.jsx'].content = reactCode
        // } else {
        //   console.error('Failed to load IR from canvas data')
        // }
      } else {
        console.error('No canvas data found in response')
      }
    } catch (error) {
      console.error('Error fetching canvas data:', error)
      setCompilationError(`Failed to load canvas: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Initialize and load canvas data
  useEffect(() => {
    if (canvasId) {
      fetchCanvasData()
    }
  }, [canvasId, user])

  const handleFileSelect = (file) => {
    console.log('File selected:', file)
    console.log('Current readOnlyFile before:', readOnlyFile)
    
    if (file.editable && !file.locked) {
      // Clear read-only file state when switching to editable file
      setReadOnlyFile(null)
    } else {
      // For read-only files, set the read-only file state
      console.log('Setting read-only file:', file)
      setReadOnlyFile(file)
    }
  }

  const closeReadOnlyFile = () => {
    console.log('Closing read-only file')
    setReadOnlyFile(null)
  }

  // Auto-compile when App.jsx content changes
  const handleAppContentChange = (content) => {
    setAppContent(content)
  }

  const addFilesToZip = (zip, files, folders, parentPath = '') => {
    files.forEach(file => {
      const filePath = parentPath ? `${parentPath}/${file.name}` : file.name
      const content = file.name === 'App.jsx' ? appContent : file.content
      zip.file(filePath, content)
    })

    folders.forEach(folder => {
      const folderPath = parentPath ? `${parentPath}/${folder.name}` : folder.name
       
      
      const folderFiles = Array.from(directoryService.files.values()).filter(f => f.parentFolder === folder.id)
      const subFolders = Array.from(directoryService.folders.values()).filter(f => f.parentFolder === folder.id)
      
      if (folderFiles.length > 0 || subFolders.length > 0) {
        addFilesToZip(zip, folderFiles, subFolders, folderPath)
      }
    })
  }

  const downloadProject = async () => {
    try {
      const zip = new JSZip()
      const directoryService = getDirectoryService(projectName)

      const filesToExport = directoryService.getFilesForExport()
      
      // Add all files to ZIP
      filesToExport.forEach(file => {
        const content = file.name === 'App.jsx' ? appContent : file.content
        zip.file(file.path, content)
      })

      // Generate and download
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projectName}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error creating project ZIP:', error)
      throw error
    }
  }

  // Resizing logic
  const handleMouseDown = useCallback((type) => (e) => {
    e.preventDefault()
    if (type === 'sidebar') {
      setIsResizingSidebar(true)
    }
  }, [])

  const handleMouseMove = useCallback((e) => {
    if (!isResizingSidebar) return

    if (isResizingSidebar) {
      const newWidth = (e.clientX / window.innerWidth) * 100
      setSidebarWidth(Math.max(15, Math.min(60, newWidth)))
    }
  }, [isResizingSidebar])

  const handleMouseUp = useCallback(() => {
    setIsResizingSidebar(false)
  }, [])

  useEffect(() => {
    if (isResizingSidebar) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizingSidebar, handleMouseMove, handleMouseUp])

  if (loading) {
    return <LoadingScreen message="Loading Preview..." />
  }

  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden">
      {/* Main Layout */}
      <div className="flex h-full">
        {/* Sidebar */}
        <div 
          className="bg-gray-900 border-r border-gray-700 flex-shrink-0"
          style={{ width: `${sidebarWidth}%` }}
        >
          <FileExplorer
            onDownloadProject={downloadProject}
            onFileSelect={handleFileSelect}
            projectName={projectName}
          />
        </div>

        {/* Resize Handle */}
        <ResizeHandle
          isResizing={isResizingSidebar}
          onMouseDown={handleMouseDown('sidebar')}
        />

        {/* Editor Area */}
        <div 
          className="flex flex-col bg-gray-900 flex-1"
        >
          {console.log('Rendering editor area - readOnlyFile:', readOnlyFile)}
          {readOnlyFile ? (
            <>
              <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-300">
                    {readOnlyFile.type === 'dependency' ? 'Package:' : 'Read-only:'}
                  </span>
                  <span className="text-sm text-white">{readOnlyFile.name}</span>
                </div>
                <button
                  onClick={closeReadOnlyFile}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 p-4 overflow-hidden">
                {readOnlyFile.type === 'dependency' ? (
                  <div className="text-sm text-gray-300">
                    <div className="bg-green-900/20 border border-green-700 rounded-lg p-4 mb-4">
                      <h3 className="text-green-400 font-semibold mb-2">📦 Package Information</h3>
                      <p className="text-green-300">{readOnlyFile.name}</p>
                      <p className="text-gray-400 text-xs mt-2">
                        This is a dependency package. Dependencies are managed automatically and don't need to be edited.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="h-full overflow-auto">
                    <pre className="text-sm text-gray-300 whitespace-pre-wrap bg-gray-800 p-4 rounded">
                      {readOnlyFile.content}
                    </pre>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="bg-gray-800 border-b border-gray-700 px-4 py-2">
                <h3 className="text-sm font-medium text-gray-300">App.jsx</h3>
              </div>
              {console.log('Rendering CodeEditor with content length:', appContent?.length)}
              <CodeEditor
                content={appContent}
                onChange={handleAppContentChange}
                language="javascript"
                editable={true}
              />
            </>
          )}
        </div>
      </div>


      {/* Status Bar */}
      <StatusBar
        isCompiling={false}
        compilationError={compilationError}
      />
    </div>
  )
}

export default Preview