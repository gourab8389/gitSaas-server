export interface User {
  id: string;
  email: string;
  name: string;
  password?: string | null;
  githubId?: string | null;
  avatar?: string | null;
  githubToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  githubUrl: string;
  description?: string | null;
  status: 'PENDING' | 'BUILDING' | 'DEPLOYED' | 'FAILED';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Deployment {
  id: string;
  status: 'PENDING' | 'BUILDING' | 'SUCCESS' | 'FAILED';
  url?: string | null;
  logs?: string | null;
  error?: string | null;
  suggestion?: string | null;
  projectId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Commit {
  id: string;
  sha: string;
  message: string;
  author: string;
  date: Date;
  url: string;
  projectId: string;
  createdAt: Date;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

export interface DeploymentResult {
  success: boolean;
  url?: string;
  logs: string;
  error?: string;
}