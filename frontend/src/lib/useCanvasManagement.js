import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';
import canvasService from './canvasService';

export const useCanvasManagement = (userId) => {
  const [canvases, setCanvases] = useState([]);
  const [currentCanvas, setCurrentCanvas] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const hasLoadedRef = useRef(false);
  const loadingTimeoutRef = useRef(null);

  const {
    isConnected,
    getUserCanvases,
    getCanvasData,
    saveCanvasData,
    deleteCanvas: deleteCanvasWebSocket,
    onUserCanvasesResponse,
    onUserCanvasesError,
    onCanvasDataResponse,
    onCanvasDataError,
    offUserCanvasesResponse,
    offUserCanvasesError,
    offCanvasDataResponse,
    offCanvasDataError,
  } = useWebSocket();

  // Set current user in canvas service
  useEffect(() => {
    if (userId) {
      canvasService.setCurrentUser(userId);
    }
  }, [userId]);

  // Load user's canvases
  const loadUserCanvases = useCallback(async () => {
    if (!userId || !isConnected) {
      console.log('loadUserCanvases: userId or isConnected missing', { userId, isConnected });
      return;
    }

    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }

    // Debounce the loading to prevent rapid successive calls
    loadingTimeoutRef.current = setTimeout(() => {
      console.log('loadUserCanvases: Starting to load canvases for user', userId);
      setIsLoading(true);
      setError(null);

      // Set up event listeners
      const handleCanvasesResponse = (data) => {
        console.log('loadUserCanvases: Received canvases response', data);
        setCanvases(data.canvases || []);
        setIsLoading(false);
      };

      const handleCanvasesError = (error) => {
        console.log('loadUserCanvases: Received error', error);
        setError(error.error || 'Failed to load canvases');
        setIsLoading(false);
      };

      onUserCanvasesResponse(handleCanvasesResponse);
      onUserCanvasesError(handleCanvasesError);

      // Request user canvases
      console.log('loadUserCanvases: Requesting user canvases');
      getUserCanvases(userId);

      // Cleanup listeners after a timeout
      setTimeout(() => {
        offUserCanvasesResponse(handleCanvasesResponse);
        offUserCanvasesError(handleCanvasesError);
      }, 5000);
    }, 300); // 300ms debounce
  }, [userId, isConnected, getUserCanvases, onUserCanvasesResponse, onUserCanvasesError, offUserCanvasesResponse, offUserCanvasesError]);

  // Load specific canvas data
  const loadCanvas = useCallback(async (canvasId) => {
    if (!userId || !canvasId || !isConnected) return;

    setIsLoading(true);
    setError(null);

    // Set up event listeners
    const handleCanvasResponse = (data) => {
      if (data.canvasData) {
        setCurrentCanvas({
          id: canvasId,
          data: data.canvasData,
          timestamp: data.timestamp
        });
        canvasService.setCurrentCanvas(canvasId);
      }
      setIsLoading(false);
    };

    const handleCanvasError = (error) => {
      setError(error.error || 'Failed to load canvas');
      setIsLoading(false);
    };

    onCanvasDataResponse(handleCanvasResponse);
    onCanvasDataError(handleCanvasError);

    // Request canvas data
    getCanvasData(userId, canvasId);

    // Cleanup listeners after a timeout
    setTimeout(() => {
      offCanvasDataResponse(handleCanvasResponse);
      offCanvasDataError(handleCanvasError);
    }, 5000);
  }, [userId, isConnected, getCanvasData, onCanvasDataResponse, onCanvasDataError, offCanvasDataResponse, offCanvasDataError]);

  // Create new canvas
  const createCanvas = useCallback((canvasName = 'Untitled Canvas') => {
    if (!userId) {
      console.log('createCanvas: No userId provided');
      return null;
    }

    console.log('createCanvas: Creating canvas with name', canvasName);
    const canvasId = canvasService.generateCanvasId();
    const newCanvas = {
      id: canvasId,
      name: canvasName,
      data: {
        ir: null,
        bounds: { w: 1200, h: 800 },
        canvasBackground: '#ffffff',
        selectedId: null,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString()
    };

    console.log('createCanvas: Created canvas object', newCanvas);

    // Add to local state
    setCanvases(prev => {
      const updated = [newCanvas, ...prev];
      console.log('createCanvas: Updated canvases array', updated);
      return updated;
    });
    setCurrentCanvas(newCanvas);
    canvasService.setCurrentCanvas(canvasId, canvasName);

    // Save to DynamoDB via WebSocket
    if (isConnected) {
      console.log('createCanvas: Saving to DynamoDB via WebSocket');
      saveCanvasData(userId, canvasId, newCanvas.data, canvasName);
    } else {
      console.log('createCanvas: Not connected to WebSocket, skipping save');
    }

    return newCanvas;
  }, [userId, isConnected, saveCanvasData]);

  // Save current canvas
  const saveCurrentCanvas = useCallback((canvasData) => {
    if (!userId || !canvasService.getCurrentCanvasId() || !isConnected) return false;

    const canvasId = canvasService.getCurrentCanvasId();
    const success = saveCanvasData(userId, canvasId, canvasData);
    
    if (success) {
      // Update local canvas data
      setCurrentCanvas(prev => ({
        ...prev,
        data: canvasData,
        timestamp: new Date().toISOString()
      }));
    }

    return success;
  }, [userId, isConnected, saveCanvasData]);

  // Delete canvas
  const deleteCanvas = useCallback((canvasId) => {
    if (!userId || !canvasId) return false;

    // Remove from local state
    setCanvases(prev => prev.filter(canvas => canvas.id !== canvasId));
    
    // If deleting current canvas, clear it
    if (currentCanvas?.id === canvasId) {
      setCurrentCanvas(null);
      canvasService.setCurrentCanvas(null);
    }

    // Delete from DynamoDB via WebSocket
    if (isConnected) {
      deleteCanvasWebSocket(userId, canvasId);
    }

    return true;
  }, [userId, currentCanvas, isConnected, deleteCanvasWebSocket]);

  // Load canvases on mount and when user changes
  useEffect(() => {
    if (userId && isConnected) {
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        loadUserCanvases();
      }
    } else {
      // Reset when user disconnects or changes
      hasLoadedRef.current = false;
      setCanvases([]);
    }

    // Cleanup timeout on unmount
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [userId, isConnected]);

  return {
    canvases,
    currentCanvas,
    isLoading,
    error,
    isConnected,
    loadUserCanvases,
    loadCanvas,
    createCanvas,
    saveCurrentCanvas,
    deleteCanvas,
    currentCanvasId: canvasService.getCurrentCanvasId(),
  };
};
