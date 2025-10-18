import { useWebSocket } from './useWebSocket';

export class CanvasService {
  constructor() {
    this.currentCanvasId = null;
    this.currentUserId = null;
    this.currentCanvasName = null;
  }

  // Set current user and canvas
  setCurrentUser(userId) {
    this.currentUserId = userId;
  }

  setCurrentCanvas(canvasId, canvasName = null) {
    this.currentCanvasId = canvasId;
    this.currentCanvasName = canvasName;
  }

  // Generate a unique canvas ID
  generateCanvasId() {
    return `canvas-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get current canvas ID
  getCurrentCanvasId() {
    return this.currentCanvasId;
  }

  // Get current user ID
  getCurrentUserId() {
    return this.currentUserId;
  }

  // Get current canvas name
  getCurrentCanvasName() {
    return this.currentCanvasName;
  }
}

// Create a singleton instance
const canvasService = new CanvasService();

export default canvasService;
