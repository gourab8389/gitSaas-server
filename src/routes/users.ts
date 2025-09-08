import { Router } from 'express';
import { getDashboard, updateProfile } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/dashboard', getDashboard);
router.put('/profile', updateProfile);

export default router;