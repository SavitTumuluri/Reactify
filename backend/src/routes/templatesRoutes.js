import express from 'express';
import { templateController } from '../controllers/templatesControllers.js';

const router = express.Router();

// Public route - NO AUTH required
router.get('/', templateController.getAllTemplateCanvas);

export default router;