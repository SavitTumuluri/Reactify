// Combined project files and templates with clean naming architecture
// All files follow the pattern: const reactifyProjectSrcPublicIndexHtml = { ... }

// ============================================================================
// EDITABLE FILES
// ============================================================================



export const reactifyProjectViteConfigJs = {
  name: 'vite.config.js',
  content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  }
})`,
  type: 'javascript',
  editable: false,
  locked: true
}

export const reactifyProjectTailwindConfigJs = {
  name: 'tailwind.config.js',
  content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
  type: 'javascript',
  editable: false,
  locked: true
}

export const reactifyProjectPostcssConfigJs = {
  name: 'postcss.config.js',
  content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
  type: 'javascript',
  editable: false,
  locked: true
}

// ============================================================================
// LOCKED PROJECT FILES
// ============================================================================

export const reactifyProjectPackageJson = {
  name: 'package.json',
  content: `{
  "name": "reactify-project",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@heroicons/react": "^2.0.18"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.45.0",
    "eslint-plugin-react": "^7.32.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "postcss": "^8.4.27",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.5"
  }
}`,
  type: 'config',
  editable: false,
  locked: true
}

export const reactifyProjectReadmeMd = {
  name: 'README.md',
  content: `# Reactify Project

This is a React project created with Vite and styled with Tailwind CSS.

## Getting Started

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

3. Open your browser and navigate to the local development URL.

## Project Structure

- \`src/\` - Source code
- \`public/\` - Static assets
- \`package.json\` - Project dependencies and scripts

## Technologies Used

- React 18
- Vite
- Tailwind CSS
- Heroicons
- Monaco Editor

## Building for Production

\`\`\`bash
npm run build
\`\`\`

The built files will be in the \`dist\` directory.`,
  type: 'markdown',
  editable: false,
  locked: true
}

export const reactifyProjectPublicIndexHtml = {
  name: 'index.html',
  content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reactify Project</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/index.jsx"></script>
  </body>
</html>`,
  type: 'html',
  editable: false,
  locked: true
}

export const reactifyProjectPublicManifestJson = {
  name: 'manifest.json',
  content: `{
  "name": "Reactify Project",
  "short_name": "Reactify",
  "description": "A React project created with Vite",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/vite.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}`,
  type: 'config',
  editable: false,
  locked: true
}

export const reactifyProjectSrcIndexJsx = {
  name: 'index.jsx',
  content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`,
  type: 'jsx',
  editable: false,
  locked: true
}

export const reactifyProjectSrcIndexCss = {
  name: 'index.css',
  content: `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
  type: 'css',
  editable: false,
  locked: true
}

export const reactifyProjectSrcAppJsx = {
  name: 'App.jsx',
  content: `import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import HeroSection from './components/layout/hero-section'
import ConsolePage from './console/Console'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import EditorPage from "./editor/Editor"
import PreviewPage from "./preview/Preview"
import LoadingScreen from './components/ui/LoadingScreen'

function AppContent() {
  const { handleAuthCallback, isAuthenticated, loading } = useAuth()

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      console.error('Auth error:', error);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (code) {
      handleAuthCallback(code).then(() => {
        window.history.replaceState({}, document.title, '/console');
      });
    }
  }, [handleAuthCallback])

  if (loading) {
    return <LoadingScreen message="Initializing Reactify..." />
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/" 
          element={<HeroSection />}
        />
        <Route 
          path="/console" 
          element={
            isAuthenticated ? <ConsolePage /> : <Navigate to="/" replace />
          } 
        />
        <Route 
          path="/editor/:canvasId?" 
          element={
            isAuthenticated ? <EditorPage /> : <Navigate to="/" replace />
          }
        />
        <Route 
          path="/preview/:canvasId" 
          element={
            isAuthenticated ? <PreviewPage /> : <Navigate to="/" replace />
          }
        />

      </Routes>
    </Router>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App`,
  type: 'jsx',
  editable: false,
  locked: true
}

export const reactifyProjectSrcDragResizeStaticJsx = {
  name: 'DragResizeStatic.jsx',
  content: `// src/DragResizeStatic.jsx
import React from "react";

/**
 * DragResizeStatic
 * Renders content at a fixed position/size/angle.
 *
 * You can provide absolute pixel values OR relative values:
 *   - Absolute: pos {x,y} in px, size {w,h} in px
 *   - Relative: posRel {x,y} in [0..1], sizeRel {w,h} in [0..1] + bounds {w,h}
 *
 * If posRel/sizeRel are given, bounds is used to compute pixel layout.
 *
 * Props:
 *  - bounds?: { w: number, h: number }    // required if using posRel/sizeRel
 *  - pos?:    { x: number, y: number }    // px
 *  - size?:   { w: number, h: number }    // px
 *  - posRel?: { x: number, y: number }    // 0..1
 *  - sizeRel?:{ w: number, h: number }    // 0..1
 *  - angle?:  number (degrees)
 *  - className?, style?, showFrame?, borderRadius?
 *  - children: node | ({ posRel, sizeRel, posPx, sizePx, angle }) => node
 */
export default function DragResizeStatic({
  bounds,
  pos,
  size,
  posRel,
  sizeRel,
  angle = 0,
  className,
  style,
  showFrame = true,
  borderRadius = 12,
  children,
}) {
  const bw = Math.max(1, bounds?.w ?? bounds?.width ?? 0);
  const bh = Math.max(1, bounds?.h ?? bounds?.height ?? 0);

  // Derive pixel layout from either relative or absolute props
  const hasRel = posRel || sizeRel;
  if (hasRel && !(bw && bh)) {
    console.warn(
      "DragResizeStatic: posRel/sizeRel provided but bounds is missing or zero-sized."
    );
  }

  const px = {
    x: hasRel ? Math.round((posRel?.x ?? 0) * bw) : (pos?.x ?? 0),
    y: hasRel ? Math.round((posRel?.y ?? 0) * bh) : (pos?.y ?? 0),
    w: hasRel ? Math.round((sizeRel?.w ?? 0.2) * bw) : (size?.w ?? 200),
    h: hasRel ? Math.round((sizeRel?.h ?? 0.12) * bh) : (size?.h ?? 120),
  };

  const outerStyle = {
    position: "absolute",
    transform: \`translate(\${px.x}px, \${px.y}px)\`,
    width: px.w,
    height: px.h,
    boxSizing: "border-box",
    pointerEvents: "auto",
    ...style,
  };

  const rotatedStyle = {
    position: "absolute",
    inset: 0,
    transform: \`rotate(\${angle}deg)\`,
    transformOrigin: "50% 50%",
  };

  const contentBoxStyle = {
    width: "100%",
    height: "100%",
    borderRadius,
    overflow: "hidden",
    background: "#fff",
    ...(showFrame
      ? { border: "1px solid #e5e7eb", boxShadow: "0 6px 16px rgba(0,0,0,.06)" }
      : null),
  };

  const content =
    typeof children === "function"
      ? children({
          posRel: posRel ?? { x: px.x / (bw || 1), y: px.y / (bh || 1) },
          sizeRel: sizeRel ?? { w: px.w / (bw || 1), h: px.h / (bh || 1) },
          posPx: { x: px.x, y: px.y },
          sizePx: { w: px.w, h: px.h },
          angle,
        })
      : children;

  return (
    <div className={className} style={outerStyle}>
      <div style={rotatedStyle}>
        <div style={contentBoxStyle}>{content}</div>
      </div>
    </div>
  );
}`,
  type: 'jsx',
  editable: false,
  locked: true
}

export const reactifyProjectSrcGraphicBoxJsx = {
  name: 'GraphicBox.jsx',
  content: `// src/GraphicBox.jsx
import React, { Children, cloneElement, isValidElement } from "react";

/**
 * GraphicBox
 *
 * Lightweight runtime canvas container (no IR).
 * - Centers a fixed-size "document" in a scrollable workspace.
 * - Injects \`{ bounds: { w, h } }\` into child elements so interactive/static
 *   items (e.g., DragResize / DragResizeStatic) can render consistently.
 *
 * Props:
 *  - size:          { w:number, h:number }   // required-ish; defaults provided
 *  - workplaceBg:   string                   // outer workspace background
 *  - componentName: string                   // label/id metadata (optional)
 *  - className?:    string
 *  - style?:        React.CSSProperties      // applied to the outer workspace
 *  - children:      ReactNode | (args:{bounds:{w,h}})=>ReactNode
 *
 * Note: The inner document background uses a good-looking default (#fff).
 * If you want it configurable, pass a styled wrapper as a child or extend props.
 */
export default function GraphicBox({
  size = { w: 1200, h: 800 },
  workplaceBg = "#f3f4f6",
  componentName = "GraphicBox",
  className,
  style,
  children,
}) {
  const bw = Math.max(1, size?.w ?? size?.width ?? 0);
  const bh = Math.max(1, size?.h ?? size?.height ?? 0);
  const bounds = { w: bw, h: bh };

  // Outer scrollable workspace that centers the document
  const workspaceStyle = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "auto",
    background: workplaceBg,
    display: "grid",
    placeItems: "center",
    padding: 24,
    ...style,
  };

  // The actual "document" area (absolute children position against this box)
  const canvasStyle = {
    position: "relative",
    width: bounds.w,
    height: bounds.h,
    background: "#ffffff", // document background (good default)
    borderRadius: 16,
    boxShadow: "0 12px 28px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.06)",
    border: "1px solid rgba(0,0,0,.06)",
    overflow: "hidden",
  };

  // Render children:
  // - If function-as-children, call with {bounds}
  // - If elements, clone and inject {bounds}
  const renderChildren = () => {
    if (typeof children === "function") {
      return children({ bounds });
    }
    return Children.map(children, (child) =>
      isValidElement(child) ? cloneElement(child, { bounds }) : child
    );
  };

  return (
    <div
      className={className}
      style={workspaceStyle}
      data-component={componentName}
    >
      <div id="canvas" data-canvas style={canvasStyle}>
        {renderChildren()}
      </div>
    </div>
  );
}`,
  type: 'jsx',
  editable: false,
  locked: true
}

// ============================================================================
// DEPENDENCIES
// ============================================================================

export const reactifyProjectDependenciesReact = {
  name: 'react',
  content: `# React ^18.2.0

React is a JavaScript library for building user interfaces, particularly web applications.

## Version: ^18.2.0

## Description
React makes it painless to create interactive UIs. Design simple views for each state in your application, and React will efficiently update and render just the right components when your data changes.

## Key Features
- Declarative: React makes it painless to create interactive UIs
- Component-Based: Build encapsulated components that manage their own state
- Learn Once, Write Anywhere: You can develop new features in React without rewriting existing code

## Installation
\`\`\`bash
npm install react
\`\`\`

## Usage
\`\`\jsx
import React from 'react';

function App() {
  return <h1>Hello, world!</h1>;
}
\`\`\``,
  type: 'dependency',
  editable: false,
  locked: true
}

export const reactifyProjectDependenciesReactDom = {
  name: 'react-dom',
  content: `# React DOM ^18.2.0

React DOM provides DOM-specific methods that can be used at the top level of your app.

## Version: ^18.2.0

## Description
React DOM serves as the entry point to the DOM and server renderers for React. It is intended to be paired with the isomorphic React, which is shipped as react.

## Key Features
- DOM manipulation
- Server-side rendering
- Hydration

## Installation
\`\`\`bash
npm install react-dom
\`\`\`

## Usage
\`\`\jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
\`\`\``,
  type: 'dependency',
  editable: false,
  locked: true
}

export const reactifyProjectDependenciesVite = {
  name: 'vite',
  content: `# Vite ^4.4.5

Next generation frontend tooling.

## Version: ^4.4.5

## Description
Vite is a build tool that aims to provide a faster and leaner development experience for modern web projects.

## Key Features
- Lightning fast cold server start
- Instant Hot Module Replacement (HMR)
- Rich features out of the box
- Optimized build

## Installation
\`\`\`bash
npm install vite
\`\`\`

## Usage
\`\`\json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
\`\`\``,
  type: 'dependency',
  editable: false,
  locked: true
}

export const reactifyProjectDependenciesHeroiconsReact = {
  name: '@heroicons/react',
  content: `# Heroicons React ^2.0.18

Beautiful hand-crafted SVG icons from the makers of Tailwind CSS.

## Version: ^2.0.18

## Description
Heroicons is a set of free MIT-licensed high-quality SVG icons for UI development.

## Key Features
- 300+ icons
- Two styles: outline and solid
- Optimized for React
- Tree-shakeable

## Installation
\`\`\`bash
npm install @heroicons/react
\`\`\`

## Usage
\`\`\jsx
import { HomeIcon } from '@heroicons/react/24/outline'

function MyComponent() {
  return <HomeIcon className="h-6 w-6" />
}
\`\`\``,
  type: 'dependency',
  editable: false,
  locked: true
}

export const reactifyProjectDependenciesTailwindcss = {
  name: 'tailwindcss',
  content: `# Tailwind CSS ^3.3.3

A utility-first CSS framework for rapidly building custom user interfaces.

## Version: ^3.3.3

## Description
Tailwind CSS is a utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.

## Key Features
- Utility-first approach
- Responsive design
- Dark mode support
- Customizable

## Installation
\`\`\`bash
npm install tailwindcss
\`\`\`

## Usage
\`\`\html
<div class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
  Button
</div>
\`\`\``,
  type: 'dependency',
  editable: false,
  locked: true
}

export const reactifyProjectDependenciesAutoprefixer = {
  name: 'autoprefixer',
  content: `# Autoprefixer ^10.4.14

PostCSS plugin to parse CSS and add vendor prefixes to CSS rules.

## Version: ^10.4.14

## Description
Autoprefixer uses Browserslist to determine which CSS properties need prefixes.

## Key Features
- Automatic vendor prefixing
- Uses Browserslist
- PostCSS plugin
- Highly configurable

## Installation
\`\`\`bash
npm install autoprefixer
\`\`\``,
  type: 'dependency',
  editable: false,
  locked: true
}

export const reactifyProjectDependenciesPostcss = {
  name: 'postcss',
  content: `# PostCSS ^8.4.27

A tool for transforming CSS with JavaScript.

## Version: ^8.4.27

## Description
PostCSS is a tool for transforming CSS with JavaScript plugins.

## Key Features
- Plugin ecosystem
- CSS transformations
- Modular architecture
- Fast processing

## Installation
\`\`\`bash
npm install postcss
\`\`\``,
  type: 'dependency',
  editable: false,
  locked: true
}

// ============================================================================
// PREVIEW TEMPLATES
// ============================================================================

export const reactifyProjectPreviewHtmlTemplate = {
  name: 'preview-template.html',
  content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>React Preview</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      margin: 0; 
      padding: 0; 
      font-family: Arial, sans-serif; 
      height: 100%; 
      width: 100%;
      overflow: hidden;
    }
    #root { 
      width: 100%; 
      height: 100vh; 
      margin: 0; 
      padding: 0; 
    }
    .error-container {
      padding: 20px;
      background: #1f2937;
      color: #fca5a5;
      font-family: 'Courier New', monospace;
      white-space: pre-wrap;
      border: 1px solid #dc2626;
      border-radius: 8px;
      margin: 20px;
    }
    .error-title {
      color: #f87171;
      font-weight: bold;
      margin-bottom: 10px;
      font-size: 16px;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  
  <!-- React UMD -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  
  <script>
    // Global error handler
    window.addEventListener('error', function(event) {
      console.error('Runtime error:', event.error);
      const root = document.getElementById('root');
      root.innerHTML = \`
        <div class="error-container">
          <div class="error-title">🚨 Runtime Error</div>
          <div><strong>Error:</strong> \${event.error?.message || event.message || 'Unknown error'}</div>
          <div><strong>File:</strong> \${event.filename || 'Unknown'}</div>
          <div><strong>Line:</strong> \${event.lineno || 'Unknown'}</div>
          <div><strong>Column:</strong> \${event.colno || 'Unknown'}</div>
          <div><strong>Stack:</strong></div>
          <div>\${event.error?.stack || 'No stack trace available'}</div>
        </div>
      \`;
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', function(event) {
      console.error('Unhandled promise rejection:', event.reason);
      const root = document.getElementById('root');
      root.innerHTML = \`
        <div class="error-container">
          <div class="error-title">🚨 Unhandled Promise Rejection</div>
          <div><strong>Reason:</strong> \${event.reason?.message || event.reason || 'Unknown error'}</div>
          <div><strong>Stack:</strong></div>
          <div>\${event.reason?.stack || 'No stack trace available'}</div>
        </div>
      \`;
    });

    try {
      {{CONTENT}}
      
      // Check if App component was defined
      if (typeof window.App !== 'function') {
        throw new Error('App component is not defined. Make sure your code defines window.App as a function.');
      }
      
      // Render the app
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(window.App));
    } catch (error) {
      console.error('Compilation error:', error);
      const root = document.getElementById('root');
      root.innerHTML = \`
        <div class="error-container">
          <div class="error-title">🚨 Compilation Error</div>
          <div><strong>Error:</strong> \${error.message}</div>
          <div><strong>Stack:</strong></div>
          <div>\${error.stack || 'No stack trace available'}</div>
        </div>
      \`;
    }
  </script>
</body>
</html>`,
  type: 'template',
  editable: false,
  locked: true
}

// ============================================================================
// CODE TEMPLATES
// ============================================================================

export const reactifyProjectTemplatesAppCss = {
  name: 'App.css',
  content: `/* App.css */
.app {
  text-align: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

.app-header {
  background: white;
  padding: 2rem;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  max-width: 500px;
  width: 90%;
}

.app-header h1 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 2.5rem;
  font-weight: 700;
}

.app-header p {
  color: #666;
  margin-bottom: 2rem;
  font-size: 1.1rem;
}

.counter-section {
  margin: 2rem 0;
}

.counter-display {
  font-size: 4rem;
  font-weight: bold;
  color: #667eea;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 2rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 100px;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a6fd8;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(108, 117, 125, 0.4);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(220, 53, 69, 0.4);
}

.name-input {
  padding: 0.75rem;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 1rem;
  width: 100%;
  max-width: 300px;
  transition: border-color 0.3s ease;
}

.name-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}`,
  type: 'css',
  editable: true,
  locked: false
}


// LEGACY COMPATIBILITY EXPORTS
// ============================================================================

// For backward compatibility with existing code
export const editableFiles = {
  'App.jsx': reactifyProjectSrcAppJsx
}

export const lockedFiles = {
  'package.json': reactifyProjectPackageJson,
  'README.md': reactifyProjectReadmeMd,
  'vite.config.js': reactifyProjectViteConfigJs,
  'tailwind.config.js': reactifyProjectTailwindConfigJs,
  'postcss.config.js': reactifyProjectPostcssConfigJs,
  'index.html': reactifyProjectPublicIndexHtml,
  'public/manifest.json': reactifyProjectPublicManifestJson,
  'src/index.jsx': reactifyProjectSrcIndexJsx,
  'src/index.css': reactifyProjectSrcIndexCss,
  'src/App.jsx': reactifyProjectSrcAppJsx,
  'src/DragResizeStatic.jsx': reactifyProjectSrcDragResizeStaticJsx,
  'src/GraphicBox.jsx': reactifyProjectSrcGraphicBoxJsx,
  'react': reactifyProjectDependenciesReact,
  'react-dom': reactifyProjectDependenciesReactDom,
  'vite': reactifyProjectDependenciesVite,
  '@heroicons/react': reactifyProjectDependenciesHeroiconsReact,
  'tailwindcss': reactifyProjectDependenciesTailwindcss,
  'autoprefixer': reactifyProjectDependenciesAutoprefixer,
  'postcss': reactifyProjectDependenciesPostcss
}

export const codeTemplates = {
  'App.jsx': reactifyProjectSrcAppJsx.content,
  'App.css': reactifyProjectTemplatesAppCss.content,
  'index.js': `// This file is handled automatically by the preview system`,
  'package.json': reactifyProjectPackageJson.content
}

export const previewTemplates = {
  'html-template': reactifyProjectPreviewHtmlTemplate
}

export const nestedLockedFiles = {
  'project-structure/package.json': reactifyProjectPackageJson,
  'project-structure/README.md': reactifyProjectReadmeMd,
  'project-structure/vite.config.js': reactifyProjectViteConfigJs,
  'project-structure/tailwind.config.js': reactifyProjectTailwindConfigJs,
  'project-structure/postcss.config.js': reactifyProjectPostcssConfigJs,
  'project-structure/index.html': reactifyProjectPublicIndexHtml,
  'project-structure/public/manifest.json': reactifyProjectPublicManifestJson,
  'project-structure/src/index.jsx': reactifyProjectSrcIndexJsx,
  'project-structure/src/index.css': reactifyProjectSrcIndexCss,
  'dependencies/react': reactifyProjectDependenciesReact,
  'dependencies/react-dom': reactifyProjectDependenciesReactDom,
  'dependencies/vite': reactifyProjectDependenciesVite,
  'dependencies/@heroicons/react': reactifyProjectDependenciesHeroiconsReact,
  'dependencies/tailwindcss': reactifyProjectDependenciesTailwindcss,
  'dependencies/autoprefixer': reactifyProjectDependenciesAutoprefixer,
  'dependencies/postcss': reactifyProjectDependenciesPostcss
}