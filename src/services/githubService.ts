import axios from "axios";
import { GitHubCommit } from "@/types";

export class GithubService {
  private readonly baseUrl = "https://api.github.com";
  private readonly token: string;

  constructor() {
    this.token = process.env.GITHUB_TOKEN!;
  }

  private getHeaders() {
    return {
      Authorization: `token ${this.token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Project-Manager-API",
    };
  }

  async getRepositoryInfo(repoUrl: string) {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);

    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${owner}/${repo}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch repository info: ${error.message}`);
    }
  }

  async validateRepoAccess(
    repoUrl: string,
    userGithubToken: string
  ): Promise<boolean> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);

    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${owner}/${repo}`,
        {
          headers: {
            Authorization: `token ${userGithubToken}`,
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Project-Manager-API",
          },
        }
      );

      // If we can access the repo, user has permission
      return response.status === 200;
    } catch (error: any) {
      if (error.response?.status === 404 || error.response?.status === 403) {
        return false; // No access
      }
      throw error;
    }
  }

  async getCommits(repoUrl: string, userGithubToken: string, limit: number = 20): Promise<GitHubCommit[]> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${owner}/${repo}/commits`,
        { 
          headers: {
            'Authorization': `token ${userGithubToken}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Project-Manager-API'
          },
          params: { per_page: limit }
        }
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch commits: ${error.message}`);
    }
  }
  async getDeploymentStatus(repoUrl: string) {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);

    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${owner}/${repo}/commits`,
        { 
          headers: {
            'Authorization': `token ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Project-Manager-API'
          },
          params: { per_page: 10 }
        }
      );
      
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch commits: ${error.message}`);
    }
  }

  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?$/);
    if (!match) {
      throw new Error("Invalid GitHub URL format");
    }

    return {
      owner: match[1],
      repo: match[2].replace(".git", ""),
    };
  }
}
