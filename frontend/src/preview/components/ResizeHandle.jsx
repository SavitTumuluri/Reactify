import React from 'react'

const ResizeHandle = ({ 
  isResizing, 
  onMouseDown, 
  className = '',
  orientation = 'vertical' 
}) => {
  return (
    <div
      className={`bg-gray-700 hover:bg-gray-600 transition-colors cursor-col-resize group relative z-10 ${className}`}
      onMouseDown={onMouseDown}
      style={{ 
        width: '8px',
        minWidth: '8px',
        maxWidth: '8px'
      }}
    >
      {/* Visual indicator */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-1 h-8 bg-gray-500 group-hover:bg-gray-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      
      {/* Larger hit area for easier interaction */}
      <div className="absolute inset-0 -mx-2" />
    </div>
  )
}

export default ResizeHandle
