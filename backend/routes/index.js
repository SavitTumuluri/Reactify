import express from 'express';

const router = express.Router();

// Basic health check routes
router.get('/', (_req, res) => {
  res.json({ message: 'Backend server is running!' });
});

export default router;
