// Directory Service for managing file system structure
export class DirectoryService {
  constructor(projectName = 'reactify-project') {
    this.files = new Map()
    this.folders = new Map()
    this.projectName = projectName
    this.initializeDefaultStructure(projectName)
  }

  initializeDefaultStructure(projectName = 'reactify-project') {
    // Initialize with proper project structure
    this.addFolder(projectName, projectName, null)
    this.addFolder(`${projectName}/src`, 'src', projectName)
    this.addFolder(`${projectName}/public`, 'public', projectName)
    
    // Dependencies will be added as a simple list, not a folder
    // This is just the structure initialization
  }

  addFile(id, name, type, editable = true, locked = false, content = '', parentFolder = null) {
    const file = {
      id,
      name,
      type,
      editable,
      locked,
      content,
      parentFolder,
      isDirty: false,
      createdAt: new Date(),
      modifiedAt: new Date()
    }
    this.files.set(id, file)
    return file
  }

  addFolder(id, name, parentFolder = null) {
    const folder = {
      id,
      name,
      parentFolder,
      children: [],
      isExpanded: true,
      createdAt: new Date()
    }
    this.folders.set(id, folder)
    return folder
  }

  getFile(id) {
    return this.files.get(id)
  }

  getFolder(id) {
    return this.folders.get(id)
  }

  updateFileContent(id, content) {
    const file = this.files.get(id)
    if (file && file.editable && !file.locked) {
      file.content = content
      file.isDirty = true
      file.modifiedAt = new Date()
      return true
    }
    return false
  }

  getAllFiles() {
    return Array.from(this.files.values())
  }

  getAllFolders() {
    return Array.from(this.folders.values())
  }

  getFilesByFolder(folderId) {
    return Array.from(this.files.values()).filter(file => file.parentFolder === folderId)
  }

  getEditableFiles() {
    return Array.from(this.files.values()).filter(file => file.editable && !file.locked)
  }

  getLockedFiles() {
    return Array.from(this.files.values()).filter(file => file.locked)
  }

  getFileTree() {
    const tree = []
    const rootFolders = Array.from(this.folders.values()).filter(folder => !folder.parentFolder)
    
    rootFolders.forEach(folder => {
      tree.push(this.buildFolderNode(folder))
    })
    
    // Add files without parent folders
    const orphanFiles = Array.from(this.files.values()).filter(file => !file.parentFolder)
    orphanFiles.forEach(file => {
      tree.push(this.buildFileNode(file))
    })
    
    return tree
  }

  buildFolderNode(folder) {
    const children = []
    
    // Add subfolders
    const subfolders = Array.from(this.folders.values()).filter(f => f.parentFolder === folder.id)
    subfolders.forEach(subfolder => {
      children.push(this.buildFolderNode(subfolder))
    })
    
    // Add files in this folder
    const files = Array.from(this.files.values()).filter(f => f.parentFolder === folder.id)
    files.forEach(file => {
      children.push(this.buildFileNode(file))
    })
    
    return {
      type: 'folder',
      id: folder.id,
      name: folder.name,
      isExpanded: folder.isExpanded,
      children: children.sort((a, b) => {
        // Sort folders first, then files
        if (a.type === 'folder' && b.type === 'file') return -1
        if (a.type === 'file' && b.type === 'folder') return 1
        return a.name.localeCompare(b.name)
      })
    }
  }

  buildFileNode(file) {
    return {
      type: 'file',
      id: file.id,
      name: file.name,
      fileType: file.type,
      editable: file.editable,
      locked: file.locked,
      isDirty: file.isDirty,
      content: file.content
    }
  }

  toggleFolder(id) {
    const folder = this.folders.get(id)
    if (folder) {
      folder.isExpanded = !folder.isExpanded
      return true
    }
    return false
  }

  createNewFile(name, type = 'javascript', parentFolder = 'src') {
    const id = parentFolder ? `${parentFolder}/${name}` : name
    const file = this.addFile(id, name, type, true, false, '', parentFolder)
    return file
  }

  deleteFile(id) {
    const file = this.files.get(id)
    if (file && file.editable && !file.locked) {
      this.files.delete(id)
      return true
    }
    return false
  }

  searchFiles(query) {
    const results = []
    const searchTerm = query.toLowerCase()
    
    this.files.forEach(file => {
      if (file.name.toLowerCase().includes(searchTerm) || 
          file.content.toLowerCase().includes(searchTerm)) {
        results.push(file)
      }
    })
    
    return results
  }

  getFileIcon(type) {
    const iconMap = {
      'javascript': '🟨',
      'jsx': '⚛️',
      'css': '🎨',
      'html': '🌐',
      'config': '⚙️',
      'markdown': '📝',
      'dependency': '📦',
      'folder': '📁'
    }
    return iconMap[type] || '📄'
  }

  getFileTypeColor(type) {
    const colorMap = {
      'javascript': 'text-yellow-400',
      'jsx': 'text-blue-400',
      'css': 'text-blue-500',
      'html': 'text-orange-400',
      'config': 'text-gray-400',
      'markdown': 'text-purple-400',
      'dependency': 'text-green-400',
      'folder': 'text-gray-300'
    }
    return colorMap[type] || 'text-gray-400'
  }

  /**
   * Get all files for ZIP export, excluding dependencies
   * Returns an array of file objects with path and content
   */
  getFilesForExport() {
    const files = []
    
    // Helper function to build file paths recursively
    const buildFilePaths = (folderId, currentPath = '') => {
      const folderFiles = Array.from(this.files.values()).filter(f => f.parentFolder === folderId)
      const subFolders = Array.from(this.folders.values()).filter(f => f.parentFolder === folderId)
      
      // Add files in current folder
      folderFiles.forEach(file => {
        const filePath = currentPath ? `${currentPath}/${file.name}` : file.name
        files.push({
          path: filePath,
          content: file.content,
          name: file.name,
          editable: file.editable,
          locked: file.locked
        })
      })
      
      // Process subfolders
      subFolders.forEach(folder => {
        const folderPath = currentPath ? `${currentPath}/${folder.name}` : folder.name
        // Skip dependencies folder
        if (!folderPath.includes('dependencies')) {
          buildFilePaths(folder.id, folderPath)
        }
      })
    }
    
    // Start from root folders
    const rootFolders = Array.from(this.folders.values()).filter(f => !f.parentFolder)
    rootFolders.forEach(folder => {
      if (!folder.name.includes('dependencies')) {
        buildFilePaths(folder.id, folder.name)
      }
    })
    
    // Add root level files
    const rootFiles = Array.from(this.files.values()).filter(f => !f.parentFolder)
    rootFiles.forEach(file => {
      files.push({
        path: file.name,
        content: file.content,
        name: file.name,
        editable: file.editable,
        locked: file.locked
      })
    })
    
    return files
  }

  loadLockedFiles(lockedFiles) {
    // Add project root files
    this.addFile(`${this.projectName}/package.json`, 'package.json', 'config', false, true, lockedFiles['package.json'].content, this.projectName)
    this.addFile(`${this.projectName}/README.md`, 'README.md', 'markdown', false, true, lockedFiles['README.md'].content, this.projectName)
    this.addFile(`${this.projectName}/vite.config.js`, 'vite.config.js', 'javascript', false, true, lockedFiles['vite.config.js'].content, this.projectName)
    this.addFile(`${this.projectName}/tailwind.config.js`, 'tailwind.config.js', 'javascript', false, true, lockedFiles['tailwind.config.js'].content, this.projectName)
    this.addFile(`${this.projectName}/postcss.config.js`, 'postcss.config.js', 'javascript', false, true, lockedFiles['postcss.config.js'].content, this.projectName)
    
    // Add index.html to root directory
    this.addFile(`${this.projectName}/index.html`, 'index.html', 'html', false, true, lockedFiles['index.html'].content, this.projectName)
    
    // Add public folder files
    this.addFile(`${this.projectName}/public/manifest.json`, 'manifest.json', 'config', false, true, lockedFiles['public/manifest.json'].content, `${this.projectName}/public`)
    
    // Add src folder files
    this.addFile(`${this.projectName}/src/index.jsx`, 'index.jsx', 'jsx', false, true, lockedFiles['src/index.jsx'].content, `${this.projectName}/src`)
    this.addFile(`${this.projectName}/src/index.css`, 'index.css', 'css', false, true, lockedFiles['src/index.css'].content, `${this.projectName}/src`)
    this.addFile(`${this.projectName}/src/DragResizeStatic.jsx`, 'DragResizeStatic.jsx', 'jsx', false, true, lockedFiles['src/DragResizeStatic.jsx'].content, `${this.projectName}/src`)
    this.addFile(`${this.projectName}/src/GraphicBox.jsx`, 'GraphicBox.jsx', 'jsx', false, true, lockedFiles['src/GraphicBox.jsx'].content, `${this.projectName}/src`)
    
    // Add dependencies as a special folder for the tree structure
    this.addFolder('dependencies', 'dependencies', null)
    
    // Add dependencies (these are package listings, not actual files)
    this.addFile('dependencies/react', 'react ^18.2.0', 'dependency', false, true, lockedFiles['react'].content, 'dependencies')
    this.addFile('dependencies/react-dom', 'react-dom ^18.2.0', 'dependency', false, true, lockedFiles['react-dom'].content, 'dependencies')
    this.addFile('dependencies/vite', 'vite ^4.4.5', 'dependency', false, true, lockedFiles['vite'].content, 'dependencies')
    this.addFile('dependencies/@heroicons/react', '@heroicons/react ^2.0.18', 'dependency', false, true, lockedFiles['@heroicons/react'].content, 'dependencies')
    this.addFile('dependencies/tailwindcss', 'tailwindcss ^3.3.3', 'dependency', false, true, lockedFiles['tailwindcss'].content, 'dependencies')
    this.addFile('dependencies/autoprefixer', 'autoprefixer ^10.4.14', 'dependency', false, true, lockedFiles['autoprefixer'].content, 'dependencies')
    this.addFile('dependencies/postcss', 'postcss ^8.4.27', 'dependency', false, true, lockedFiles['postcss'].content, 'dependencies')
  }
}

// Create singleton instance
let directoryServiceInstance = null

export const getDirectoryService = (projectName = 'reactify-project') => {
  // If no instance exists or project name changed, create new instance
  if (!directoryServiceInstance || directoryServiceInstance.projectName !== projectName) {
    directoryServiceInstance = new DirectoryService(projectName)
  }
  return directoryServiceInstance
}

export const directoryService = getDirectoryService()
