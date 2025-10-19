import express from 'express';
import { templateController } from '../controllers/templatesControllers.js';
import { verifyToken } from '../middleware/middleware.js';

const router = express.Router();

// Public route - NO AUTH required
router.get('/', templateController.getAllTemplateCanvas);
router.post('/:canvaId/copy', verifyToken, templateController.copyTemplateToCanvas);


export default router;