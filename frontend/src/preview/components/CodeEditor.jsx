import React from 'react'
import { Editor } from '@monaco-editor/react'

const CodeEditor = ({ currentTab, updateTabContent, content, onChange, language, editable }) => {
  const getLanguage = (filename) => {
    if (filename?.endsWith('.css')) return 'css'
    if (filename?.endsWith('.json')) return 'json'
    if (filename?.endsWith('.js') || filename?.endsWith('.jsx')) return 'javascript'
    return 'javascript'
  }

  // Use new props if provided, otherwise fall back to old props
  const editorContent = content || currentTab?.content || ''
  const editorLanguage = language || getLanguage(currentTab?.name) || 'javascript'
  const editorOnChange = onChange || updateTabContent

  if (!editorContent && !currentTab) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-900 min-h-0">
        <div className="text-center text-gray-400">
          <p>No file selected</p>
          <p className="text-sm">Select a file from the sidebar</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 h-full min-h-0 min-w-0">
      <Editor
        height="100%"
        width="100%"
        language={editorLanguage}
        theme="vs-dark"
        value={editorContent || '// Loading...'}
        onChange={(value) => editorOnChange(value)}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'on',
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          wrappingIndent: 'indent',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true
          }
        }}
      />
    </div>
  )
}

export default CodeEditor
