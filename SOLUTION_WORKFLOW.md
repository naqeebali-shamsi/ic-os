# CodeInterviewAssist: Workflow Documentation

This document provides a comprehensive overview of the CodeInterviewAssist application's screenshot processing and solution generation workflow, detailing the complete process from screenshot capture to displaying optimized coding solutions.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Workflow Sequence](#workflow-sequence)
3. [Screenshot Processing](#screenshot-processing)
4. [Problem Extraction](#problem-extraction)
5. [Solution Generation Strategy](#solution-generation-strategy)
6. [Multi-Prompt Approach](#multi-prompt-approach)
7. [Response Parsing](#response-parsing)
8. [UI Rendering](#ui-rendering)
9. [Fallback Mechanisms](#fallback-mechanisms)
10. [Error Handling](#error-handling)

## Architecture Overview

The application uses a modular architecture with clear separation of concerns:

- **Main Process (Electron Backend)**
  - `AIService.ts` - Handles communication with AI providers (OpenAI, Gemini, Anthropic)
  - `ResponseParser.ts` - Processes and structures AI responses
  - `SolutionProcessor.ts` - Implements the multi-prompt solution generation strategy
  - `ProcessingHelper.ts` - Coordinates the workflow between components
  - `ConfigHelper.ts` - Manages user configuration and API keys
  - `ScreenshotHelper.ts` - Handles screenshot capture and management

- **Renderer Process (Frontend)**
  - `Solutions.tsx` - Displays the generated solutions and problem analysis
  - `App.tsx` - Provides app-wide state management and routing
  - Various components for UI elements and interactions

## Workflow Sequence

The complete workflow follows these steps:

1. User captures screenshots of a coding problem
2. Screenshots are processed and passed to AI for problem extraction
3. The extracted problem information is sent to the solution generation process
4. The multi-prompt strategy generates both brute force and optimized solutions
5. The responses are parsed and structured into a detailed solution format
6. The UI renders the complete solution with both approaches

## Screenshot Processing

The application uses the operating system's screenshot capabilities to capture coding problems:

```typescript
// From ProcessingHelper.ts
public async processScreenshots(): Promise<void> {
  // Check for valid AI client
  if (!aiService.hasValidClient()) {
    mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.API_KEY_INVALID);
    return;
  }

  // Get screenshots from queue
  const screenshotQueue = this.screenshotHelper.getScreenshotQueue();
  
  // Process valid screenshots
  const screenshots = await Promise.all(
    existingScreenshots.map(async (path) => ({
      path,
      preview: await this.screenshotHelper.getImagePreview(path),
      data: fs.readFileSync(path).toString('base64')
    }))
  );
}
```

## Problem Extraction

The application uses AI vision capabilities to extract the coding problem from screenshots:

```typescript
// Problem Extraction Prompt (from ProcessingHelper.ts)
const systemPrompt = "You are a coding challenge interpreter. Analyze the screenshot of the coding problem and extract all relevant information. Return the information in JSON format with these fields: problem_statement, constraints, example_input, example_output. Just return the structured JSON without any other text.";

const extractionPrompt = `Extract the coding problem details from these screenshots. Return in JSON format. Preferred coding language we gonna use for this problem is ${language}.`;

const responseText = await aiService.generateVisionCompletion(
  extractionPrompt,
  imageDataList,
  systemPrompt,
  undefined,
  signal
);
```

The extracted problem information is then structured as:

```typescript
interface ProblemInfo {
  problem_statement: string;
  constraints?: string;
  example_input?: string;
  example_output?: string;
}
```

## Solution Generation Strategy

The solution generation follows a two-phase approach defined in `SolutionProcessor.ts`:

1. **Phase 1**: Generate a brute force solution to the problem
2. **Phase 2**: Based on the brute force solution, generate an optimized solution

This two-phase strategy ensures:
- Complete understanding of the problem before optimization
- Clear traceability between the initial approach and optimized solution
- Explicit optimization steps and analysis
- Comprehensive complexity analysis for both approaches

## Multi-Prompt Approach

### Brute Force Generation

The first phase generates a human-like, naive solution with this refined prompt:

```typescript
// From SolutionProcessor.ts
const promptText = `
I want you to create a simple, naive, brute force solution for the following coding problem.

Start by explaining:
1. What would a beginner or average candidate think after reading this problem?
2. What would be the most direct, human-first attempt to solve it, without worrying about performance?

Then provide:
- The brute force solution code in ${language}.
- A brief explanation of why this is considered brute force (mention inefficiencies or redundant operations).
- Time Complexity: Big-O with 2-3 line explanation.
- Space Complexity: Big-O with 2-3 line explanation.

Rules:
- Do NOT optimize the code.
- Prefer clarity over performance.
- Use simple constructs like loops and if-else wherever possible.
- You may assume constraints are small enough to allow inefficient methods.

Format:
- Initial Thought Process
- Brute Force Solution (with code block)
- Why Brute Force
- Time Complexity
- Space Complexity

PROBLEM STATEMENT:
${problemInfo.problem_statement}

CONSTRAINTS:
${problemInfo.constraints || "No specific constraints provided."}

EXAMPLE INPUT:
${problemInfo.example_input || "No example input provided."}

EXAMPLE OUTPUT:
${problemInfo.example_output || "No example output provided."}

LANGUAGE: ${language}
`;

const systemPrompt = "You are an expert coding interview assistant. Your task is to create a correct but straightforward brute force solution for a coding problem that mirrors how a human would initially approach it.";
```

### Optimization Generation

The second phase takes the brute force solution and generates a thoughtfully optimized version:

```typescript
// From SolutionProcessor.ts
const promptText = `
Now let's move towards an optimized solution for this problem.

Start by analyzing the brute force solution:
1. What are the clear inefficiencies or limitations of the brute force code?
2. How do these inefficiencies affect the performance (time or space)?
3. What key observation or pattern helps us to remove these inefficiencies?

Then provide:
- Optimized Solution code in ${language}.
- Detailed optimization analysis (before the code) explaining your thought process.
- Time Complexity with reasoning (at least 2-3 lines).
- Space Complexity with reasoning (at least 2-3 lines).

Rules:
- Focus on algorithmic improvements or data structure changes.
- Prioritize clarity in code and explanation.
- Highlight trade-offs if any (e.g., Time vs. Space).

Format:
- Optimization Analysis
- Optimized Solution (with code block)
- Time Complexity
- Space Complexity

PROBLEM STATEMENT:
${problemInfo.problem_statement}

BRUTE FORCE SOLUTION:
\`\`\`${language}
${bruteForceCode}
\`\`\`

BRUTE FORCE TIME COMPLEXITY: ${bruteForceTimeComplexity}
BRUTE FORCE SPACE COMPLEXITY: ${bruteForceSpaceComplexity}
`;

const systemPrompt = "You are an expert coding interview assistant. Your task is to analyze a brute force solution and create an optimized version with clear explanations of your thought process and the improvements made.";
```

## Response Parsing

The application uses specialized parsers in `ResponseParser.ts` to extract structured data from AI responses:

### Brute Force Parser

```typescript
public parseBruteForceResponse(responseContent: string): {
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
  complexityRationale: string;
} {
  // Extract code from the response
  const codeMatch = responseContent.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : responseContent;
  
  // Extract complexity information
  const timeComplexityPattern = /Time complexity:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:Space complexity|$))/i;
  const spaceComplexityPattern = /Space complexity:?\s*([^\n]+(?:\n[^\n]+)*?)(?=\n\s*(?:[A-Z]|$))/i;
  
  // Process and return structured data
  // ...
}
```

### Optimized Solution Parser

```typescript
public parseOptimizedResponse(responseContent: string): {
  optimizationAnalysis: string[];
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
  complexityRationale: string;
} {
  // Extract code
  const codeMatch = responseContent.match(/```(?:\w+)?\s*([\s\S]*?)```/);
  const code = codeMatch ? codeMatch[1].trim() : "";
  
  // Extract optimization analysis
  const analysisRegex = /(?:Optimization Analysis|Improvements|How to Optimize):([\s\S]*?)(?=(?:Optimized Code|Optimal Solution|Time complexity|$))/i;
  const analysisMatch = responseContent.match(analysisRegex);
  
  // Process and extract structured data
  // ...
}
```

## UI Rendering

The UI renders both solutions in a clear, structured format in `Solutions.tsx`:

1. Problem statement extracted from the screenshot
2. Optimization thoughts and analysis
3. Brute force solution with complexity analysis (when available)
4. Optimized solution with complexity analysis

The UI detects whether it received a detailed solution (two-phase approach) or a basic solution (fallback mechanism) and adapts the rendering accordingly:

```typescript
// From Solutions.tsx
if ('bruteForceCode' in data && 'optimizedCode' in data) {
  // Using new detailed solution format
  setIsDetailedSolution(true);
  
  // Store brute force data
  setBruteForceCode(data.bruteForceCode || null);
  setBruteForceTimeComplexity(data.bruteForceTimeComplexity || null);
  setBruteForceSpaceComplexity(data.bruteForceSpaceComplexity || null);
  
  // Using optimized solution as the main solution
  const detailedSolution = {
    code: data.optimizedCode,
    thoughts: data.optimizationAnalysis || [],
    time_complexity: data.optimizedTimeComplexity,
    space_complexity: data.optimizedSpaceComplexity
  };

  // Update UI state
  // ...
} else {
  // Using the older basic solution format
  // ...
}
```

## Fallback Mechanisms

The application implements robust fallback mechanisms in case the multi-prompt approach fails. The fallback uses an improved prompt that focuses on educational value and clarity:

```typescript
// From SolutionProcessor.ts
private async generateStandardSolution(...): Promise<...> {
  const promptText = `
Generate a correct and clean solution for the following coding problem in ${language}.

Start by briefly explaining:
- What is the core challenge in this problem?
- What is your strategy to solve it? (Avoid calling it brute force or optimized — just focus on correctness.)

Then provide:
- Complete Solution code.
- Key Insights: Bullet points explaining why this approach works.
- Time Complexity with 2-3 line explanation.
- Space Complexity with 2-3 line explanation.

Rules:
- Write clean, production-level code.
- Focus on clarity and correctness.
- Avoid assumptions not given in the problem.

Format:
- Problem Understanding
- Solution (with code block)
- Key Insights
- Time Complexity
- Space Complexity

PROBLEM STATEMENT:
${problemInfo.problem_statement}

CONSTRAINTS:
${problemInfo.constraints || "No specific constraints provided."}

EXAMPLE INPUT:
${problemInfo.example_input || "No example input provided."}

EXAMPLE OUTPUT:
${problemInfo.example_output || "No example output provided."}
`;

  const systemPrompt = "You are an expert coding interview assistant. Provide clear, correct solutions with detailed explanations.";
  
  // Process and return results
  // ...
}
```

## Error Handling

The application implements comprehensive error handling throughout the workflow:

1. **API errors**: Handled with specific error messages
2. **Parsing errors**: Defaults to fallback mechanisms
3. **UI state management**: Maintains consistent state even after errors
4. **Request cancellation**: Gracefully handles user-initiated cancellations
5. **Timeout management**: Prevents indefinite waiting on AI responses

```typescript
// Example error handling in ProcessingHelper.ts
try {
  // Process screenshots
  // ...
} catch (error: unknown) {
  // If the request was cancelled, don't retry
  if (axios.isCancel(error)) {
    return {
      success: false,
      error: "Processing was canceled by the user."
    };
  }
  
  // Handle API errors with more specific messaging
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  console.error("API Error Details:", error);
  return { 
    success: false, 
    error: errorMessage || "Failed to process screenshots. Please try again." 
  };
}
```

## Conclusion

The multi-prompt solution generation strategy provides a comprehensive approach to coding problems, giving users not only the final optimized solution but also the journey from brute force to optimization. This approach helps users understand the thought process behind algorithmic improvements, making it an invaluable tool for interview preparation.

The modular architecture ensures maintainability and extensibility, allowing for future enhancements such as:

1. Additional AI providers
2. More specialized prompts for different problem types
3. Enhanced UI features for solution visualization
4. Integration with coding practice platforms

This documentation provides a thorough overview of the current implementation, serving as both a reference and a guide for future development. 