import React, { useState, useEffect } from 'react'
import { useAuth } from '../../lib/AuthContext'
import { useNavigate } from 'react-router-dom'
import { BriefcaseIcon, DocumentIcon } from '@heroicons/react/24/outline'
import YourDesigns from './components/YourDesigns'
import Templates from './components/Templates'
import ItemSidebar from './components/ItemSidebar'

const Home = () => {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('your-designs')
  const [selectedItem, setSelectedItem] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    console.log('Home component mounted')
    console.log('isAuthenticated:', !!user)
    console.log('user:', user)
    if (user && user.sub) {
      console.log('User ID from Auth0:', user.sub)
    }
  }, [user])

  const tabs = [
    { id: 'your-designs', name: 'Your designs', icon: BriefcaseIcon },
    { id: 'templates', name: 'Templates', icon: DocumentIcon },
  ]

  const handleItemClick = (item) => {
    console.log('Item clicked:', item)
    setSelectedItem(item)
    setSidebarOpen(true)
  }

  const handleTemplateClick = (item) => {
    console.log('Template clicked:', item)
    setSelectedItem(item)
    setSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
    setSelectedItem(null)
  }

  const handleOpenDesign = () => {
    console.log('Opening design:', selectedItem)
    if (selectedItem?.id) {
      navigate(`/editor/${selectedItem.id}`)
      setSidebarOpen(false)
      setSelectedItem(null)
    }
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
                <div className="text-right">
                  <p className="text-sm text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-gray-400">{user?.email || 'user@example.com'}</p>
                </div>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'your-designs' && (
              <YourDesigns onItemClick={handleItemClick} />
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
        />
      </div>
    </div>
  )
}

export default Home