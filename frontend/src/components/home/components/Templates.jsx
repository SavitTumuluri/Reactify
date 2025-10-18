import React, { useState } from 'react'
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  Bars3Icon,
  StarIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

const Templates = ({ onItemClick }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const templates = [
    { 
      id: 1, 
      title: 'Modern Portfolio', 
      category: 'Portfolio',
      rating: 4.8,
      downloads: '2.3k',
      preview: '💼',
      featured: true,
      price: 'Free',
      author: 'Design Studio',
      lastUpdated: '2025-09-15',
      tags: ['portfolio', 'modern', 'responsive']
    },
    { 
      id: 2, 
      title: 'E-commerce Landing', 
      category: 'E-commerce',
      rating: 4.9,
      downloads: '5.1k',
      preview: '🛒',
      featured: false,
      price: '$29',
      author: 'E-commerce Pro',
      lastUpdated: '2025-09-20',
      tags: ['ecommerce', 'landing', 'shop']
    },
    { 
      id: 3, 
      title: 'Blog Template', 
      category: 'Blog',
      rating: 4.7,
      downloads: '1.8k',
      preview: '📝',
      featured: true,
      price: 'Free',
      author: 'Blog Master',
      lastUpdated: '2025-09-10',
      tags: ['blog', 'content', 'writing']
    },
    { 
      id: 4, 
      title: 'Corporate Website', 
      category: 'Business',
      rating: 4.6,
      downloads: '3.2k',
      preview: '🏢',
      featured: false,
      price: '$49',
      author: 'Business Solutions',
      lastUpdated: '2025-09-05',
      tags: ['corporate', 'business', 'professional']
    },
    { 
      id: 5, 
      title: 'Creative Agency', 
      category: 'Agency',
      rating: 4.9,
      downloads: '4.7k',
      preview: '🎨',
      featured: true,
      price: '$39',
      author: 'Creative Hub',
      lastUpdated: '2025-09-18',
      tags: ['agency', 'creative', 'portfolio']
    },
    { 
      id: 6, 
      title: 'Restaurant Menu', 
      category: 'Food',
      rating: 4.5,
      downloads: '1.2k',
      preview: '🍽️',
      featured: false,
      price: '$19',
      author: 'Food Design',
      lastUpdated: '2025-08-30',
      tags: ['restaurant', 'food', 'menu']
    },
    { 
      id: 7, 
      title: 'SaaS Landing', 
      category: 'SaaS',
      rating: 4.8,
      downloads: '6.1k',
      preview: '💻',
      featured: true,
      price: '$59',
      author: 'SaaS Experts',
      lastUpdated: '2025-09-22',
      tags: ['saas', 'landing', 'tech']
    },
    { 
      id: 8, 
      title: 'Photography Portfolio', 
      category: 'Portfolio',
      rating: 4.7,
      downloads: '2.9k',
      preview: '📸',
      featured: false,
      price: '$29',
      author: 'Photo Studio',
      lastUpdated: '2025-09-12',
      tags: ['photography', 'portfolio', 'gallery']
    },
    { 
      id: 9, 
      title: 'Event Landing', 
      category: 'Events',
      rating: 4.4,
      downloads: '1.5k',
      preview: '🎉',
      featured: false,
      price: 'Free',
      author: 'Event Pro',
      lastUpdated: '2025-08-25',
      tags: ['event', 'landing', 'celebration']
    },
    { 
      id: 10, 
      title: 'Fitness Studio', 
      category: 'Health',
      rating: 4.6,
      downloads: '2.1k',
      preview: '💪',
      featured: false,
      price: '$35',
      author: 'Health Design',
      lastUpdated: '2025-09-08',
      tags: ['fitness', 'health', 'gym']
    },
    { 
      id: 11, 
      title: 'Real Estate', 
      category: 'Real Estate',
      rating: 4.5,
      downloads: '3.8k',
      preview: '🏠',
      featured: false,
      price: '$45',
      author: 'Property Pro',
      lastUpdated: '2025-09-14',
      tags: ['real estate', 'property', 'housing']
    },
    { 
      id: 12, 
      title: 'Tech Startup', 
      category: 'SaaS',
      rating: 4.9,
      downloads: '7.2k',
      preview: '🚀',
      featured: true,
      price: '$69',
      author: 'Startup Studio',
      lastUpdated: '2025-09-25',
      tags: ['startup', 'tech', 'innovation']
    },
    { 
      id: 13, 
      title: 'Wedding Planner', 
      category: 'Events',
      rating: 4.7,
      downloads: '1.9k',
      preview: '💍',
      featured: false,
      price: '$25',
      author: 'Wedding Pro',
      lastUpdated: '2025-09-03',
      tags: ['wedding', 'events', 'celebration']
    },
    { 
      id: 14, 
      title: 'Coffee Shop', 
      category: 'Food',
      rating: 4.4,
      downloads: '2.7k',
      preview: '☕',
      featured: false,
      price: '$22',
      author: 'Cafe Design',
      lastUpdated: '2025-08-28',
      tags: ['coffee', 'cafe', 'food']
    },
    { 
      id: 15, 
      title: 'Travel Blog', 
      category: 'Blog',
      rating: 4.8,
      downloads: '4.3k',
      preview: '✈️',
      featured: true,
      price: 'Free',
      author: 'Travel Studio',
      lastUpdated: '2025-09-16',
      tags: ['travel', 'blog', 'adventure']
    },
    { 
      id: 16, 
      title: 'Law Firm', 
      category: 'Business',
      rating: 4.3,
      downloads: '1.6k',
      preview: '⚖️',
      featured: false,
      price: '$55',
      author: 'Legal Design',
      lastUpdated: '2025-08-20',
      tags: ['law', 'legal', 'professional']
    },
  ]

  // Filter templates based on search query
  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const categories = ['All', 'Portfolio', 'E-commerce', 'Blog', 'Business', 'Agency', 'Food', 'SaaS', 'Events']

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

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category, index) => (
          <button
            key={index}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              index === 0 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Templates Section */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Templates</h2>
            <div className="flex items-center space-x-4">
              <select className="bg-gray-700 text-white px-3 py-2 rounded-lg text-sm">
                <option>Most Popular</option>
                <option>Newest</option>
                <option>Highest Rated</option>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => onItemClick(template)}
                className="bg-gray-700 rounded-xl p-4 hover:bg-gray-600 transition-colors cursor-pointer group relative"
              >
                {template.featured && (
                  <div className="absolute top-3 left-3 bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <StarIcon className="h-3 w-3" />
                    Featured
                  </div>
                )}
                
                <div className="aspect-video bg-white rounded-lg mb-3 flex items-center justify-center text-4xl">
                  {template.preview}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-white truncate">{template.title}</h3>
                    <button className="p-1 hover:bg-gray-600 rounded transition-colors">
                      <HeartIcon className="h-4 w-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-400">{template.category}</p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <StarIcon className="h-3 w-3 text-yellow-500" />
                      <span>{template.rating}</span>
                    </div>
                    <span>{template.downloads} downloads</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Templates
