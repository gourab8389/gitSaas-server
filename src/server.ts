import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import userRoutes from './routes/users';

import { errorHandler, notFound } from './middleware/errorHandler';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100
});
app.use(limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);

app.get('/api', (req, res) => {
  res.json({
    name: 'Project Manager API',
    version: '1.0.0',
    description: 'API for managing projects with GitHub integration and CI/CD',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'GET /api/auth/github': 'GitHub OAuth',
        'GET /api/auth/profile': 'Get user profile'
      },
      projects: {
        'POST /api/projects': 'Create a new project',
        'GET /api/projects': 'Get user projects',
        'GET /api/projects/:id': 'Get project details',
        'PUT /api/projects/:id': 'Update project',
        'DELETE /api/projects/:id': 'Delete project',
        'POST /api/projects/:id/deploy': 'Deploy project',
        'GET /api/projects/:id/commits': 'Get project commits',
        'GET /api/projects/:id/analysis': 'Get AI analysis'
      },
      users: {
        'GET /api/users/dashboard': 'Get user dashboard',
        'PUT /api/users/profile': 'Update user profile'
      }
    }
  });
});

app.use(notFound);
app.use(errorHandler);

async function startServer() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;