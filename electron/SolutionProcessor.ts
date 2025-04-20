/**
 * SolutionProcessor.ts
 * Handles the two-step solution generation process:
 * 1. Generate a brute force solution
 * 2. Optimize the solution
 */

import { aiService } from './AIService';
import { responseParser, DetailedSolutionData, BasicSolutionData, FourQuadrantData } from './ResponseParser';
import { BrowserWindow } from 'electron';
import { getBruteForcePrompt, getOptimizedPrompt, getFallbackPrompt, getFourQuadrantPrompt } from '../prompts';

export class SolutionProcessor {
  /**
   * Generate solutions using the NEW single-prompt four-quadrant approach
   */
  public async generateSolutions(
    problemInfo: any, 
    language: string,
    mainWindow: BrowserWindow | null,
    signal: AbortSignal
  ): Promise<{ success: boolean, data?: FourQuadrantData | BasicSolutionData, error?: string }> {
    try {
      // Update progress status
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Generating comprehensive analysis...",
          progress: 50
        });
      }

      // Get the new four-quadrant prompt
      const { promptText, systemPrompt } = getFourQuadrantPrompt(language, problemInfo);

      // Call AI service with the new prompt
      const responseContent = await aiService.generateCompletion(promptText, systemPrompt, undefined, signal);

      // Update progress status
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Parsing analysis...",
          progress: 80
        });
      }
      
      // Parse the response using a NEW parser function (to be created in ResponseParser.ts)
      const parsedResult = responseParser.parseFourQuadrantResponse(responseContent);
      
      return { success: true, data: parsedResult };

    } catch (error) {
      console.error("Four-quadrant solution generation error:", error);
      
      // Fall back to the standard single-prompt approach if the new one fails
      try {
        console.log("Falling back to standard solution generation...");
        if (mainWindow) {
            mainWindow.webContents.send("processing-status", {
              message: "Falling back to standard generation...",
              progress: 60
            });
        }
        return await this.generateStandardSolution(problemInfo, language, signal);
      } catch (fallbackError) {
        console.error("Fallback solution generation error:", fallbackError);
        return { 
          success: false, 
          error: error instanceof Error ? error.message : "Failed to generate solution" 
        };
      }
    }
  }

  /**
   * Fallback to standard one-step solution generation
   */
  private async generateStandardSolution(
    problemInfo: any, 
    language: string,
    signal: AbortSignal
  ): Promise<{ success: boolean, data?: BasicSolutionData, error?: string }> {
    try {
      const { promptText, systemPrompt } = getFallbackPrompt(language, problemInfo);
      
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
            message: "Generating fallback solution...",
            progress: 70
        });
      }

      const responseContent = await aiService.generateCompletion(promptText, systemPrompt, undefined, signal);
      
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
            message: "Parsing fallback solution...",
            progress: 90
        });
      }
      
      // Assume parseStandardSolutionResponse exists and works for the fallback prompt format
      const parsedResponse = responseParser.parseStandardSolutionResponse(responseContent);
      
      return { success: true, data: parsedResponse };
    } catch (error) {
      console.error("Standard solution generation error:", error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Failed to generate standard solution" 
      };
    }
  }
}

// Export a singleton instance
export const solutionProcessor = new SolutionProcessor(); 