import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { validateRequest, projectSchema } from "../utils/validation";
import { GeminiService } from "../services/geminiService";
import { DeploymentService } from "../services/deploymentService";
import { AuthRequest } from "../middleware/auth";
import { Commit } from "../types";
import { GithubService } from "../services/githubService";

const prisma = new PrismaClient();
const githubService = new GithubService();
const geminiService = new GeminiService();
const deploymentService = new DeploymentService();

export const createProject = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = validateRequest(projectSchema, req.body);
    const { name, githubUrl, description } = validatedData;
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.githubToken) {
      return res.status(400).json({ 
        error: 'GitHub authentication required. Please login with GitHub.' 
      });
    }

    // Validate user has access to repository
    const hasAccess = await githubService.validateRepoAccess(githubUrl, user.githubToken);
    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'You do not have access to this repository or it does not exist.' 
      });
    }

    // Validate GitHub URL and fetch repository info
    let repoInfo;
    try {
      repoInfo = await githubService.getRepositoryInfo(githubUrl);
    } catch (error: any) {
      return res
        .status(400)
        .json({ error: `Invalid GitHub repository: ${error.message}` });
    }

    // Create project
    const project = await prisma.project.create({
      data: {
        name,
        githubUrl,
        description: description || repoInfo.description,
        userId,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Fetch and store commits
    try {
      const commits = await githubService.getCommits(githubUrl, user.githubToken);

      await prisma.commit.createMany({
        data: commits.map((commit: any) => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author.name,
          date: new Date(commit.commit.author.date),
          url: commit.html_url,
          projectId: project.id,
        })),
      });
    } catch (error) {
      console.error("Error fetching commits:", error);
    }

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getProjects = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: { userId },
        include: {
          deployments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          commits: {
            orderBy: { date: "desc" },
            take: 5,
          },
          _count: {
            select: {
              deployments: true,
              commits: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.project.count({ where: { userId } }),
    ]);

    res.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        deployments: {
          orderBy: { createdAt: "desc" },
        },
        commits: {
          orderBy: { date: "desc" },
          take: 20,
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Get latest deployment status from GitHub
    try {
      const deploymentStatus = await githubService.getDeploymentStatus(
        project.githubUrl
      );
      
      // Only add GitHub deployment if it exists and has valid data
      if (deploymentStatus && deploymentStatus.status !== 'no_deployments') {
        const githubDeployment = {
          id: `github-${deploymentStatus.deployment?.id || 'unknown'}`,
          status: deploymentStatus.status.toUpperCase(),
          createdAt: new Date(deploymentStatus.deployment?.created_at || new Date()),
          updatedAt: new Date(deploymentStatus.deployment?.updated_at || new Date()),
          projectId: project.id,
          url: deploymentStatus.deployment?.payload?.web_url || null,
          logs: null,
          error: null,
          suggestion: null,
          isFromGitHub: true,
        };
        
        project.deployments.unshift(githubDeployment as any);
      }
    } catch (error) {
      console.error("Error fetching GitHub deployment status:", error);
    }

    res.json({ project });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, description } = req.body;

    const project = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        updatedAt: new Date(),
      },
      include: {
        deployments: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    res.json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    await prisma.project.delete({
      where: { id },
    });

    res.json({ message: "Project deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deployProject = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findFirst({
      where: { id, userId },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Update project status to BUILDING
    await prisma.project.update({
      where: { id },
      data: { status: "BUILDING" },
    });

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        projectId: id,
        status: "BUILDING",
      },
    });

    // Start deployment process (async)
    deploymentService
      .deployProject(project.githubUrl, project.name)
      .then(async (result) => {
        const status = result.success ? "SUCCESS" : "FAILED";
        const projectStatus = result.success ? "DEPLOYED" : "FAILED";

        // Get AI suggestion if deployment failed
        let suggestion = "";
        if (!result.success && result.error) {
          try {
            suggestion = await geminiService.getSuggestion(
              result.error,
              result.logs,
              project
            );
          } catch (error) {
            console.error("Error getting AI suggestion:", error);
          }
        }

        // Update deployment and project
        await Promise.all([
          prisma.deployment.update({
            where: { id: deployment.id },
            data: {
              status,
              url: result.url,
              logs: result.logs,
              error: result.error,
              suggestion,
            },
          }),
          prisma.project.update({
            where: { id },
            data: { status: projectStatus },
          }),
        ]);
      })
      .catch(async (error) => {
        console.error("Deployment error:", error);

        await Promise.all([
          prisma.deployment.update({
            where: { id: deployment.id },
            data: {
              status: "FAILED",
              error: error.message,
              logs: `Deployment failed: ${error.message}`,
            },
          }),
          prisma.project.update({
            where: { id },
            data: { status: "FAILED" },
          }),
        ]);
      });

    res.json({
      message: "Deployment started",
      deployment: {
        id: deployment.id,
        status: deployment.status,
        createdAt: deployment.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjectCommits = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const project = await prisma.project.findFirst({
      where: { id, userId },
    });
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    // Fetch latest commits from GitHub and update database
    try {
      const freshCommits = await githubService.getCommits(
        project.githubUrl,
        req.user.githubToken || ""
      );
      
      // Delete existing commits for this project
      await prisma.commit.deleteMany({ where: { projectId: id } });
      
      // Create new commits with all required fields
      await prisma.commit.createMany({
        data: freshCommits.map((commit) => ({
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author.name,
          date: new Date(commit.commit.author.date),
          url: commit.html_url,
          projectId: id,
        })),
      });
    } catch (error) {
      console.error("Error fetching fresh commits:", error);
    }

    // Get commits from database
    const commits = await prisma.commit.findMany({
      where: { projectId: id },
      orderBy: { date: "desc" },
      take: 20,
    });

    res.json({ commits });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjectAnalysis = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        commits: {
          orderBy: { date: "desc" },
          take: 10,
        },
      },
    });

    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }

    // Get AI analysis
    const analysis = await geminiService.analyzeCode(
      project.githubUrl,
      project.commits
    );

    res.json({
      project: {
        id: project.id,
        name: project.name,
        githubUrl: project.githubUrl,
      },
      analysis,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};