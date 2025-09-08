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

  async getCommits(repoUrl: string, limit: number = 20): Promise<GitHubCommit[]> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    
    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${owner}/${repo}/commits`,
        {
          headers: this.getHeaders(),
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
        `${this.baseUrl}/repos/${owner}/${repo}/deployments`,
        { 
          headers: this.getHeaders(),
          params: { per_page: 1 }
        }
      );
      
      if (response.data.length === 0) {
        return { status: 'no_deployments' };
      }

      const latestDeployment = response.data[0];
      const statusResponse = await axios.get(
        `${this.baseUrl}/repos/${owner}/${repo}/deployments/${latestDeployment.id}/statuses`,
        { headers: this.getHeaders() }
      );

      return {
        status: statusResponse.data[0]?.state || 'unknown',
        deployment: latestDeployment
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch deployment status: ${error.message}`);
    }
  }

  private parseGitHubUrl(url: string): { owner: string; repo: string } {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(?:\.git)?$/);
    if (!match) {
      throw new Error('Invalid GitHub URL format');
    }
    
    return {
      owner: match[1],
      repo: match[2].replace('.git', '')
    };
  }
}
