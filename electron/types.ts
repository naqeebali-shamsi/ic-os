export interface ProblemInfo {
  problem_statement?: string; // Keep optional here, handle requirement in implementation if needed
  constraints?: string;
  example_input?: string;
  example_output?: string;
  // Add other potential fields extracted by AI
}

export interface ProblemExample {
  input: string; // Example input description
  output: string; // Corresponding output
  explanation?: string; // Optional brief explanation of the example
}

// Types for Behavioral Assistant Feature
export interface AmazonLP {
  name: string;
  description: string;
}

export interface BehavioralStory {
  id: string;
  title: string;
  principles: string[];
  situation: string;
  task: string;
  action: string;
  result: string;
}

// NEW: Types for System Design Assistant Feature
export interface SystemDesignMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SystemDesignConversation {
  id: string; // Unique ID for the conversation session
  title: string; // Maybe the initial question or user-defined
  messages: SystemDesignMessage[];
  // Potentially add metadata like creation date, last updated, etc.
}

// Type for the request to start or continue a design conversation
export interface ProcessSystemDesignArgs {
  conversationId?: string; // Provide if continuing an existing conversation
  question: string; // The user's latest question or prompt
  // We might add parameters here later to specify HLD/LLD or other constraints
}

// Type for the response from the backend
export interface SystemDesignResponse {
  conversationId: string; // ID of the conversation (new or existing)
  response: string; // The AI's response message content
  error?: string; // Optional error message
}

// Type definition for OpenAI message format used in AIService
export type OpenAIMessage = ChatCompletionMessageParam; 