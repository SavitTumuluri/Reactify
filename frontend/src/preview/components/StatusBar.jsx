import React from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const StatusBar = ({ 
  isCompiling, 
  compilationError
}) => {

  return (
    <div className="bg-gray-800 border-t border-gray-700 px-4 py-2 flex items-center justify-between text-xs text-gray-300">
      <div className="flex items-center space-x-4">
        {/* Status */}
        <div className="flex items-center space-x-2">
          {isCompiling ? (
            <>
              <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span>Compiling...</span>
            </>
          ) : compilationError ? (
            <>
              <ExclamationTriangleIcon className="h-3 w-3 text-red-400" />
              <span className="text-red-400">Error</span>
            </>
          ) : (
            <>
              <CheckCircleIcon className="h-3 w-3 text-green-400" />
              <span className="text-green-400">Ready</span>
            </>
          )}
        </div>

        {/* File info */}
        <div className="flex items-center space-x-2">
          <span>App.jsx</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Line count */}
        <span>React Preview</span>
      </div>
    </div>
  )
}

export default StatusBar