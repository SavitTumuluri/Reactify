import React from 'react'
import {NewEditableText} from "./test"

const EditorPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Future Canvas
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center items-center">
        <div
          id="future-canvas"
          className="w-full h-[70vh] bg-white rounded-lg shadow border border-gray-200"
        >
            <NewEditableText></NewEditableText>
        </div>
      </main>
    </div>
  )
}

export default EditorPage