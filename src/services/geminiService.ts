import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is required");
    }

    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  async getSuggestion(
    error: string,
    logs: string,
    projectInfo?: any
  ): Promise<string> {
    try {
      const prompt = this.buildPrompt(error, logs, projectInfo);

      const result = await this.model.generateContent(prompt);
      const response = await result.response;

      return response.text();
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return "Unable to generate suggestions at this time. Please check your deployment logs manually.";
    }
  }

  async analyzeCode(repoUrl: string, commits: any[]): Promise<string> {
    try {
      const prompt = `
        Analyze this repository and recent commits for potential deployment issues:

        Repository: ${repoUrl}

        Recent commits:
        ${commits.map((commit) => `- ${commit.message} (${commit.author})`).join("\n")}

        Provide insights on:
        1. Potential deployment issues
        2. Code quality concerns
        3. Best practices recommendations
        4. Suggested improvements

        Keep the response concise and actionable.
        `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;

      return response.text();
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      return "Unable to analyze code at this time.";
    }
  }

  private buildPrompt(error: string, logs: string, projectInfo?: any): string {
    return `
        You are a DevOps expert helping to troubleshoot deployment issues.
        
        Deployment Error:
        ${error}
        
        Deployment Logs:
        ${logs}
        
        ${
          projectInfo
            ? `Project Info: ${JSON.stringify(projectInfo, null, 2)}`
            : ""
        }
        
        Please provide:
        1. Root cause analysis
        2. Step-by-step solution
        3. Prevention strategies
        4. Best practices recommendations
        
        Format your response in clear, actionable steps.
        `;
  }
}
