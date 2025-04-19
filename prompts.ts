/**
 * This file contains the prompt templates for the solution generation process.
 * Each function returns a formatted prompt string based on the provided parameters.
 */

interface ProblemInfo {
  problem_statement: string;
  constraints?: string;
  example_input?: string;
  example_output?: string;
}

/**
 * Generates the brute force solution prompt
 */
export function getBruteForcePrompt(
  language: string,
  problemInfo: ProblemInfo
): { promptText: string; systemPrompt: string } {
  const promptText = `
I want you to create a simple, naive, brute force solution for the following coding problem.

Start by explaining:
1. What would a beginner or average candidate think after reading this problem?
2. What would be the most direct, human-first attempt to solve it, without worrying about performance?

Then provide:
- Brute Force Solution code in ${language}.
- Why this is considered brute force (mention inefficiencies or redundant operations).

IMPORTANT: Next, provide a detailed "Dry Run & Visualization" section:
- Walk through the code step-by-step on the example input
- Show how variables change at each step
- Use ASCII tables or lists to visualize the execution
- This section is critical and must be labeled "Dry Run & Visualization:"

Then provide:
- Time Complexity with 2-3 line reasoning.
- Space Complexity with 2-3 line reasoning.

Rules:
- Clarity > Performance.
- Simple constructs like loops / if-else are preferred.
- Constraints are small enough to allow inefficient methods.

Format:
- Initial Thought Process
- Brute Force Solution (code block)
- Why Brute Force
- Dry Run & Visualization (THIS SECTION IS REQUIRED)
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

  const systemPrompt = "You are an expert coding interview assistant. Your task is to create a correct but straightforward brute force solution for a coding problem that mirrors how a human would initially approach it. Always include a detailed dry run visualization of the solution's execution.";

  return { promptText, systemPrompt };
}

/**
 * Generates the optimized solution prompt using the brute force solution as input
 */
export function getOptimizedPrompt(
  language: string,
  problemInfo: ProblemInfo,
  bruteForceCode: string,
  bruteForceTimeComplexity: string,
  bruteForceSpaceComplexity: string
): { promptText: string; systemPrompt: string } {
  const promptText = `
Now let's move towards an optimized solution for this problem.

Start by analyzing the brute force solution:
1. What are the clear inefficiencies or limitations?
2. How do these inefficiencies affect performance?
3. What key observation or pattern helps us improve them?

Then provide:
- Optimized Solution code in ${language}.
- Optimization Analysis explaining the thought process.

IMPORTANT: Next, provide a detailed "Dry Run & Visualization" section:
- Walk through the optimized code step-by-step on the example input
- Show how variables and data structures change at each step
- Use ASCII tables or lists to visualize the execution
- Label this section clearly as "Dry Run & Visualization:"

Then provide:
- Time Complexity with reasoning.
- Space Complexity with reasoning.

Format:
- Optimization Analysis
- Optimized Solution (code block)
- Dry Run & Visualization (THIS SECTION IS REQUIRED)
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

  const systemPrompt = "You are an expert coding interview assistant. Your task is to analyze a brute force solution and create an optimized version with clear explanations of your thought process and the improvements made. Always include a detailed dry run visualization of the solution's execution.";

  return { promptText, systemPrompt };
}

/**
 * Generates the fallback solution prompt when the multi-prompt approach fails
 */
export function getFallbackPrompt(
  language: string,
  problemInfo: ProblemInfo
): { promptText: string; systemPrompt: string } {
  const promptText = `
Generate a correct and clean solution for the following coding problem in ${language}.

Start by briefly explaining:
- What is the core challenge in this problem?
- What is your strategy to solve it?

Then provide:
- Solution code.
- Key Insights: Bullet points on why this approach works.

IMPORTANT: Next, provide a detailed "Dry Run & Visualization" section:
- Trace the solution on the example input
- Show intermediate steps clearly
- Use ASCII tables or diagrams to visualize the execution
- Label this section clearly as "Dry Run & Visualization:"

Finally provide:
- Time Complexity with explanation.
- Space Complexity with explanation.

Format:
- Problem Understanding
- Solution (code block)
- Key Insights
- Dry Run & Visualization (THIS SECTION IS REQUIRED)
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

  const systemPrompt = "You are an expert coding interview assistant. Provide clear, correct solutions with detailed explanations and ALWAYS include a step-by-step visualization of how your solution executes on the example input.";

  return { promptText, systemPrompt };
} 