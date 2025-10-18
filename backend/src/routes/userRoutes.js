import express from 'express';
import { UserController } from '../controllers/userController.js';
import { verifyToken } from '../middleware/middleware.js';

const router = express.Router();

// Public routes
router.post('/', UserController.createUser);

// Protected routes
// router.get('/:id', verifyToken, UserController.getUserById);
router.get('/auth0/data', verifyToken, UserController.getUserByAuth0Id);
// router.get('/', verifyToken, UserController.getAllUsers);


export default router;
