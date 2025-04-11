/**
 * SolutionProcessor.ts
 * Handles the two-step solution generation process:
 * 1. Generate a brute force solution
 * 2. Optimize the solution
 */

import { aiService } from './AIService';
import { responseParser, DetailedSolutionData, BasicSolutionData } from './ResponseParser';
import { BrowserWindow } from 'electron';

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
        optimizationAnalysis: optimizedResult.optimizationAnalysis,
        optimizedCode: optimizedResult.code,
        optimizedTimeComplexity: optimizedResult.timeComplexity,
        optimizedSpaceComplexity: optimizedResult.spaceComplexity,
        optimizedComplexityRationale: optimizedResult.complexityRationale
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
    const promptText = `
I need you to create a straightforward brute force solution for this coding problem:

PROBLEM STATEMENT:
${problemInfo.problem_statement}

CONSTRAINTS:
${problemInfo.constraints || "No specific constraints provided."}

EXAMPLE INPUT:
${problemInfo.example_input || "No example input provided."}

EXAMPLE OUTPUT:
${problemInfo.example_output || "No example output provided."}

LANGUAGE: ${language}

Please provide:
1. A simple, non-optimized, but CORRECT brute force solution in ${language}.
2. Time complexity analysis with explanation.
3. Space complexity analysis with explanation.

Don't try to optimize this solution yet - I just need a clear, straightforward approach that solves the problem correctly, even if inefficiently.

Format your response with these headers:
- Brute Force Solution (with code block)
- Time complexity
- Space complexity

Make sure your time and space complexity analysis include explanations.
`;

    const systemPrompt = "You are an expert coding interview assistant. Your task is to create a correct but straightforward brute force solution for a coding problem.";
    
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
    const promptText = `
Now I'd like you to optimize the brute force solution for this problem:

PROBLEM STATEMENT:
${problemInfo.problem_statement}

BRUTE FORCE SOLUTION:
\`\`\`${language}
${bruteForceCode}
\`\`\`

BRUTE FORCE TIME COMPLEXITY: ${bruteForceTimeComplexity}
BRUTE FORCE SPACE COMPLEXITY: ${bruteForceSpaceComplexity}

Please create an optimized solution with the following sections:

1. Optimization Analysis: Explain specifically what inefficiencies exist in the brute force solution and how you'll improve them.

2. Optimized Code: Provide a complete, optimized solution in ${language}.

3. Complexity Analysis: Detail the time and space complexity of your optimized solution with thorough explanations of why they are better (if they are).

Format your response with clear headers for each section: "Optimization Analysis", "Optimized Code", "Time Complexity", and "Space Complexity".
`;

    const systemPrompt = "You are an expert coding interview assistant. Your task is to analyze a brute force solution and create an optimized version with clear explanations.";
    
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
      const promptText = `
Generate a detailed solution for the following coding problem:

PROBLEM STATEMENT:
${problemInfo.problem_statement}

CONSTRAINTS:
${problemInfo.constraints || "No specific constraints provided."}

EXAMPLE INPUT:
${problemInfo.example_input || "No example input provided."}

EXAMPLE OUTPUT:
${problemInfo.example_output || "No example output provided."}

LANGUAGE: ${language}

I need the response in the following format:
1. Code: A clean, optimized implementation in ${language}
2. Your Thoughts: A list of key insights and reasoning behind your approach
3. Time complexity: O(X) with a detailed explanation (at least 2 sentences)
4. Space complexity: O(X) with a detailed explanation (at least 2 sentences)

For complexity explanations, please be thorough. For example: "Time complexity: O(n) because we iterate through the array only once. This is optimal as we need to examine each element at least once to find the solution."

Your solution should be efficient, well-commented, and handle edge cases.
`;

      const systemPrompt = "You are an expert coding interview assistant. Provide clear, optimal solutions with detailed explanations.";
      
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