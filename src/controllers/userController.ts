import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getDashboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;

    const [user, projectStats, recentProjects, recentDeployments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          createdAt: true
        }
      }),
      prisma.project.groupBy({
        by: ['status'],
        where: { userId },
        _count: {
          status: true
        }
      }),
      prisma.project.findMany({
        where: { userId },
        include: {
          deployments: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      }),
      prisma.deployment.findMany({
        where: {
          project: { userId }
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Process stats
    const stats = {
      total: 0,
      deployed: 0,
      building: 0,
      failed: 0,
      pending: 0
    };

    projectStats.forEach(stat => {
      stats.total += stat._count.status;
      stats[stat.status.toLowerCase() as keyof typeof stats] = stat._count.status;
    });

    res.json({
      user,
      stats,
      recentProjects,
      recentDeployments
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { name, avatar } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(avatar && { avatar }),
        updatedAt: new Date()
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};