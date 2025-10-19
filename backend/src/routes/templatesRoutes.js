import express from 'express';
import { templateController } from '../controllers/templatesControllers.js';
import { verifyToken } from '../middleware/middleware.js';

const router = express.Router();

// Public route - NO AUTH required
router.get('/', templateController.getAllTemplateCanvas);
router.post('/:canvaId/copy', verifyToken, templateController.copyTemplateToCanvas);
router.post('/:canvaId/like', templateController.likeTemplate);


export default router;