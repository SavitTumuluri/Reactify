import { useEffect, useRef, useState } from 'react';
import websocketService from './websocketService';

export const useWebSocket = (serverUrl = 'http://localhost:5006') => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    isConnected: false,
    socketId: null,
    reconnectAttempts: 0
  });
  const [lastError, setLastError] = useState(null);
  const [lastSaveStatus, setLastSaveStatus] = useState(null);
  
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    socketRef.current = websocketService.connect(serverUrl);

    // Set up connection status monitoring
    const updateConnectionStatus = () => {
      const status = websocketService.getConnectionStatus();
      setConnectionStatus(status);
      setIsConnected(status.isConnected);
    };

    // Initial status check
    updateConnectionStatus();

    // Set up event listeners for connection status
    const handleConnect = () => {
      updateConnectionStatus();
      setLastError(null);
    };

    const handleDisconnect = () => {
      updateConnectionStatus();
    };

    const handleError = (error) => {
      setLastError(error);
      updateConnectionStatus();
    };

    // Listen for connection events
    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('connect_error', handleError);

    // Set up canvas-specific event listeners
    const handleCanvasSaved = (data) => {
      setLastSaveStatus({ type: 'saved', data, timestamp: new Date() });
    };

    const handleCanvasSaveError = (error) => {
      setLastSaveStatus({ type: 'error', error, timestamp: new Date() });
      setLastError(error);
    };

    websocketService.onCanvasSaved(handleCanvasSaved);
    websocketService.onCanvasSaveError(handleCanvasSaveError);

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('connect_error', handleError);
      }
      websocketService.offCanvasSaved(handleCanvasSaved);
      websocketService.offCanvasSaveError(handleCanvasSaveError);
    };
  }, [serverUrl]);

  // Canvas operations
  const saveCanvasData = (userId, canvasId, canvasData, canvasName = null) => {
    const success = websocketService.saveCanvasData(userId, canvasId, canvasData, canvasName);
    if (!success) {
      setLastError('WebSocket not connected');
    }
    return success;
  };

  const getCanvasData = (userId, canvasId) => {
    const success = websocketService.getCanvasData(userId, canvasId);
    if (!success) {
      setLastError('WebSocket not connected');
    }
    return success;
  };

  const getUserCanvases = (userId) => {
    const success = websocketService.getUserCanvases(userId);
    if (!success) {
      setLastError('WebSocket not connected');
    }
    return success;
  };

  const deleteCanvas = (userId, canvasId) => {
    const success = websocketService.deleteCanvas(userId, canvasId);
    if (!success) {
      setLastError('WebSocket not connected');
    }
    return success;
  };

  // Event listener helpers
  const onCanvasDataResponse = (callback) => {
    websocketService.onCanvasDataResponse(callback);
  };

  const onCanvasDataError = (callback) => {
    websocketService.onCanvasDataError(callback);
  };

  const onUserCanvasesResponse = (callback) => {
    websocketService.onUserCanvasesResponse(callback);
  };

  const onUserCanvasesError = (callback) => {
    websocketService.onUserCanvasesError(callback);
  };

  const onCanvasDeleted = (callback) => {
    websocketService.onCanvasDeleted(callback);
  };

  const onCanvasDeleteError = (callback) => {
    websocketService.onCanvasDeleteError(callback);
  };

  const offCanvasDataResponse = (callback) => {
    websocketService.offCanvasDataResponse(callback);
  };

  const offCanvasDataError = (callback) => {
    websocketService.offCanvasDataError(callback);
  };

  const offUserCanvasesResponse = (callback) => {
    websocketService.offUserCanvasesResponse(callback);
  };

  const offUserCanvasesError = (callback) => {
    websocketService.offUserCanvasesError(callback);
  };

  const offCanvasDeleted = (callback) => {
    websocketService.offCanvasDeleted(callback);
  };

  const offCanvasDeleteError = (callback) => {
    websocketService.offCanvasDeleteError(callback);
  };

  return {
    isConnected,
    connectionStatus,
    lastError,
    lastSaveStatus,
    saveCanvasData,
    getCanvasData,
    getUserCanvases,
    deleteCanvas,
    onCanvasDataResponse,
    onCanvasDataError,
    onUserCanvasesResponse,
    onUserCanvasesError,
    onCanvasDeleted,
    onCanvasDeleteError,
    offCanvasDataResponse,
    offCanvasDataError,
    offUserCanvasesResponse,
    offUserCanvasesError,
    offCanvasDeleted,
    offCanvasDeleteError,
  };
};
