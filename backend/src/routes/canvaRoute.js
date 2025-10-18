import express from 'express';
import { canvaController } from '../controllers/canvaController.js';
import { verifyToken } from '../middleware/middleware.js';

const router = express.Router();

// Create a new canvas
router.post('/create', verifyToken, canvaController.createCanva);

// Get all canvases for authenticated user
router.get('/all', verifyToken, canvaController.getAllUserCanvas);

// Get specific canvas by ID
router.get('/:canvasId', verifyToken, canvaController.getUserCanvas);

// Update canvas data
router.put('/:canvasId', verifyToken, canvaController.updateCanvasData);

// Delete a canvas
router.delete('/:canvasId', verifyToken, canvaController.deleteCanvasData);

export default router;