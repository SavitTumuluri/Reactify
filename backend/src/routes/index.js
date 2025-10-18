import express from 'express';
import userRoutes from './userRoutes.js';
import canvaRoutes from './canvaRoute.js';
import templatesRoutes from './templatesRoutes.js'

const router = express.Router();
router.get('/', (_req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// API routes
router.use('/users', userRoutes);
router.use('/canvas', canvaRoutes);
router.use('/templates', templatesRoutes);


export default router;
