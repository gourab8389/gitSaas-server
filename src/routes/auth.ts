import { Router } from 'express';
import { register, login, githubAuth, getProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/github', githubAuth);
router.get('/profile', authenticateToken, getProfile);

export default router;