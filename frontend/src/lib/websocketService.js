// src/lib/websocketService.js
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.serverUrl = null;

    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;

    // queue emits while we’re connecting
    this.emitQueue = [];

    // listeners that want connection status updates
    this.statusListeners = new Set();
  }

  _notifyStatus() {
    const snapshot = this.getConnectionStatus();
    this.statusListeners.forEach(cb => {
      try { cb(snapshot); } catch {}
    });
  }

  onStatusChange(cb) {
    this.statusListeners.add(cb);
    // push current status immediately
    try { cb(this.getConnectionStatus()); } catch {}
  }

  offStatusChange(cb) {
    this.statusListeners.delete(cb);
  }

  connect(serverUrl = 'http://localhost:5006') {
    this.serverUrl = serverUrl;

    // If there’s already a socket, just ensure it’s connected.
    if (this.socket) {
      if (!this.socket.connected) {
        this.socket.connect();
      }
      return this.socket;
    }

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      withCredentials: true,       // <-- matches server CORS credentials
      path: '/socket.io',          // <-- explicit path (default, but removes ambiguity)
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      // flush queued emits
      const q = [...this.emitQueue];
      this.emitQueue.length = 0;
      q.forEach(({ event, payload }) => {
        try { this.socket.emit(event, payload); } catch {}
      });
      this._notifyStatus();
      console.log('WebSocket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this._notifyStatus();
      console.log('WebSocket disconnected:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      this.isConnected = false;
      this._notifyStatus();
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    return this.socket;
  }

  handleReconnect() {
    if (!this.socket) return;

    // socket.io’s own reconnection is enabled; we just track attempts for UI
    this.reconnectAttempts++;
    this._notifyStatus();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this._notifyStatus();
    }
  }

  /** Emit immediately if connected, otherwise queue it until connected. */
  _emitOrQueue(event, payload) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, payload);
      return true;
    }
    // ensure a connection attempt is underway
    if (!this.socket) this.connect(this.serverUrl || 'http://localhost:5006');
    this.emitQueue.push({ event, payload });
    return true; // report success; it will send once connected
  }

  // -------- Canvas API (now tolerant to early calls) --------
  saveCanvasData(userId, canvasId, canvasData, canvasName = null) {
    return this._emitOrQueue('canvas-change', { userId, canvasId, canvasData, canvasName });
  }

  getCanvasData(userId, canvasId) {
    return this._emitOrQueue('get-canvas-data', { userId, canvasId });
  }

  getUserCanvases(userId) {
    return this._emitOrQueue('get-user-canvases', { userId });
  }

  deleteCanvas(userId, canvasId) {
    return this._emitOrQueue('delete-canvas', { userId, canvasId });
  }

  // -------- Event listeners (unchanged) --------
  onCanvasSaved(callback) { this.socket?.on('canvas-saved', callback); }
  onCanvasSaveError(callback) { this.socket?.on('canvas-save-error', callback); }
  onCanvasDataResponse(callback) { this.socket?.on('canvas-data-response', callback); }
  onCanvasDataError(callback) { this.socket?.on('canvas-data-error', callback); }
  onUserCanvasesResponse(callback) { this.socket?.on('user-canvases-response', callback); }
  onUserCanvasesError(callback) { this.socket?.on('user-canvases-error', callback); }
  onCanvasDeleted(callback) { this.socket?.on('canvas-deleted', callback); }
  onCanvasDeleteError(callback) { this.socket?.on('canvas-delete-error', callback); }

  offCanvasSaved(callback) { this.socket?.off('canvas-saved', callback); }
  offCanvasSaveError(callback) { this.socket?.off('canvas-save-error', callback); }
  offCanvasDataResponse(callback) { this.socket?.off('canvas-data-response', callback); }
  offCanvasDataError(callback) { this.socket?.off('canvas-data-error', callback); }
  offUserCanvasesResponse(callback) { this.socket?.off('user-canvases-response', callback); }
  offUserCanvasesError(callback) { this.socket?.off('user-canvases-error', callback); }
  offCanvasDeleted(callback) { this.socket?.off('canvas-deleted', callback); }
  offCanvasDeleteError(callback) { this.socket?.off('canvas-delete-error', callback); }

  getConnectionStatus() {
    return {
      isConnected: !!(this.socket && this.socket.connected && this.isConnected),
      socketId: this.socket?.id || null,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

const websocketService = new WebSocketService();
export default websocketService;
