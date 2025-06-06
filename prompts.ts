/**
 * This file contains the prompt templates for the solution generation process.
 * Each function returns a formatted prompt string based on the provided parameters.
 */

// Import the shared definition
import { ProblemInfo } from './electron/main'; // Adjust path if necessary
import { ProblemExample } from './electron/ResponseParser'; // Import if needed

/**
 * Generates the brute force solution prompt - MODIFIED FOR JSON
 */
export function getBruteForcePrompt(
  language: string,
  problemInfo: ProblemInfo | null // Allow null
): { promptText: string; systemPrompt: string } {
  const promptText = `
Analyze the following coding problem and provide a brute force solution analysis in JSON format.

Problem Information:
\`\`\`json
${JSON.stringify(problemInfo || {}, null, 2)} // Handle potential null
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
  problemInfo: ProblemInfo | null, // Allow null
  bruteForceCode: string,
  bruteForceTimeComplexity: string,
  bruteForceSpaceComplexity: string
): { promptText: string; systemPrompt: string } {
  const promptText = `
Analyze the provided brute force solution and generate an optimized solution analysis in JSON format.

Problem Statement:
${problemInfo?.problem_statement || 'Problem statement not provided.'} // Handle optional/null

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
 * Generates the NEW **Initial Problem Understanding & Example Generation** prompt.
 * Checks for existing examples; otherwise, generates understanding, examples, and questions.
 * Returns JSON: ProblemUnderstandingData | { examplesPresent: true }
 */
export function getProblemUnderstandingPrompt(
  problemInfo: ProblemInfo | null // Allow null
): { promptText: string; systemPrompt: string } {

  const userPrompt = `
Task: Analyze the provided coding problem information. First, determine if sufficient illustrative examples (input/output pairs) are already present in the \`problemInfo\`. 

Problem Information:
\`\`\`json
${JSON.stringify(problemInfo || {}, null, 2)} // Handle potential null
\`\`\`

Analysis & Response Structure:

1.  **Check for Existing Examples:** Carefully examine the \`problemInfo.example_input\` and \`problemInfo.example_output\`. 
    *   If clear input/output examples **ARE PRESENT**, respond *only* with the following JSON object:
        \`\`\`json
        { "examplesPresent": true }
        \`\`\`
    *   If clear input/output examples **ARE NOT PRESENT** or are insufficient/ambiguous, proceed to step 2.

2.  **Generate Understanding & Examples (if no sufficient examples found):** Create a JSON object conforming to the \`ProblemUnderstandingData\` structure:
    *   \`understandingStatement\`: (String) Briefly restate the problem's core objective and requirements in your own words.
    *   \`generatedExamples\`: (Array of Objects) Generate 1-2 clear and distinct examples, each with:
        *   \`input\`: (String) A description of the example input.
        *   \`output\`: (String) The corresponding expected output.
        *   \`explanation\`: (String - Optional) A brief explanation of why the output corresponds to the input for that example.
    *   \`clarifyingQuestions\`: (Array of Strings) Ask 1-2 clarifying questions ONLY if absolutely necessary to resolve critical ambiguities *after* generating examples. Do not ask about constraints already stated or performance requirements.

Example \`ProblemUnderstandingData\` JSON (if examples need generation):
\`\`\`json
{
  "understandingStatement": "The goal is to find the minimum path sum from the top to the bottom of a triangle array, moving to adjacent numbers on the row below.",
  "generatedExamples": [
    {
      "input": "triangle = [[2],[3,4],[6,5,7],[4,1,8,3]]",
      "output": "11",
      "explanation": "Path: 2 -> 3 -> 5 -> 1 = 11"
    },
    {
      "input": "triangle = [[-10]]",
      "output": "-10"
    }
  ],
  "clarifyingQuestions": [] 
}
\`\`\`

Final Output Rules:
- Respond ONLY with a single, valid JSON object.
- If examples were present in the input, the JSON should be exactly { "examplesPresent": true }
- If examples were generated, the JSON must match the \`ProblemUnderstandingData\` structure shown.
- Do not include any introductory text, explanations outside the JSON, or markdown code fences (\`\`\`).
`;

  const systemPrompt = `You are an AI assistant analyzing coding problems. First, determine if the provided problem info already contains sufficient examples. If yes, respond with { "examplesPresent": true }. If not, generate your understanding of the problem, create 1-2 illustrative examples (input/output/explanation), and ask clarifying questions only if essential. Respond strictly with the specified JSON format ({ examplesPresent: true } OR ProblemUnderstandingData).`;

  return { promptText: userPrompt, systemPrompt };
}

/**
 * NEW: Generates the prompt for refining understanding based on user clarification.
 * Returns JSON: ProblemUnderstandingData
 */
export function getRefinedUnderstandingPrompt(
  problemInfo: ProblemInfo | null, // Allow null
  previousUnderstanding: string, // Previous AI understanding
  previousExamples: ProblemExample[], // Use imported type
  previousQuestions: string[], // Previous questions asked by AI
  userClarification: string // User's feedback/clarification
): { promptText: string; systemPrompt: string } {

  const userPrompt = `
Task: Refine the understanding and examples for the coding problem based on the user's clarification.

Original Problem Information:
\`\`\`json
${JSON.stringify(problemInfo || {}, null, 2)} // Handle potential null
\`\`\`

Previous AI Understanding:
${previousUnderstanding}

Previously Generated Examples:
${JSON.stringify(previousExamples, null, 2)}

Previously Asked Questions:
${previousQuestions.join('\n') || 'None'}

User Clarification/Feedback:
${userClarification}

Instructions:
1.  Carefully consider the user's clarification.
2.  Generate an updated JSON object conforming to the \`ProblemUnderstandingData\` structure:
    *   \`understandingStatement\`: (String) Provide a **revised** statement reflecting the clarified understanding.
    *   \`generatedExamples\`: (Array of Objects) Provide **revised or new** examples (1-2) that accurately reflect the clarified understanding. Ensure they align with the user's feedback.
    *   \`clarifyingQuestions\`: (Array of Strings) Ask further questions ONLY if the user's clarification introduced new ambiguity. Usually, this should be empty after clarification.

Example \`ProblemUnderstandingData\` JSON Output:
\`\`\`json
{
  "understandingStatement": "(Revised statement based on clarification)",
  "generatedExamples": [
    { "input": "(Revised/New Example 1 Input)", "output": "...", "explanation": "..." },
    { "input": "(Revised/New Example 2 Input)", "output": "...", "explanation": "..." }
  ],
  "clarifyingQuestions": [] 
}
\`\`\`

Final Output Rules:
- Respond ONLY with a single, valid JSON object matching the \`ProblemUnderstandingData\` structure.
- Ensure the response directly addresses and incorporates the user's clarification.
- Do not include any introductory text, comments on the clarification, or markdown code fences (\`\`\`).
`;

  const systemPrompt = `You are an AI assistant refining your understanding of a coding problem based on user feedback. Update your understanding statement and examples according to the clarification provided. Respond strictly with the ProblemUnderstandingData JSON structure.`;

  return { promptText: userPrompt, systemPrompt };
}

/**
 * Generates the NEW **Narrative Solution** prompt, **taking confirmed understanding as input**.
 * Focuses on Problem Analysis, Brute Force -> Optimization -> Implementation & Dry Run.
 * Returns JSON: NarrativeSolutionData (including problemAnalysis as confirmed).
 */
export function getNarrativeSolutionPrompt(
  language: string,
  problemInfo: ProblemInfo | null, // Allow null
  confirmedUnderstanding: string,
  confirmedExamples: ProblemExample[] // Use imported type
): { promptText: string; systemPrompt: string } {

  const userPrompt = `
Task: Based on the confirmed understanding and examples below, generate the **Problem Analysis**, Brute Force approach, Optimization Strategy, and Optimal Implementation (with code and dry run) for the coding problem.

Confirmed Understanding:
\`${confirmedUnderstanding}\`

Confirmed Examples:
${JSON.stringify(confirmedExamples, null, 2)}

Original Problem Information (for reference):
\`\`\`json
${JSON.stringify(problemInfo || {}, null, 2)} // Handle potential null
\`\`\`

Instructions: Structure your response strictly as a single JSON object with the following FOUR top-level keys: \`problemAnalysis\`, \`bruteForce\`, \`optimizationStrategy\`, and \`optimalImplementation\`.
 * \`problemAnalysis\`: (String) Provide the confirmed understanding exactly.
 * \`bruteForce\`: (Nested JSON Object)
    *   \`explanation\`: (Markdown String) Describe the straightforward, brute-force approach.
    *   \`codeOrPseudocode\`: (String) The brute force solution code or pseudocode in ${language}.
    *   \`timeComplexity\`: (String) Time Complexity (Big O).
    *   \`spaceComplexity\`: (String) Space Complexity (Big O).
    *   \`inefficiencyReason\`: (Markdown String) Explain *why* this approach is inefficient.

2.  \`optimizationStrategy\`: (Nested JSON Object)
    *   \`explanation\`: (Markdown String) Transition smoothly from brute force, explain the optimization technique.
    *   \`pseudocode\`: (String) Clear pseudocode for the optimal solution.
    *   \`timeComplexity\`: (String) Optimal Time Complexity (Big O).
    *   \`spaceComplexity\`: (String) Optimal Space Complexity (Big O).

3.  \`optimalImplementation\`: (Nested JSON Object)
    *   \`code\`: (String) Complete, runnable, **heavily commented** optimal code in ${language}.
    *   \`dryRun\`: (Markdown String) Detailed step-by-step dry run of the optimal code using one of the confirmed examples.

Final Output Rules:
- Ensure the entire output is a single, valid JSON object starting with { and ending with }.
- Do not include any text outside the JSON.

LANGUAGE: ${language}
`;

  const systemPrompt = `You are an expert coding interview coach. The user has confirmed their understanding of the problem. Generate the Brute Force analysis, Optimization Strategy, and Optimal Implementation (code + dry run), formatted strictly as a JSON object with keys 'problemAnalysis', 'bruteForce', 'optimizationStrategy', and 'optimalImplementation'. Use a conversational tone and ensure smooth transitions.`;

  return { promptText: userPrompt, systemPrompt };
}

/**
 * Generates the fallback solution prompt when the multi-prompt approach fails - MODIFIED FOR JSON
 */
export function getFallbackPrompt(
  language: string,
  problemInfo: ProblemInfo | null // Allow null
): { promptText: string; systemPrompt: string } {
  const promptText = `
You are a coding assistant. The user provided the following problem information:

Problem Statement: ${problemInfo?.problem_statement || 'Not specified'} // Handle optional/null
Constraints: ${problemInfo?.constraints || 'Not specified'} // Handle optional/null
Example Input: ${problemInfo?.example_input || 'Not specified'} // Handle optional/null
Example Output: ${problemInfo?.example_output || 'Not specified'} // Handle optional/null

Provide a concise and correct solution in ${language} directly. Your response should follow this structure:

### Thoughts
- Step-by-step thinking process to arrive at the solution.

### Code
\`\`\`${language}
// Your code here
\`\`\`

### Time Complexity
- O(...) analysis.

### Space Complexity
- O(...) analysis.
`;

  const systemPrompt = "You are a helpful coding assistant providing direct solutions.";

  return { promptText, systemPrompt };
}

/**
 * NEW: Generates the prompt for handling follow-up questions.
 */
export function getFollowUpPrompt(
  language: string,
  problemAnalysis: string, // Context
  previousCode: string,    // Context
  previousDryRun: string, // Context
  userQuestion: string      // The follow-up question
): { promptText: string; systemPrompt: string } {

  const userPrompt = `
Context:

Problem Analysis:
${problemAnalysis}

Previous Optimal Code (${language}):
\`\`\`${language}
${previousCode}
\`\`\`

Previous Dry Run:
${previousDryRun}

User Follow-up Question: ${userQuestion}

Task: Based *only* on the user's follow-up question and the provided context, generate an updated optimal implementation and dry run. Structure your response strictly as a single JSON object containing only the \`optimalImplementation\` key, with nested \`code\` and \`dryRun\` keys.

Guidelines:
- If the question asks for a modification, provide the **complete, updated** optimal code with detailed comments explaining the changes and the reasoning, plus a **new, corresponding** step-by-step dry run.
- If the question asks for clarification or explanation about the *existing* code/dry run, **do not modify them**. Instead, provide the explanation within the \`dryRun\` field of the response, perhaps prefixing it with "Explanation:". Keep the \`code\` field identical to the previous code.
- If the question is unrelated or cannot be addressed by modifying the code/dry run (e.g., asking about brute force), explain this briefly in the \`dryRun\` field and keep the \`code\` the same.
- Focus solely on generating the \`optimalImplementation\` object.

JSON Structure Required:
\`\`\`json
{
  "optimalImplementation": {
    "code": "(String containing complete, updated, commented code in ${language})",
    "dryRun": "(Markdown String containing new dry run OR explanation based on the question)"
  }
}
\`\`\`

Ensure the entire output is a single valid JSON object starting with { and ending with }. Do not include any other text or explanations outside this JSON object.
`;

  const systemPrompt = `You are an expert coding interview assistant. Your task is to process a follow-up question regarding a previously provided optimal solution. Respond strictly with a JSON object containing only the 'optimalImplementation' (with updated 'code' and 'dryRun' fields), reflecting the user's request or providing clarification as specified in the guidelines.`;

  return { promptText: userPrompt, systemPrompt };
}

/**
 * NEW: Generates the prompt for handling follow-up questions on a behavioral story.
 * Input: Original question, selected story, follow-up question.
 * Output: JSON { "explanation": "..." } or similar based on expected response.
 */
export function getBehavioralFollowUpPrompt(
  originalQuestion: string,
  selectedStory: { title: string; situation: string; task: string; action: string; result: string }, // Pass relevant story fields
  followUpQuestion: string
): { promptText: string; systemPrompt: string } {

  const storyContext = `
Title: ${selectedStory.title}
Situation: ${selectedStory.situation}
Task: ${selectedStory.task}
Action: ${selectedStory.action}
Result: ${selectedStory.result}
`;

  const userPrompt = `
Context:
Original Behavioral Question: "${originalQuestion}"
Previously Selected Story:
${storyContext}
User Follow-up Question: "${followUpQuestion}"

Task: Based on the context of the original question, the selected STAR story, and the user's follow-up question, provide a concise and helpful answer. Focus on addressing the specific follow-up question directly in relation to the story provided.

Respond ONLY with a JSON object containing a single key: \`explanation\`. The value should be a string containing your answer to the follow-up question.

Example JSON Output:
{
  "explanation": "Regarding how my manager reacted, they were initially concerned but ultimately supportive after seeing the positive results and the proactive steps taken. They commended the initiative during my performance review."
}

Your JSON Response:
`;

  const systemPrompt = `You are an AI assistant helping a user elaborate on their pre-written behavioral stories during an interview preparation context. Answer the user's follow-up question concisely and directly, based on the provided story. Respond strictly with a JSON object containing the key 'explanation'.`;

  return { promptText: userPrompt, systemPrompt };
}

// --- Behavioral Question Prompts ---\n\n/**\n * Generates the prompt for extracting relevant LPs from a behavioral question.\n * Input: User question, list of LPs.\n * Output: JSON array of LP names, e.g., [\"Customer Obsession\", \"Ownership\"].\n */\nexport function getBehavioralLPExtractionPrompt(\n  userQuestion: string,\n  lps: Array<{ name: string; description: string }>\n): { promptText: string; systemPrompt: string } {\n  const lpList = lps.map(lp => `- ${lp.name}: ${lp.description}`).join(\'\\n\');\n\n  const userPrompt = `\nUser Behavioral Question: \"${userQuestion}\"\n\nAvailable Leadership Principles:\n${lpList}\n\nTask: Analyze the user\'s question and identify the primary Leadership Principle(s) being targeted or relevant to the question. Respond ONLY with a JSON array containing the exact names (strings) of the identified principle(s). If multiple principles are strongly relevant, include them. If none seem directly relevant, return an empty array [].\n\nExample Output:\n[\"Customer Obsession\", \"Deliver Results\"]\n\nYour JSON Response:\n`;\n\n  const systemPrompt = `You are an AI assistant specializing in behavioral interviews, particularly Amazon's Leadership Principles. Your task is to identify which LPs are relevant to a given interview question. Respond strictly with a JSON array of LP names.`;\n\n  return { promptText: userPrompt, systemPrompt };\n}\n\n/**\n * Generates the prompt for selecting the best user story based on the question and extracted LPs.\n * Input: User question, extracted LPs, list of user stories.\n * Output: JSON { \"selectedStoryId\": \"id_or_null\", \"reasoning\": \"why_selected_or_not\" }.\n */\nexport function getBehavioralStorySelectionPrompt(\n  userQuestion: string,\n  extractedLPs: string[],\n  stories: Array<{ id: string; title: string; principles: string[]; situation: string; task: string; action: string; result: string }>\n): { promptText: string; systemPrompt: string } {\n  const storiesSummary = stories.map(s => \n    `- ID: ${s.id}\\n  Title: ${s.title}\\n  Principles: ${s.principles.join(\', \')}\\n  Summary: ${s.situation.substring(0, 50)}... ${s.result.substring(0, 50)}...`\n  ).join(\'\\n\\n\');\n\n  const userPrompt = `\nUser Behavioral Question: \"${userQuestion}\"\n\nIdentified Relevant Leadership Principles: ${extractedLPs.join(\', \')}\n\nAvailable User Stories:\n${storiesSummary}\n\nTask: Analyze the user question, the identified relevant principles, and the available user stories. Select the ONE story (by its ID) that BEST answers the user's question AND strongly aligns with the identified principles. \n\nProvide your response ONLY as a JSON object with two keys:\n1.  \`selectedStoryId\`: The ID (string) of the best matching story, or \`null\` if no story is a good fit.\n2.  \`reasoning\`: A brief (1-2 sentence) explanation for your choice (why it fits) or why no story was selected.\n\nExample Output (Match Found):\n{ \"selectedStoryId\": \"story-001\", \"reasoning\": \"Story directly addresses failing project situations and aligns with Ownership principle.\" }\n\nExample Output (No Match):\n{ \"selectedStoryId\": null, \"reasoning\": \"No story adequately demonstrated the specific conflict resolution scenario asked in the question.\" }\n\nYour JSON Response:\n`;\n\n  const systemPrompt = `You are an AI assistant helping users select the best STAR story for a behavioral interview question based on relevance and associated Leadership Principles. Respond strictly with a JSON object containing 'selectedStoryId' (string or null) and 'reasoning' (string).`;\n\n  return { promptText: userPrompt, systemPrompt };\n}\n\n/**\n * Generates the prompt for generating a STAR story as a fallback.\n * Input: User question, extracted LPs (and optionally user context - TBD).\n * Output: JSON { \"generatedStoryText\": \"full_star_story_text\" }.\n */\nexport function getBehavioralStoryGenerationPrompt(\n  userQuestion: string,\n  extractedLPs: string[]\n  // Future: Add user context parameter (e.g., userContext: { role: string; achievements: string[] })\n): { promptText: string; systemPrompt: string } {\n\n  // Basic context placeholder - THIS NEEDS TO BE REPLACED WITH REAL CONTEXT\n  const placeholderContext = \"User is a software engineer with experience in web development and cloud services. Key achievement: Led a project migration.\";\n\n  const userPrompt = `\nUser Behavioral Question: \"${userQuestion}\"\n\nTarget Leadership Principles: ${extractedLPs.join(\', \')}\n\nUser Context: ${placeholderContext} // IMPORTANT: This is placeholder context.\n\nTask: Generate a plausible and compelling story formatted using the STAR method (Situation, Task, Action, Result) that effectively answers the user's question and demonstrates the target Leadership Principles. Make reasonable assumptions based on the user context.\n\nStructure your response ONLY as a JSON object with a single key: \`generatedStoryText\`.\nThe value should be a single string containing the full story, formatted clearly with STAR headings (e.g., \"**Situation:** ... \\n**Task:** ... \\n**Action:** ... \\n**Result:** ...\").\n\nExample JSON Output:\n{ \"generatedStoryText\": \"**Situation:** In my previous role as a Software Engineer, we faced a critical performance issue with our main application... \\n**Task:** I was tasked with identifying the root cause... \\n**Action:** I initiated a deep dive analysis... \\n**Result:** This led to a 30% improvement in response time...\" }\n\nYour JSON Response:\n`;\n\n  const systemPrompt = `You are an AI assistant skilled at crafting compelling STAR-formatted behavioral stories based on a question, target Leadership Principles, and user context. Respond strictly with a JSON object containing the key 'generatedStoryText' with the full STAR story as its value.`;\n\n  return { promptText: userPrompt, systemPrompt };\n}\n 