import React, { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { motion } from "motion/react";
import { 
  SparklesIcon,
  PaintBrushIcon,
  CubeIcon,
  ChartBarIcon,
  PhotoIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

const AI_COMPONENT_TYPES = [
  {
    id: "icon",
    name: "Icon",
    description: "Generate custom icons and symbols",
    icon: PaintBrushIcon,
    color: "from-blue-500 to-cyan-500",
    examples: ["star", "heart", "arrow", "checkmark"]
  },
  {
    id: "illustration",
    name: "Illustration",
    description: "Create detailed illustrations and graphics",
    icon: PhotoIcon,
    color: "from-purple-500 to-pink-500",
    examples: ["landscape", "character", "abstract art", "logo design"]
  },
  {
    id: "chart",
    name: "Chart",
    description: "Generate data visualizations and charts",
    icon: ChartBarIcon,
    color: "from-green-500 to-emerald-500",
    examples: ["bar chart", "pie chart", "line graph", "dashboard"]
  },
  {
    id: "ui-component",
    name: "UI Component",
    description: "Create interface elements and widgets",
    icon: CubeIcon,
    color: "from-orange-500 to-red-500",
    examples: ["button", "card", "modal", "navigation"]
  },
  {
    id: "decoration",
    name: "Decoration",
    description: "Add decorative elements and patterns",
    icon: SparklesIcon,
    color: "from-yellow-500 to-orange-500",
    examples: ["border", "pattern", "ornament", "background"]
  }
];

export default function AIComponentSelector({ isOpen, onClose, onSelect }) {
  const [selectedType, setSelectedType] = useState(null);
  const [customPrompt, setCustomPrompt] = useState("");

  const handleSelect = (type) => {
    setSelectedType(type);
  };

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    if (selectedType) {
      onSelect?.(selectedType.id, customPrompt.trim() || selectedType.examples[0]);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedType(null);
    setCustomPrompt("");
    onClose?.();
  };

  return (
    <Transition appear show={!!isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100000]" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 scale-95"
              enterTo="opacity-100 translate-y-0 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 scale-100"
              leaveTo="opacity-0 translate-y-2 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl border border-gray-700 bg-gray-900 p-6 text-left align-middle shadow-2xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Dialog.Title className="text-2xl font-bold text-white flex items-center gap-3">
                      <SparklesIcon className="h-8 w-8 text-purple-400" />
                      AI Component Generator
                    </Dialog.Title>
                    <p className="text-gray-400 mt-2">
                      Choose a component type and describe what you want to create
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {AI_COMPONENT_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType?.id === type.id;
                    
                    return (
                      <motion.div
                        key={type.id}
                        onClick={() => handleSelect(type)}
                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${type.color} flex items-center justify-center mb-3`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">{type.name}</h3>
                        <p className="text-sm text-gray-400 mb-3">{type.description}</p>
                        <div className="text-xs text-gray-500">
                          <span className="font-medium">Examples:</span> {type.examples.join(", ")}
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2">
                            <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {selectedType && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-t border-gray-700 pt-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Describe your {selectedType.name.toLowerCase()}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <input
                          type="text"
                          value={customPrompt}
                          onChange={(e) => setCustomPrompt(e.target.value)}
                          placeholder={`e.g., ${selectedType.examples[0]}`}
                          className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          autoFocus
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Be specific about style, colors, and details for better results
                        </p>
                      </div>
                      
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={handleClose}
                          className="px-6 py-2 text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!customPrompt.trim()}
                          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2"
                        >
                          <SparklesIcon className="h-4 w-4" />
                          Generate Component
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
