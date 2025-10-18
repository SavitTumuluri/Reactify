import React from 'react';
import { Button } from '../../components/ui/button';
import { 
  PencilIcon,
  ChevronDownIcon,
  EyeIcon,
  CodeBracketIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { motion } from 'motion/react';
import getStateManager from '../state/GlobalStateManager';

const stateman = getStateManager()

export default function Header({ 
  selectedId, 
  onDeleteElement, 
  onAddElement, 
  onPreviewAndExport,
  onOpenGallery,
  isSaving = false
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
    } catch (err) {
      console.error('Upload failed', err);
      alert('Image upload failed. See console for details.');
    }
  };

  return (
    <div className="bg-gray-800/95 backdrop-blur-sm border-b border-gray-700/50 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Logo/Brand */}
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-semibold text-white">Reactify Editor</h1>
        </div>

        {/* Center - Element Insertion Buttons */}
        <div className="flex items-center gap-3">
          {/* Text Button */}
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
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Preview Button */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onPreviewAndExport}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-2 bg-blue-600/50 hover:bg-blue-500/50 border border-blue-500/50 backdrop-blur-sm"
              title="Preview and Export"
            >
              <EyeIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Preview</span>
            </Button>
          </motion.div>

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
                          Preview & Export
                        </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => console.log('Export code')}
                        className={`${
                          active ? 'bg-gray-700 text-white' : 'text-gray-300'
                        } group flex w-full items-center px-4 py-2 text-sm transition-colors duration-200`}
                      >
                        <CodeBracketIcon className="mr-3 h-4 w-4" />
                        Export Code
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}