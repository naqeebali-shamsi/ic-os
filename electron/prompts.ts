/**
 * This file contains the prompt templates for the solution generation process.
 * Each function returns a formatted prompt string based on the provided parameters.
 */

// Import the shared definition
import { ProblemInfo, ProblemExample } from './types'; // Import from new types file

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
  selectedStory: { id: string; title: string; principles: string[]; situation: string; task: string; action: string; result: string }, // Pass full story
  followUpQuestion: string
): { promptText: string; systemPrompt: string } {

  const storyContext = `
Story ID: ${selectedStory.id}
Title: ${selectedStory.title}
Relevant LPs: ${selectedStory.principles.join(', ')}
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

Task: Provide a confident, natural, and subtly technical answer to the user's follow-up question. Base your answer directly on the details provided in the selected STAR story context.

Instructions:
1.  Carefully analyze the follow-up question in relation to the specific details (Situation, Task, Action, Result) of the provided story.
2.  Formulate an answer that directly addresses the follow-up question.
3.  Where relevant, subtly incorporate or reference the **quantitative impact/results** or **key lessons learned** mentioned in the story's 'Result' field or implied by the narrative.
4.  Maintain a confident and natural tone, avoiding weak phrasing.
5.  Respond ONLY with a JSON object containing a single key: \`explanation\`. The value should be a string containing your answer.

Example JSON Output (Follow-up: "What was the biggest challenge?"):
{
  "explanation": "The biggest challenge was definitely the tight deadline coupled with the unexpected complexity of the third-party API integration. We overcame it by prioritizing ruthlessly and implementing the temporary caching layer mentioned, which bought us the necessary time to address the core issue without delaying the launch. This reinforced the lesson about needing contingency plans, especially with external dependencies."
}

Your JSON Response:
`;

  const systemPrompt = `You are an AI assistant helping a user elaborate on their pre-written behavioral stories during interview preparation. Answer the user's specific follow-up question confidently and directly, drawing ONLY from the provided STAR story context. Incorporate impact and lessons learned where relevant. Respond strictly with a JSON object containing the key 'explanation'.`;

  return { promptText: userPrompt, systemPrompt };
}

// --- Behavioral Question Prompts ---

/**
 * Generates the prompt for extracting relevant LPs from a behavioral question.
 * Input: User question, list of LPs.
 * Output: JSON array of LP names, e.g., ["Customer Obsession", "Ownership"].
 */
export function getBehavioralLPExtractionPrompt(
  userQuestion: string,
  lps: Array<{ name: string; description: string }>
): { promptText: string; systemPrompt: string } {
  const lpList = lps.map(lp => `- ${lp.name}: ${lp.description}`).join('\n');

  const userPrompt = `
User Behavioral Question: "${userQuestion}"

Available Leadership Principles:
${lpList}

Task: Analyze the user's question and identify the primary Leadership Principle(s) being targeted or relevant to the question. Respond ONLY with a JSON array containing the exact names (strings) of the identified principle(s). If multiple principles are strongly relevant, include them. If none seem directly relevant, return an empty array [].

Example Output:
["Customer Obsession", "Deliver Results"]

Your JSON Response:
`;

  const systemPrompt = `You are an AI assistant specializing in behavioral interviews, particularly Amazon's Leadership Principles. Your task is to identify which LPs are relevant to a given interview question. Respond strictly with a JSON array of LP names.`;

  return { promptText: userPrompt, systemPrompt };
}

/**
 * Generates the prompt for selecting the best user story based on the question and extracted LPs.
 * Input: User question, extracted LPs, list of user stories.
 * Output: JSON { "selectedStoryId": "id_or_null", "reasoning": "why_selected_or_not" }.
 */
export function getBehavioralStorySelectionPrompt(
  userQuestion: string,
  extractedLPs: string[],
  stories: Array<{ id: string; title: string; principles: string[]; situation: string; task: string; action: string; result: string }>
): { promptText: string; systemPrompt: string } {

  const storiesFormatted = stories.map(s =>
    `Story ID: ${s.id}\\nTitle: ${s.title}\\nRelevant LPs: ${s.principles.join(', ')}\\nSituation: ${s.situation}\\nTask: ${s.task}\\nAction: ${s.action}\\nResult: ${s.result}`
  ).join('\\n\\n---\\n\\n');

  const userPrompt = `
Task: Select the *single best* behavioral story from the list below that answers the user's question, considering the relevant Leadership Principles (LPs). Then, provide a detailed reasoning for the selection.

User Question: ${userQuestion}

Extracted Relevant LPs: ${extractedLPs.join(', ')}

Available Stories:
${storiesFormatted}

Instructions:
1.  Analyze the User Question and the Extracted LPs.
2.  Review each Available Story, paying attention to its Situation, Task, Action, Result (STAR), and tagged LPs.
3.  Determine which *single story* is the most relevant and effective answer to the user's question, aligning with the LPs.
4.  Respond ONLY with a valid JSON object containing:
    *   \`selectedStoryId\`: The ID (string or number) of the chosen story, or \`null\` if no story is a good fit.
    *   \`reasoning\`: A detailed explanation (string) formatted in a confident, natural, and subtly technical tone. This reasoning MUST include:
        *   A clear statement of *why* this story directly answers the user's question and aligns with the specified LPs.
        *   A concise summary of the story's STAR components (Situation, Task, Action, Result).
        *   Explicit mention of the **quantitative impact** or key results (drawn from the story's 'Result' field). If no quantitative data is present, state the qualitative outcome clearly.
        *   A summary of the **key lessons learned** or takeaways from the experience, ideally framed using relevant LPs (derived from the 'Result' or overall story context).
        *   Avoid weak phrasing; use strong verbs and active voice.

Example JSON Output (Success):
\`\`\`json
{
  "selectedStoryId": "story_003",
  "reasoning": "This story directly addresses the user's question about handling project failures and demonstrates 'Ownership' and 'Learn and Be Curious'. \\n\\n**STAR Summary:**\\n*   **Situation:** Faced unexpected integration issues with a third-party API during a critical deployment phase.\\n*   **Task:** Needed to identify the root cause and implement a fix under a tight deadline.\\n*   **Action:** Led a deep-dive debugging session, collaborated with the API provider, and implemented a workaround involving a temporary caching layer.\\n*   **Result:** Successfully mitigated the deployment blocker, resulting in a 90% reduction in integration errors and delivering the project on schedule.\\n\\n**Impact & Lessons:** The primary impact was preventing a major project delay and significantly improving integration stability (90% error reduction). Key takeaways include the importance of proactive vendor communication ('Earn Trust') and the value of exploring creative workarounds ('Invent and Simplify') when standard solutions fail. This experience reinforced my commitment to taking full ownership of problems, even external ones."
}
\`\`\`

Example JSON Output (No Match):
\`\`\`json
{
  "selectedStoryId": null,
  "reasoning": "None of the provided stories effectively demonstrate the 'Think Big' principle in the context of the user's question about long-term strategic planning. The available stories focus more on tactical execution or resolving immediate issues."
}
\`\`\`

Final Output Rules:
- Respond ONLY with the specified JSON object.
- The \`reasoning\` field must be detailed and structured as described above.
- Do not include any introductory text or markdown formatting *outside* the JSON string values.
`;

  const systemPrompt = `You are an AI assistant helping users prepare for behavioral interviews, specifically for roles requiring strong communication and adherence to principles like Amazon's LPs. Your task is to select the single best pre-written STAR story from a list that answers a given behavioral question and aligns with specified principles. You must then generate a detailed, confident reasoning for your choice, summarizing STAR, highlighting impact, and detailing lessons learned, all within the specified JSON format.`;

  return { promptText: userPrompt, systemPrompt };
}

/**
 * Generates the prompt for generating a STAR story as a fallback.
 * Input: User question, extracted LPs (and optionally user context - TBD).
 * Output: JSON { "generatedStoryText": "full_star_story_text" }.
 */
export function getBehavioralStoryGenerationPrompt(
  userQuestion: string,
  extractedLPs: string[]
  // Future: Add user context parameter (e.g., userContext: { role: string; achievements: string[] })
): { promptText: string; systemPrompt: string } {

  // Basic context placeholder - THIS NEEDS TO BE REPLACED WITH REAL CONTEXT
  const placeholderContext = "User is a software engineer with experience in web development and cloud services. Key achievement: Led a project migration.";

  const userPrompt = `
User Behavioral Question: "${userQuestion}"

Target Leadership Principles: ${extractedLPs.join(', ')}

User Context: ${placeholderContext} // IMPORTANT: This is placeholder context.

Task: Generate a plausible and compelling story formatted using the STAR method (Situation, Task, Action, Result) that effectively answers the user's question and demonstrates the target Leadership Principles. Make reasonable assumptions based on the user context.

Structure your response ONLY as a JSON object with a single key: \`generatedStoryText\`.
The value should be a single string containing the full story, formatted clearly with STAR headings (e.g., "**Situation:** ... \n**Task:** ... \n**Action:** ... \n**Result:** ...").

Example JSON Output:
{ "generatedStoryText": "**Situation:** In my previous role as a Software Engineer, we faced a critical performance issue with our main application... \n**Task:** I was tasked with identifying the root cause... \n**Action:** I initiated a deep dive analysis... \n**Result:** This led to a 30% improvement in response time..." }

Your JSON Response:
`;

  const systemPrompt = `You are an AI assistant skilled at crafting compelling STAR-formatted behavioral stories based on a question, target Leadership Principles, and user context. Respond strictly with a JSON object containing the key 'generatedStoryText' with the full STAR story as its value.`;

  return { promptText: userPrompt, systemPrompt };
}

/**
 * Generates the prompt for anticipating likely follow-up questions for a behavioral story.
 * Input: Original question, selected story.
 * Output: JSON array [{ question: string, answer: string }].
 */
export function getAnticipatedBehavioralFollowUpsPrompt(
  originalQuestion: string,
  selectedStory: { id: string; title: string; principles: string[]; situation: string; task: string; action: string; result: string } // Pass full story
): { promptText: string; systemPrompt: string } {

  const storyContext = `
Story ID: ${selectedStory.id}
Title: ${selectedStory.title}
Relevant LPs: ${selectedStory.principles.join(', ')}
Situation: ${selectedStory.situation}
Task: ${selectedStory.task}
Action: ${selectedStory.action}
Result: ${selectedStory.result}
`;

  const userPrompt = `
Context:
Original Behavioral Question: "${originalQuestion}"
Selected STAR Story Provided by User:
${storyContext}

Task: Based *only* on the provided STAR story, anticipate 3-5 likely follow-up questions an interviewer might ask. Focus on questions that probe deeper into:
*   Specific technical details mentioned or implied in the 'Action'.
*   Challenges encountered during the 'Task' or 'Action'.
*   Specific outcomes or quantitative results mentioned in the 'Result'.
*   Alternative approaches considered.
*   Key lessons learned or how the experience changed your approach (related to the 'Result').

For each anticipated question, provide a concise, confident, and direct answer drawn strictly from the provided story details. Maintain a natural, subtly technical tone.

Respond ONLY with a single, valid JSON array where each element is an object containing two keys: \`question\` (string) and \`answer\` (string).

Example JSON Output:
[
  {
    "question": "You mentioned collaborating with the API provider; what was the main point of friction there?",
    "answer": "The main friction point was aligning on the urgency. Initially, the provider didn't view the integration error as critical on their end. I addressed this by clearly presenting the data showing the direct impact on our deployment timeline and user experience, which helped escalate the issue and secure their cooperation."
  },
  {
    "question": "What was the performance impact of the temporary caching layer you implemented?",
    "answer": "The caching layer immediately reduced the integration error rate by about 90%, effectively unblocking the deployment. While it added a small amount of latency (around 50ms), this was acceptable short-term compared to the complete failure we were experiencing."
  },
  {
    "question": "Were there other workarounds you considered before settling on the caching layer?",
    "answer": "Yes, we briefly considered rate-limiting calls or implementing a more complex retry mechanism with exponential backoff. However, given the tight deadline, the caching layer offered the fastest path to stability while we worked with the vendor on a permanent fix."
  }
]

Your JSON Response:
`;

  const systemPrompt = `You are an AI assistant simulating a behavioral interview scenario. Based on a user's provided STAR story and the original question it answered, anticipate 3-5 likely follow-up questions an interviewer might ask, probing for more detail. Provide concise, confident answers to these anticipated questions, drawing ONLY from the story's content. Respond strictly with a JSON array of {question, answer} objects.`;

  return { promptText: userPrompt, systemPrompt };
}

export function getBehavioralStoryDetailPrompt(story: {
  id: string;
  title: string;
  principles: string[];
  situation: string;
  task: string;
  action: string;
  result: string;
}): string {
  const storyJson = JSON.stringify(story, null, 2); // Pretty print the JSON for the prompt

  return `
**Role:** Act as an expert career coach preparing a candidate for behavioral interviews, specifically focusing on Amazon's Leadership Principles (LPs).

**Context:** You are given a concise story outline in the STAR (Situation, Task, Action, Result) format, along with associated LPs. Your goal is to expand this into a rich, detailed narrative **written in the first person ("I" statements)** from the candidate's perspective, which they can use for deep preparation.

**Input Story Outline:**
\`\`\`json
${storyJson}
\`\`\`

**Instructions:**

Expand the provided story outline into a detailed narrative suitable for a behavioral interview, **written entirely from the first-person perspective ("I")**. Ensure the narrative covers the following aspects in depth:

1.  **Detailed Situation:**
    *   Go beyond the summary. What was the broader context *I* faced?
    *   Why was this situation important or challenging for *me* or *my* team?
    *   What were the key constraints (time, resources, technical limitations) *I* operated under?
2.  **Specific Task:**
    *   Clearly define *my* specific responsibilities within the overall task.
    *   What was the primary objective *I* needed to achieve?
3.  **In-Depth Action:**
    *   Describe the steps *I* took in detail. What was *my* thought process?
    *   What specific decisions did *I* make? Why?
    *   Mention key technical details, tools, or methodologies *I* used.
    *   What were the main challenges or obstacles *I* encountered? How did *I* overcome them?
    *   **Collaboration:** If others were involved, clearly state their roles and how *I* collaborated or interacted with them. Define *my* unique contribution.
4.  **Expanded Result:**
    *   Elaborate on the stated result. *How* were the metrics measured or estimated? Provide specifics if possible.
    *   If quantifiable results aren't available, describe the qualitative impact *I* observed in detail (e.g., improved team morale, enhanced process efficiency, positive user feedback).
    *   What was the significance of this result for the team, project, or company, from *my* perspective?
5.  **Lessons Learned & LP Connection:**
    *   Concisely summarize 2-3 key takeaways *I* gained from this experience.
    *   Explicitly connect these takeaways to the listed Leadership Principles (${'`' + story.principles.join('`, `') + '`'}). For example: "This experience taught *me* the importance of [LP Name], specifically when *I* had to [brief action related to the LP]."
    *   Make these takeaways strong and memorable, easy for an interviewer to note down.

**Output Format:**

Present the expanded story in a clear, readable format using Markdown sections (\`### Situation\`, \`### Task\`, \`### Action\`, \`### Result\`, \`### Lessons Learned\`). Ensure the narrative flows well, feels authentic, and **uses the first person ("I") throughout.**
`;
}