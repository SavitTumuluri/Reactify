import React from 'react';
import { Button } from '../../components/ui/button';
import { 
  Square3Stack3DIcon, 
  PencilIcon, 
  SparklesIcon,
  PhotoIcon,
  ChevronDownIcon,
  EyeIcon,
  CodeBracketIcon,
  ArrowRightOnRectangleIcon,
  AdjustmentsHorizontalIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { motion } from 'motion/react';
import getStateManager from '../state/GlobalStateManager';

const stateman = getStateManager()

export default function Header({ 
  selectedId, 
  onDeleteElement, 
  onPreviewAndExport,
  isConnected,
  isSaving,
  onOpenGallery,
  onAddElement
}) {
  const fileInputRef = React.useRef(null);

  const handleSelectFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      console.log('File upload not implemented yet');
      // reset input so selecting the same file later retriggers change
      e.target.value = '';
      // Open gallery after upload so user can select the uploaded image
      onOpenGallery?.();
    } catch (err) {
      console.error('Upload failed', err);
      alert('Image upload failed. See console for details.');
    }
  };

  const handleUploadImage = () => {
    handleSelectFile();
  };

  const handleOpenGallery = () => {
    onOpenGallery?.();
  };

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-[9999] bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700/50 px-6 py-4 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <motion.div 
            className="flex items-center space-x-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Reactify
            </h1>
          </motion.div>
          
          {/* WebSocket Status Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <div className="relative group">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
            {isSaving && (
              <span className="text-blue-400 animate-pulse">Saving...</span>
            )}
          </div>

          {/* Element Insertion Buttons */}
          <div className="flex items-center gap-3">
            {/* Shapes Dropdown Menu */}
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button as={Fragment}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center space-x-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 backdrop-blur-sm"
                    title="Add Shape"
                  >
                    <Square3Stack3DIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Shapes</span>
                    <ChevronDownIcon className="w-3 h-3" />
                  </Button>
                </motion.div>
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-[10000] mt-2 w-48 origin-top-right rounded-md bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onAddElement?.("rectangle")}
                          className={`${
                            active ? 'bg-gray-700/50 text-white' : 'text-gray-300'
                          } group flex w-full items-center px-4 py-2 text-sm transition-colors duration-150`}
                        >
                          <Square3Stack3DIcon className="w-4 h-4 mr-3" />
                          Rectangle
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onAddElement?.("line")}
                          className={`${
                            active ? 'bg-gray-700/50 text-white' : 'text-gray-300'
                          } group flex w-full items-center px-4 py-2 text-sm transition-colors duration-150`}
                        >
                          <div className="w-4 h-0.5 mr-3 bg-gray-300" />
                          Line
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onAddElement?.("circle")}
                          className={`${
                            active ? 'bg-gray-700/50 text-white' : 'text-gray-300'
                          } group flex w-full items-center px-4 py-2 text-sm transition-colors duration-150`}
                        >
                          <div className="w-4 h-4 mr-3 rounded-full bg-gray-300" />
                          Circle
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onAddElement?.("triangle")}
                          className={`${
                            active ? 'bg-gray-700/50 text-white' : 'text-gray-300'
                          } group flex w-full items-center px-4 py-2 text-sm transition-colors duration-150`}
                        >
                          <div className="w-4 h-4 mr-3 bg-gray-300" style={{ clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)" }} />
                          Triangle
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onAddElement?.("star")}
                          className={`${
                            active ? 'bg-gray-700/50 text-white' : 'text-gray-300'
                          } group flex w-full items-center px-4 py-2 text-sm transition-colors duration-150`}
                        >
                          <div className="w-4 h-4 mr-3 bg-gray-300" style={{ clipPath: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)" }} />
                          Star
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => onAddElement?.("text")}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 backdrop-blur-sm"
                title="Add Text"
              >
                <PencilIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Text</span>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => onAddElement?.("aiComponent")}
                variant="secondary"
                size="sm"
                className="flex items-center space-x-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 backdrop-blur-sm"
                title="Add AI Component"
              >
                <SparklesIcon className="w-4 h-4" />
                <span className="text-sm font-medium">AI Component</span>
              </Button>
            </motion.div>
            {/* Image Insertion Dropdown Menu */}
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button as={Fragment}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="flex items-center space-x-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 backdrop-blur-sm"
                    title="Insert Image"
                  >
                    <PhotoIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Insert</span>
                    <ChevronDownIcon className="w-4 h-4" />
                  </Button>
                </motion.div>
              </Menu.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute left-0 z-[10000] mt-2 w-48 origin-top-left rounded-md bg-gray-800 shadow-lg ring-1 ring-gray-700 ring-opacity-50 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleUploadImage}
                          className={`${
                            active ? 'bg-gray-700 text-white' : 'text-gray-300'
                          } group flex w-full items-center px-4 py-2 text-sm transition-colors duration-200`}
                        >
                          <CloudArrowUpIcon className="mr-3 h-4 w-4" />
                          Upload Image
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleOpenGallery}
                          className={`${
                            active ? 'bg-gray-700 text-white' : 'text-gray-300'
                          } group flex w-full items-center px-4 py-2 text-sm transition-colors duration-200`}
                        >
                          <PhotoIcon className="mr-3 h-4 w-4" />
                          Gallery
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {/* <Button
            onClick={() => stateman.save()}
            variant="default"
            size="sm"
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            disabled={!isConnected}
            title="Manually save canvas"
          >
            <span>{isSaving ? 'Saving...' : 'Save Canvas'}</span>
          </Button> */}
          {/* Settings Dropdown Menu */}
          <Menu as="div" className="relative inline-block text-left">
            <Menu.Button as={Fragment}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex items-center space-x-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 backdrop-blur-sm"
                >
                  <AdjustmentsHorizontalIcon className="w-4 h-4" />
                  <span className="text-sm font-medium">Settings</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </Button>
              </motion.div>
            </Menu.Button>
            
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-[10000] mt-2 w-56 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-gray-700 ring-opacity-50 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                        <button
                          onClick={onPreviewAndExport}
                          className={`${
                            active ? 'bg-gray-700 text-white' : 'text-gray-300'
                          } group flex w-full items-center px-4 py-2 text-sm transition-colors duration-200`}
                        >
                          <EyeIcon className="mr-3 h-4 w-4" />
                          Preview & Export Code
                        </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          // Handle exit canvas - you may want to add a prop for this
                          window.location.href = '/console';
                        }}
                        className={`${
                          active ? 'bg-gray-700 text-white' : 'text-gray-300'
                        } group flex w-full items-center px-4 py-2 text-sm transition-colors duration-200`}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                        Exit Canvas
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </motion.header>
  );
}
