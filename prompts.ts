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
 * Generates the brute force solution prompt - MODIFIED FOR JSON
 */
export function getBruteForcePrompt(
  language: string,
  problemInfo: ProblemInfo
): { promptText: string; systemPrompt: string } {
  const promptText = `
Analyze the following coding problem and provide a brute force solution analysis in JSON format.

Problem Information:
\`\`\`json
${JSON.stringify(problemInfo, null, 2)}
\`\`\`

Task: Structure your JSON response with the following keys:
- \`thoughtProcess\`: Explain the beginner's thinking and the direct approach.
- \`bruteForceCode\`: String containing the brute force solution code in ${language}.
- \`whyBruteForce\`: Explain the inefficiencies.
- \`dryRunVisualization\`: Markdown string showing a step-by-step dry run on the example input, visualizing variable changes.
- \`timeComplexity\`: String for Time Complexity (Big O) with 2-3 line reasoning.
- \`spaceComplexity\`: String for Space Complexity (Big O) with 2-3 line reasoning.

Rules:
- Focus on clarity and a direct, understandable approach.
- The Dry Run section is crucial.
- Ensure the output is a single, valid JSON object. Do not include markdown markers like \`\`\`json.

LANGUAGE: ${language}
`;

  const systemPrompt = "You are an expert coding interview assistant. Your task is to create a brute force solution analysis for a coding problem, formatted strictly as JSON. Always include a detailed dry run visualization.";

  return { promptText, systemPrompt };
}

/**
 * Generates the optimized solution prompt using the brute force solution as input - MODIFIED FOR JSON
 */
export function getOptimizedPrompt(
  language: string,
  problemInfo: ProblemInfo,
  bruteForceCode: string,
  bruteForceTimeComplexity: string,
  bruteForceSpaceComplexity: string
): { promptText: string; systemPrompt: string } {
  const promptText = `
Analyze the provided brute force solution and generate an optimized solution analysis in JSON format.

Problem Statement:
${problemInfo.problem_statement}

Brute Force Solution (${language}):
\`\`\`${language}
${bruteForceCode}
\`\`\`
Brute Force Time Complexity: ${bruteForceTimeComplexity}
Brute Force Space Complexity: ${bruteForceSpaceComplexity}

Task: Structure your JSON response with the following keys:
- \`optimizationAnalysis\`: Markdown string analyzing brute force limitations and the key optimization insight.
- \`optimizedCode\`: String containing the optimized solution code in ${language}.
- \`dryRunVisualization\`: Markdown string showing a step-by-step dry run of the *optimized* code on the example input, visualizing variable/data structure changes.
- \`timeComplexity\`: String for the optimized Time Complexity (Big O) with reasoning.
- \`spaceComplexity\`: String for the optimized Space Complexity (Big O) with reasoning.

Rules:
- Explain the optimization clearly.
- The Dry Run section for the optimized code is crucial.
- Ensure the output is a single, valid JSON object. Do not include markdown markers like \`\`\`json.

LANGUAGE: ${language}
`;

  const systemPrompt = "You are an expert coding interview assistant. Your task is to analyze a brute force solution, create an optimized version, and provide the analysis strictly as JSON. Always include a detailed dry run visualization for the optimized solution.";

  return { promptText, systemPrompt };
}

/**
 * Generates the NEW four-quadrant solution prompt in JSON format.
 * This will be the primary prompt used for the desired UI.
 */
export function getFourQuadrantPrompt(
  language: string,
  problemInfo: ProblemInfo
): { promptText: string; systemPrompt: string } {

  const userPrompt = `
Problem Information:
\`\`\`json
${JSON.stringify(problemInfo, null, 2)}
\`\`\`

Task: Analyze the problem thoroughly and provide a comprehensive solution analysis in ${language}. Structure your response strictly as a single JSON object with the following FOUR top-level keys. The value for each key should be a markdown-formatted string, except for 'optimalSolutionImplementation' which should be a nested JSON object.

1.  \`problemUnderstanding\`: (Markdown String)
    *   **Problem Restatement:** Briefly rephrase the problem in your own words.
    *   **Key Constraints & Edge Cases:** List significant constraints (input size, value ranges) and potential edge cases (empty input, duplicates, etc.) **explicitly mentioned in the problem info.**
    *   **Assumptions:** State any assumptions you're making **only if the problem info is truly ambiguous after considering constraints.**
    *   **Clarifying Questions:** **CRITICAL: Analyze the provided problem info, especially constraints, very carefully.** Do NOT ask questions if the answer is already stated or can be directly inferred (e.g., regarding character sets if specified, case sensitivity if 'lowercase' is mentioned, uniqueness if 'unique' is mentioned, empty inputs if length constraints start > 0). Do NOT ask about performance requirements or time/space complexity expectations. Ask 1-2 questions **only** if essential information is genuinely missing and cannot be inferred.

2.  \`bruteForceApproach\`: (Markdown String)
    *   **Description:** Describe a straightforward, brute-force algorithm.
    *   **Complexity Analysis:** Provide Time Complexity (Big O) and Space Complexity (Big O) with brief justifications.
    *   **Pattern/Bottleneck:** Identify the core inefficiency (e.g., nested loops, redundant calculations).
    *   **Optimization Ideas:** Suggest data structures (hash maps, heaps, tries) or algorithmic techniques (sorting, two pointers, dynamic programming, sliding window) that could lead to improvement.

3.  \`optimalSolutionPseudocode\`: (Markdown String)
    *   \`Pseudocode\`: Provide clear, concise, language-agnostic pseudocode for the optimal solution. Use standard conventions (e.g., indentation, keywords like IF/ELSE, FOR, WHILE, RETURN).
    *   \`Logic Explanation\`: Briefly explain the core logic behind each major step or block in the pseudocode.

4.  \`optimalSolutionImplementation\`: (Nested JSON Object)
    *   \`code\`: (String) The complete, runnable, **well-commented** optimal code solution in ${language}. **Crucially, add comments within the code explaining the thought process for each significant step, decision, or choice of data structure/algorithm. Make it sound like a candidate explaining their work line-by-line.**
    *   \`timeComplexity\`: (String) Detailed analysis of the final time complexity (Big O).
    *   \`spaceComplexity\`: (String) Detailed analysis of the final space complexity (Big O).
    *   \`thinkingProcess\`: (Markdown String) Simulate a candidate's thought process **"thinking out loud"**. Describe the step-by-step reasoning to arrive at the optimal solution. Start from the brute-force idea or initial thoughts. Discuss potential approaches (e.g., using a hash map, sorting, two pointers, DP), analyze their trade-offs (time vs. space), and explain why the chosen optimal approach is selected. Explicitly mention how constraints and edge cases identified earlier are handled. **If applicable, include a simple text-based visualization (like ASCII diagrams or step-by-step variable/data structure traces) to illustrate the core mechanism of the algorithm.**

Constraint Checklist & Confidence Score: (Include this exact section at the end of the 'thinkingProcess' markdown string)
- Are there any loops? Yes/No
- Are there any recursive calls? Yes/No
- Are there any constraints on the input size? Yes/No
- Are there any constraints on the input values? Yes/No
- Are there any time or space complexity constraints? Yes/No
- Confidence Score (1-5): [Score]

Final JSON Structure Example:
\`\`\`json
{
  "problemUnderstanding": "...",
  "bruteForceApproach": "...",
  "optimalSolutionPseudocode": "...",
  "optimalSolutionImplementation": {
    "code": "...",
    "timeComplexity": "...",
    "spaceComplexity": "...",
    "thinkingProcess": "...\\nConstraint Checklist & Confidence Score:\\n- Loops: Yes\\n- Recursive: No\\n..."
  }
}
\`\`\`

LANGUAGE: ${language}

Ensure the entire output is a single valid JSON object starting with { and ending with }. Do not include the example JSON structure or any other text outside the main JSON object.
`;

  const systemPrompt = `You are an expert coding interview coach. Analyze the provided problem information and generate a comprehensive, four-part solution analysis formatted strictly as a JSON object. Adhere precisely to the requested JSON structure and content guidelines for each section.`;

  return { promptText: userPrompt, systemPrompt };
}

/**
 * Generates the fallback solution prompt when the multi-prompt approach fails - MODIFIED FOR JSON
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