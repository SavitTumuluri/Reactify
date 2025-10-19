import React, { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import { BriefcaseIcon, DocumentIcon, ArrowRightOnRectangleIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import YourDesigns from './components/YourDesigns'
import Templates from './components/Templates'
import ItemSidebar from './components/ItemSidebar'

const Home = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('your-designs')
  const [selectedItem, setSelectedItem] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    // Component mounted and user state initialized
  }, [user])

  const tabs = [
    { id: 'your-designs', name: 'Your designs', icon: BriefcaseIcon },
    { id: 'templates', name: 'Templates', icon: DocumentIcon },
  ]

  const handleItemClick = (item) => {
    setSelectedItem(item)
    setSidebarOpen(true)
  }

  const handleTemplateClick = (item) => {
    setSelectedItem(item)
    setSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
    setSelectedItem(null)
  }

  const handleOpenDesign = () => {
    if (selectedItem?.id) {
      navigate(`/editor/${selectedItem.id}`)
      setSidebarOpen(false)
      setSelectedItem(null)
    }
  }

  const handleRefreshDesigns = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="flex h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <h1 className="text-2xl font-bold text-white">Reactify</h1>
                <div className="flex space-x-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{tab.name}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* User Info */}
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-400">{user?.email || 'user@example.com'}</p>
                  </div>
                </div>
                
                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="group flex items-center space-x-2 px-4 py-2 bg-red-600/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-600/20 hover:border-red-500/40 hover:text-red-300 transition-all duration-200 hover:scale-105"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 group-hover:rotate-12 transition-transform duration-200" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'your-designs' && (
              <YourDesigns onItemClick={handleItemClick} refreshTrigger={refreshTrigger} />
            )}
            {activeTab === 'templates' && (
              <Templates onItemClick={handleTemplateClick} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <ItemSidebar
          item={selectedItem}
          isOpen={sidebarOpen}
          onClose={handleCloseSidebar}
          type={activeTab === 'templates' ? 'template' : 'canvas'}
          onOpenDesign={handleOpenDesign}
          onRefreshDesigns={handleRefreshDesigns}
        />
      </div>
    </div>
  )
}

export default Home