/**
 * SolutionProcessor.ts
 * Handles the two-step solution generation process:
 * 1. Generate a brute force solution
 * 2. Optimize the solution
 */

import { aiService } from './AIService';
import { responseParser, DetailedSolutionData, BasicSolutionData } from './ResponseParser';
import { BrowserWindow } from 'electron';
import { getBruteForcePrompt, getOptimizedPrompt, getFallbackPrompt } from '../prompts';

export class SolutionProcessor {
  /**
   * Generate solutions using a multi-stage approach
   */
  public async generateSolutions(
    problemInfo: any, 
    language: string,
    mainWindow: BrowserWindow | null,
    signal: AbortSignal
  ): Promise<{ success: boolean, data?: DetailedSolutionData | BasicSolutionData, error?: string }> {
    try {
      // Update progress status
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Generating brute force solution...",
          progress: 40
        });
      }

      // Step 1: Generate a brute force solution
      const bruteForceResponse = await this.generateBruteForceResponse(problemInfo, language, signal);
      
      // Update progress
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Analyzing brute force solution for optimizations...",
          progress: 60
        });
      }
      
      // Step 2: Extract data from the brute force solution
      const bruteForceResult = responseParser.parseBruteForceResponse(bruteForceResponse);
      
      // Step 3: Generate an optimized solution based on the brute force solution
      const optimizedResponse = await this.generateOptimizedResponse(
        problemInfo, 
        language, 
        bruteForceResult.code,
        bruteForceResult.timeComplexity,
        bruteForceResult.spaceComplexity,
        signal
      );
      
      // Update progress
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Finalizing optimized solution...",
          progress: 80
        });
      }
      
      // Step 4: Extract data from the optimized solution
      const optimizedResult = responseParser.parseOptimizedResponse(optimizedResponse);
      
      // Step 5: Combine the results into a single structured response
      const combinedResult: DetailedSolutionData = {
        problemStatement: problemInfo.problem_statement,
        bruteForceCode: bruteForceResult.code,
        bruteForceTimeComplexity: bruteForceResult.timeComplexity,
        bruteForceSpaceComplexity: bruteForceResult.spaceComplexity,
        bruteForceComplexityRationale: bruteForceResult.complexityRationale,
        bruteForceDryRunVisualization: bruteForceResult.dryRunVisualization,
        optimizationAnalysis: optimizedResult.optimizationAnalysis,
        optimizedCode: optimizedResult.code,
        optimizedTimeComplexity: optimizedResult.timeComplexity,
        optimizedSpaceComplexity: optimizedResult.spaceComplexity,
        optimizedComplexityRationale: optimizedResult.complexityRationale,
        optimizedDryRunVisualization: optimizedResult.dryRunVisualization,
        // Include raw responses for direct display
        rawBruteForceResponse: bruteForceResponse,
        rawOptimizedResponse: optimizedResponse
      };
      
      return { success: true, data: combinedResult };
    } catch (error) {
      console.error("Solution generation error:", error);
      
      // Fall back to the standard single-prompt approach if multi-prompt fails
      try {
        console.log("Falling back to standard solution generation...");
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
   * Generate a brute force solution
   */
  private async generateBruteForceResponse(
    problemInfo: any, 
    language: string,
    signal: AbortSignal
  ): Promise<string> {
    const { promptText, systemPrompt } = getBruteForcePrompt(language, problemInfo);
    return await aiService.generateCompletion(promptText, systemPrompt, undefined, signal);
  }

  /**
   * Generate an optimized solution based on the brute force solution
   */
  private async generateOptimizedResponse(
    problemInfo: any, 
    language: string,
    bruteForceCode: string,
    bruteForceTimeComplexity: string,
    bruteForceSpaceComplexity: string,
    signal: AbortSignal
  ): Promise<string> {
    const { promptText, systemPrompt } = getOptimizedPrompt(
      language, 
      problemInfo, 
      bruteForceCode, 
      bruteForceTimeComplexity, 
      bruteForceSpaceComplexity
    );
    return await aiService.generateCompletion(promptText, systemPrompt, undefined, signal);
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
      
      const responseContent = await aiService.generateCompletion(promptText, systemPrompt, undefined, signal);
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