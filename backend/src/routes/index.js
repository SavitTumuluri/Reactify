import express from 'express';
import userRoutes from './userRoutes.js';
import bedrockRoutes from './bedrockRoutes.js';
import aiRoutes from './aiRoutes.js';
import s3Routes from './s3Routes.js';
import agentRoutes from './agentRoutes.js';
import canvaRoutes from './canvaRoute.js';
import templatesRoutes from './templatesRoutes.js';

const router = express.Router();

// Basic health check routes
router.get('/', (_req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// API routes
router.use('/users', userRoutes);
router.use('/', bedrockRoutes); // exposes POST /api/generate-component
router.use('/', aiRoutes); // exposes /api/ai/*
router.use('/', agentRoutes); // exposes /api/ai/agent/plan
router.use('/', s3Routes); // exposes /api/s3/*
router.use('/canvas', canvaRoutes);
router.use('/templates', templatesRoutes);


export default router;