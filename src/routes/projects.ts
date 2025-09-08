import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  deployProject,
  getProjectCommits,
  getProjectAnalysis
} from '../controllers/projectController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/deploy', deployProject);
router.get('/:id/commits', getProjectCommits);
router.get('/:id/analysis', getProjectAnalysis);

export default router;
