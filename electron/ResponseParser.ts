/**
 * ResponseParser.ts
 * Utility class to parse and extract structured data from AI responses
 */

export interface BasicSolutionData {
  code: string;
  thoughts: string[];
  time_complexity: string;
  space_complexity: string;
  dryRunVisualization?: string;
}

export interface DetailedSolutionData {
  problemStatement: string;
  bruteForceCode: string;
  bruteForceTimeComplexity: string;
  bruteForceSpaceComplexity: string;
  bruteForceComplexityRationale: string;
  bruteForceDryRunVisualization?: string;
  optimizationAnalysis: string[];
  optimizedCode: string;
  optimizedTimeComplexity: string;
  optimizedSpaceComplexity: string;
  optimizedComplexityRationale: string;
  optimizedDryRunVisualization?: string;
  rawBruteForceResponse?: string;
  rawOptimizedResponse?: string;
}

// Define the structure for the new four-quadrant response
export interface FourQuadrantData {
  problemUnderstanding: string;      // Markdown string
  bruteForceApproach: string;        // Markdown string
  optimalSolutionPseudocode: string; // Markdown string
  optimalSolutionImplementation: {   // Nested JSON object
    code: string;
    timeComplexity: string;
    spaceComplexity: string;
    thinkingProcess: string;         // Markdown string
  };
}

export class ResponseParser {
  /**
   * Parse a brute force solution response
   */
  public parseBruteForceResponse(responseContent: string): {
    code: string;
    timeComplexity: string;
    spaceComplexity: string;
    complexityRationale: string;
    dryRunVisualization?: string;
  } {
    // Extract code from the response
    const codeMatch = responseContent.match(/```(?:\w+)?\s*([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].trim() : responseContent;
    
    // Extract dry run & visualization
    const dryRunPattern = /(?:Dry Run|Visualization|Dry Run & Visualization|Trace|Walk-through):([\s\S]*?)(?=\n\s*(?:Time complexity|Space complexity|$))/i;
    let dryRunVisualization: string | undefined;
    const dryRunMatch = responseContent.match(dryRunPattern);
    if (dryRunMatch && dryRunMatch[1]) {
      dryRunVisualization = dryRunMatch[1].trim();
      console.log("Found dry run visualization in response:", dryRunVisualization.substring(0, 100) + "...");
    } else {
      // Try an alternative pattern approach
      const altPattern = /(?:step by step|walkthrough|example|trace|following the execution)[\s\S]*?(?=Time complexity|Space complexity|$)/i;
      const altMatch = responseContent.match(altPattern);
      if (altMatch && altMatch[0]) {
        dryRunVisualization = altMatch[0].trim();
        console.log("Found dry run visualization using alt pattern:", dryRunVisualization.substring(0, 100) + "...");
      } else {
        console.log("No dry run visualization found in response");
      }
    }
    
    // Extract complexity information
    const timeComplexityPattern = /Time complexity:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:Space complexity|$))/i;
    const spaceComplexityPattern = /Space complexity:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:[A-Z]|$))/i;
    
    // Default values
    let timeComplexity = "O(n)";
    let spaceComplexity = "O(n)";
    let complexityRationale = "Explanation not found in response";
    
    // Extract time complexity with explanation
    const timeMatch = responseContent.match(timeComplexityPattern);
    if (timeMatch && timeMatch[1]) {
      const fullTimeComplexity = timeMatch[1].trim();
      
      // Extract just the big-O notation
      const notationMatch = fullTimeComplexity.match(/O\([^)]+\)/i);
      if (notationMatch) {
        timeComplexity = notationMatch[0];
        
        // Remove the notation to get just the explanation
        const explanation = fullTimeComplexity.replace(notationMatch[0], '').trim();
        if (explanation) {
          // Remove any leading dash or colon and clean up
          complexityRationale = explanation.replace(/^[-:]\s*/, '').trim();
        }
      } else {
        timeComplexity = "O(n)"; // Default if we can't parse
        complexityRationale = fullTimeComplexity;
      }
    }
    
    // Extract space complexity
    const spaceMatch = responseContent.match(spaceComplexityPattern);
    if (spaceMatch && spaceMatch[1]) {
      const fullSpaceComplexity = spaceMatch[1].trim();
      
      // Extract just the big-O notation
      const notationMatch = fullSpaceComplexity.match(/O\([^)]+\)/i);
      if (notationMatch) {
        spaceComplexity = notationMatch[0];
        
        // If we don't have a rationale from time complexity, try to get one from space
        if (complexityRationale === "Explanation not found in response") {
          const explanation = fullSpaceComplexity.replace(notationMatch[0], '').trim();
          if (explanation) {
            complexityRationale = explanation.replace(/^[-:]\s*/, '').trim();
          }
        }
      }
    }
    
    return {
      code,
      timeComplexity,
      spaceComplexity,
      complexityRationale,
      dryRunVisualization
    };
  }

  /**
   * Parse an optimized solution response
   */
  public parseOptimizedResponse(responseContent: string): {
    optimizationAnalysis: string[];
    code: string;
    timeComplexity: string;
    spaceComplexity: string;
    complexityRationale: string;
    dryRunVisualization?: string;
  } {
    // Extract code
    const codeMatch = responseContent.match(/```(?:\w+)?\s*([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].trim() : "";
    
    // Extract optimization analysis
    const analysisRegex = /(?:Optimization Analysis|Improvements|How to Optimize):([\s\S]*?)(?=(?:Optimized Code|Optimal Solution|Time complexity|$))/i;
    const analysisMatch = responseContent.match(analysisRegex);
    
    let optimizationAnalysis: string[] = [];
    if (analysisMatch && analysisMatch[1]) {
      // Extract bullet points - use a different approach to capture full lines
      const analysisText = analysisMatch[1].trim();
      // Split by newlines first
      const lines = analysisText.split('\n');
      
      // Process each line
      for (const line of lines) {
        const trimmedLine = line.trim();
        // Only add non-empty lines that look like bullet points
        if (trimmedLine && trimmedLine.match(/^[-*•]|\d+\./)) {
          // Remove the bullet point marker
          const cleanedLine = trimmedLine.replace(/^[-*•]|\d+\./, '').trim();
          if (cleanedLine) {
            optimizationAnalysis.push(cleanedLine);
          }
        }
      }
      
      // If we didn't find any bullet points, try a different approach
      if (optimizationAnalysis.length === 0) {
        // Just use all non-empty lines
        optimizationAnalysis = lines
          .map(line => line.trim())
          .filter(Boolean);
      }
    }
    
    // Extract dry run & visualization
    const dryRunPattern = /(?:Dry Run|Visualization|Dry Run & Visualization|Trace|Walk-through):([\s\S]*?)(?=\n\s*(?:Time complexity|Space complexity|$))/i;
    let dryRunVisualization: string | undefined;
    const dryRunMatch = responseContent.match(dryRunPattern);
    if (dryRunMatch && dryRunMatch[1]) {
      dryRunVisualization = dryRunMatch[1].trim();
      console.log("Found optimized dry run visualization:", dryRunVisualization.substring(0, 100) + "...");
    } else {
      // Try an alternative pattern approach
      const altPattern = /(?:step by step|walkthrough|example|trace|following the execution)[\s\S]*?(?=Time complexity|Space complexity|$)/i;
      const altMatch = responseContent.match(altPattern);
      if (altMatch && altMatch[0]) {
        dryRunVisualization = altMatch[0].trim();
        console.log("Found optimized dry run using alt pattern:", dryRunVisualization.substring(0, 100) + "...");
      } else {
        console.log("No optimized dry run visualization found in response");
      }
    }
    
    // Extract complexity information
    const timeComplexityPattern = /Time complexity:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:Space complexity|$))/i;
    const spaceComplexityPattern = /Space complexity:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:[A-Z]|$))/i;
    
    // Default values
    let timeComplexity = "O(n)";
    let spaceComplexity = "O(n)";
    let complexityRationale = "Explanation not found in response";
    
    // Extract time complexity with explanation
    const timeMatch = responseContent.match(timeComplexityPattern);
    if (timeMatch && timeMatch[1]) {
      const fullTimeComplexity = timeMatch[1].trim();
      
      // Extract just the big-O notation
      const notationMatch = fullTimeComplexity.match(/O\([^)]+\)/i);
      if (notationMatch) {
        timeComplexity = notationMatch[0];
        
        // Remove the notation to get just the explanation
        const explanation = fullTimeComplexity.replace(notationMatch[0], '').trim();
        if (explanation) {
          // Remove any leading dash or colon and clean up
          complexityRationale = explanation.replace(/^[-:]\s*/, '').trim();
        }
      } else {
        timeComplexity = "O(n)"; // Default if we can't parse
        complexityRationale = fullTimeComplexity;
      }
    }
    
    // Extract space complexity
    const spaceMatch = responseContent.match(spaceComplexityPattern);
    if (spaceMatch && spaceMatch[1]) {
      const fullSpaceComplexity = spaceMatch[1].trim();
      
      // Extract just the big-O notation
      const notationMatch = fullSpaceComplexity.match(/O\([^)]+\)/i);
      if (notationMatch) {
        spaceComplexity = notationMatch[0];
        
        // If we don't have a rationale from time complexity, try to get one from space
        if (complexityRationale === "Explanation not found in response") {
          const explanation = fullSpaceComplexity.replace(notationMatch[0], '').trim();
          if (explanation) {
            complexityRationale = explanation.replace(/^[-:]\s*/, '').trim();
          }
        }
      }
    }
    
    return {
      optimizationAnalysis,
      code,
      timeComplexity,
      spaceComplexity,
      complexityRationale,
      dryRunVisualization
    };
  }

  /**
   * Parse a standard solution response that doesn't use the multi-step approach
   */
  public parseStandardSolutionResponse(responseContent: string): BasicSolutionData {
    // Extract code
    const codeMatch = responseContent.match(/```(?:\w+)?\s*([\s\S]*?)```/);
    const code = codeMatch ? codeMatch[1].trim() : responseContent;
    
    // Extract thoughts
    const thoughtsRegex = /(?:Thoughts:|Key Insights:|Reasoning:|Approach:)([\s\S]*?)(?:Time complexity:|$)/i;
    const thoughtsMatch = responseContent.match(thoughtsRegex);
    let thoughts: string[] = [];
    
    if (thoughtsMatch && thoughtsMatch[1]) {
      // Extract bullet points
      const bulletPoints = thoughtsMatch[1].match(/(?:^|\n)\s*(?:[-*•]|\d+\.)\s*(.*)/g);
      if (bulletPoints) {
        thoughts = bulletPoints.map(point => 
          point.replace(/^\s*(?:[-*•]|\d+\.)\s*/, '').trim()
        ).filter(Boolean);
      } else {
        // If no bullet points found, split by newlines and filter empty lines
        thoughts = thoughtsMatch[1].split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
      }
    }
    
    // Extract dry run & visualization
    const dryRunPattern = /(?:Dry Run|Visualization|Dry Run & Visualization|Trace|Walk-through):([\s\S]*?)(?=\n\s*(?:Time complexity|Space complexity|$))/i;
    let dryRunVisualization: string | undefined;
    const dryRunMatch = responseContent.match(dryRunPattern);
    if (dryRunMatch && dryRunMatch[1]) {
      dryRunVisualization = dryRunMatch[1].trim();
      console.log("Found standard dry run visualization:", dryRunVisualization.substring(0, 100) + "...");
    } else {
      // Try an alternative pattern approach
      const altPattern = /(?:step by step|walkthrough|example|trace|following the execution)[\s\S]*?(?=Time complexity|Space complexity|$)/i;
      const altMatch = responseContent.match(altPattern);
      if (altMatch && altMatch[0]) {
        dryRunVisualization = altMatch[0].trim();
        console.log("Found standard dry run using alt pattern:", dryRunVisualization.substring(0, 100) + "...");
      } else {
        console.log("No standard dry run visualization found in response");
      }
    }
    
    // Extract complexity information
    const timeComplexityPattern = /Time complexity:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:Space complexity|$))/i;
    const spaceComplexityPattern = /Space complexity:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:[A-Z]|$))/i;
    
    // Default values
    let timeComplexity = "O(n) - Linear time complexity because we only iterate through the array once. Each element is processed exactly one time, and the hashmap lookups are O(1) operations.";
    let spaceComplexity = "O(n) - Linear space complexity because we store elements in the hashmap. In the worst case, we might need to store all elements before finding the solution pair.";
    
    // Extract time complexity
    const timeMatch = responseContent.match(timeComplexityPattern);
    if (timeMatch && timeMatch[1]) {
      timeComplexity = timeMatch[1].trim();
      if (!timeComplexity.match(/O\([^)]+\)/i)) {
        timeComplexity = `O(n) - ${timeComplexity}`;
      } else if (!timeComplexity.includes('-') && !timeComplexity.includes('because')) {
        const notationMatch = timeComplexity.match(/O\([^)]+\)/i);
        if (notationMatch) {
          const notation = notationMatch[0];
          const rest = timeComplexity.replace(notation, '').trim();
          timeComplexity = `${notation} - ${rest}`;
        }
      }
    }
    
    // Extract space complexity
    const spaceMatch = responseContent.match(spaceComplexityPattern);
    if (spaceMatch && spaceMatch[1]) {
      spaceComplexity = spaceMatch[1].trim();
      if (!spaceComplexity.match(/O\([^)]+\)/i)) {
        spaceComplexity = `O(n) - ${spaceComplexity}`;
      } else if (!spaceComplexity.includes('-') && !spaceComplexity.includes('because')) {
        const notationMatch = spaceComplexity.match(/O\([^)]+\)/i);
        if (notationMatch) {
          const notation = notationMatch[0];
          const rest = spaceComplexity.replace(notation, '').trim();
          spaceComplexity = `${notation} - ${rest}`;
        }
      }
    }
    
    return {
      code,
      thoughts: thoughts.length > 0 ? thoughts : ["Solution approach based on efficiency and readability"],
      time_complexity: timeComplexity,
      space_complexity: spaceComplexity,
      dryRunVisualization
    };
  }

  /**
   * Parse debug response
   */
  public parseDebugResponse(debugContent: string): {
    code: string;
    debug_analysis: string;
    thoughts: string[];
  } {
    let extractedCode = "// Debug mode - see analysis below";
    const codeMatch = debugContent.match(/```(?:[a-zA-Z]+)?([\s\S]*?)```/);
    if (codeMatch && codeMatch[1]) {
      extractedCode = codeMatch[1].trim();
    }

    let formattedDebugContent = debugContent;
    
    if (!debugContent.includes('# ') && !debugContent.includes('## ')) {
      formattedDebugContent = debugContent
        .replace(/issues identified|problems found|bugs found/i, '## Issues Identified')
        .replace(/code improvements|improvements|suggested changes/i, '## Code Improvements')
        .replace(/optimizations|performance improvements/i, '## Optimizations')
        .replace(/explanation|detailed analysis/i, '## Explanation');
    }

    const bulletPoints = formattedDebugContent.match(/(?:^|\n)[ ]*(?:[-*•]|\d+\.)[ ]+([^\n]+)/g);
    const thoughts = bulletPoints 
      ? bulletPoints.map(point => point.replace(/^[ ]*(?:[-*•]|\d+\.)[ ]+/, '').trim()).slice(0, 5)
      : ["Debug analysis based on your screenshots"];
    
    return {
      code: extractedCode,
      debug_analysis: formattedDebugContent,
      thoughts
    };
  }

  /**
   * Parses the response assuming it's a JSON string conforming to the FourQuadrantData structure.
   */
  public parseFourQuadrantResponse(responseContent: string): FourQuadrantData {
    let parsedData: any;
    try {
      // Attempt to directly parse the JSON string
      // First, clean potential markdown fences ```json ... ``` if they sneak in
      const cleanedResponse = responseContent.replace(/^\s*```json\s*|\s*```\s*$/g, '').trim();
      parsedData = JSON.parse(cleanedResponse);
    } catch (error) {
      console.error("Failed to parse FourQuadrant JSON:", error);
      console.error("Raw response causing parse error:", responseContent.substring(0, 500)); // Log problematic response
      // Return a default structure with error messages if parsing fails
      return {
        problemUnderstanding: "Error: Failed to parse Problem Understanding from AI response.",
        bruteForceApproach: "Error: Failed to parse Brute Force Approach from AI response.",
        optimalSolutionPseudocode: "Error: Failed to parse Optimal Pseudocode from AI response.",
        optimalSolutionImplementation: {
          code: "// Error: Failed to parse Optimal Implementation code.",
          timeComplexity: "Error: Failed to parse complexity.",
          spaceComplexity: "Error: Failed to parse complexity.",
          thinkingProcess: "Error: Failed to parse thinking process."
        }
      };
    }

    // Validate the structure and provide defaults for missing fields
    const validatedData: FourQuadrantData = {
      problemUnderstanding: typeof parsedData.problemUnderstanding === 'string' ? parsedData.problemUnderstanding : "Missing: Problem Understanding.",
      bruteForceApproach: typeof parsedData.bruteForceApproach === 'string' ? parsedData.bruteForceApproach : "Missing: Brute Force Approach.",
      optimalSolutionPseudocode: typeof parsedData.optimalSolutionPseudocode === 'string' ? parsedData.optimalSolutionPseudocode : "Missing: Optimal Pseudocode.",
      optimalSolutionImplementation: {
        code: typeof parsedData.optimalSolutionImplementation?.code === 'string' ? parsedData.optimalSolutionImplementation.code : "// Missing: Optimal Implementation code.",
        timeComplexity: typeof parsedData.optimalSolutionImplementation?.timeComplexity === 'string' ? parsedData.optimalSolutionImplementation.timeComplexity : "Missing: Time Complexity.",
        spaceComplexity: typeof parsedData.optimalSolutionImplementation?.spaceComplexity === 'string' ? parsedData.optimalSolutionImplementation.spaceComplexity : "Missing: Space Complexity.",
        thinkingProcess: typeof parsedData.optimalSolutionImplementation?.thinkingProcess === 'string' ? parsedData.optimalSolutionImplementation.thinkingProcess : "Missing: Thinking Process."
      }
    };

    return validatedData;
  }
}

// Export a singleton instance
export const responseParser = new ResponseParser(); 