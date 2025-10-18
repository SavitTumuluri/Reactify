import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { XMarkIcon, TrashIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'motion/react';

// Mock functions for now - replace with actual S3 service when ready
const listS3Images = async ({ prefix, token }) => {
  // Mock implementation - replace with actual S3 service
  console.log('Mock listS3Images called with:', { prefix, token });
  return {
    images: [
      { key: 'uploads/image1.jpg', url: 'https://via.placeholder.com/300x200', name: 'image1.jpg' },
      { key: 'uploads/image2.jpg', url: 'https://via.placeholder.com/300x200', name: 'image2.jpg' },
      { key: 'uploads/image3.jpg', url: 'https://via.placeholder.com/300x200', name: 'image3.jpg' },
    ]
  };
};

const deleteS3Files = async (keys) => {
  // Mock implementation - replace with actual S3 service
  console.log('Mock deleteS3Files called with:', keys);
  return { success: true };
};

export default function ImageGallery({ isOpen, onClose, onSelectImage }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen]);

  const loadImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('access_token');
      const res = await listS3Images({ prefix: 'uploads/', token });
      setImages(res.images || []);
    } catch (err) {
      console.error('Failed to load images:', err);
      setError('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (image) => {
    if (onSelectImage) {
      onSelectImage(image);
      onClose();
    }
  };

  const handleImageDelete = async (key) => {
    try {
      await deleteS3Files([key]);
      setImages(images.filter(img => img.key !== key));
    } catch (err) {
      console.error('Failed to delete image:', err);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) return;
    
    try {
      const keys = selectedImages.map(img => img.key);
      await deleteS3Files(keys);
      setImages(images.filter(img => !keys.includes(img.key)));
      setSelectedImages([]);
    } catch (err) {
      console.error('Failed to delete images:', err);
    }
  };

  const toggleImageSelection = (image) => {
    setSelectedImages(prev => 
      prev.some(img => img.key === image.key)
        ? prev.filter(img => img.key !== image.key)
        : [...prev, image]
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold text-white">Image Gallery</h2>
            <div className="flex items-center gap-2">
              {selectedImages.length > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete ({selectedImages.length})
                </Button>
              )}
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-gray-400">Loading images...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-red-400 mb-4">{error}</p>
                  <Button onClick={loadImages} variant="outline">
                    Retry
                  </Button>
                </div>
              </div>
            ) : images.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <CloudArrowUpIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">No images found</p>
                  <p className="text-sm text-gray-500">Upload some images to get started</p>
                </div>
              </div>
            ) : (
              <div className="p-4 h-full overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {images.map((image) => (
                    <motion.div
                      key={image.key}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImages.some(img => img.key === image.key)
                          ? 'border-blue-500'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => handleImageSelect(image)}
                    >
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-24 object-cover"
                      />
                      
                      {/* Selection overlay */}
                      {selectedImages.some(img => img.key === image.key) && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">✓</span>
                          </div>
                        </div>
                      )}

                      {/* Hover actions */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleImageSelection(image);
                          }}
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 bg-black/50 hover:bg-black/70 text-white"
                        >
                          {selectedImages.some(img => img.key === image.key) ? '✓' : '○'}
                        </Button>
                      </div>

                      <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageDelete(image.key);
                          }}
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 bg-red-500/80 hover:bg-red-500 text-white"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Image name */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                        <p className="text-white text-xs truncate">{image.name}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
