import { Router } from 'express';
import { register, login, githubAuth, getProfile, githubCallback } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/github', githubAuth);
router.get('/github/callback', githubCallback); 
router.get('/profile', authenticateToken, getProfile);

export default router;