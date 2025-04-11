import { OpenAI } from "openai";
import Anthropic from '@anthropic-ai/sdk';
import * as axios from "axios";
import { configHelper } from "./ConfigHelper";

// Interface for Gemini API requests
interface GeminiMessage {
  role: string;
  parts: Array<{
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string;
    }
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
}

export class AIService {
  private openaiClient: OpenAI | null = null;
  private geminiApiKey: string | null = null;
  private anthropicClient: Anthropic | null = null;

  constructor() {
    this.initializeAIClient();
    
    // Listen for config changes to re-initialize the AI client
    configHelper.on('config-updated', () => {
      this.initializeAIClient();
    });
  }

  /**
   * Initialize or reinitialize the AI client with current config
   */
  private initializeAIClient(): void {
    try {
      const config = configHelper.loadConfig();
      
      if (config.apiProvider === "openai") {
        if (config.apiKey) {
          this.openaiClient = new OpenAI({ 
            apiKey: config.apiKey,
            timeout: 60000, // 60 second timeout
            maxRetries: 2   // Retry up to 2 times
          });
          this.geminiApiKey = null;
          this.anthropicClient = null;
          console.log("OpenAI client initialized successfully");
        } else {
          this.openaiClient = null;
          this.geminiApiKey = null;
          this.anthropicClient = null;
          console.warn("No API key available, OpenAI client not initialized");
        }
      } else if (config.apiProvider === "gemini"){
        // Gemini client initialization
        this.openaiClient = null;
        this.anthropicClient = null;
        if (config.apiKey) {
          this.geminiApiKey = config.apiKey;
          console.log("Gemini API key set successfully");
        } else {
          this.openaiClient = null;
          this.geminiApiKey = null;
          this.anthropicClient = null;
          console.warn("No API key available, Gemini client not initialized");
        }
      } else if (config.apiProvider === "anthropic") {
        // Reset other clients
        this.openaiClient = null;
        this.geminiApiKey = null;
        if (config.apiKey) {
          this.anthropicClient = new Anthropic({
            apiKey: config.apiKey,
            timeout: 60000,
            maxRetries: 2
          });
          console.log("Anthropic client initialized successfully");
        } else {
          this.openaiClient = null;
          this.geminiApiKey = null;
          this.anthropicClient = null;
          console.warn("No API key available, Anthropic client not initialized");
        }
      }
    } catch (error) {
      console.error("Failed to initialize AI client:", error);
      this.openaiClient = null;
      this.geminiApiKey = null;
      this.anthropicClient = null;
    }
  }

  /**
   * Get the active provider from config
   */
  public getProvider(): string {
    const config = configHelper.loadConfig();
    return config.apiProvider;
  }

  /**
   * Check if we have a valid AI client
   */
  public hasValidClient(): boolean {
    const config = configHelper.loadConfig();
    
    if (config.apiProvider === "openai") {
      return this.openaiClient !== null;
    } else if (config.apiProvider === "gemini") {
      return this.geminiApiKey !== null;
    } else if (config.apiProvider === "anthropic") {
      return this.anthropicClient !== null;
    }
    
    return false;
  }

  /**
   * Generate a completion using the appropriate AI service
   */
  public async generateCompletion(
    prompt: string, 
    systemPrompt: string = "", 
    modelOverride?: string,
    signal?: AbortSignal
  ): Promise<string> {
    const config = configHelper.loadConfig();
    
    if (config.apiProvider === "openai") {
      if (!this.openaiClient) {
        throw new Error("OpenAI client not initialized");
      }
      
      const messages = [
        { role: "system" as const, content: systemPrompt },
        { role: "user" as const, content: prompt }
      ];
      
      const response = await this.openaiClient.chat.completions.create({
        model: modelOverride || config.solutionModel || "gpt-4o",
        messages: messages,
        max_tokens: 4000,
        temperature: 0.2
      });
      
      return response.choices[0].message.content || "";
    } else if (config.apiProvider === "gemini") {
      if (!this.geminiApiKey) {
        throw new Error("Gemini API key not initialized");
      }
      
      // Create Gemini message structure
      const geminiMessages = [
        {
          role: "user",
          parts: [
            {
              text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt
            }
          ]
        }
      ];

      // Make API request to Gemini
      const response = await axios.default.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelOverride || config.solutionModel || "gemini-2.0-flash"}:generateContent?key=${this.geminiApiKey}`,
        {
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4000
          }
        },
        { signal }
      );

      const responseData = response.data as GeminiResponse;
      
      if (!responseData.candidates || responseData.candidates.length === 0) {
        throw new Error("Empty response from Gemini API");
      }
      
      return responseData.candidates[0].content.parts[0].text;
    } else if (config.apiProvider === "anthropic") {
      if (!this.anthropicClient) {
        throw new Error("Anthropic client not initialized");
      }
      
      const messages = [
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt
            }
          ]
        }
      ];

      // Send to Anthropic API
      const response = await this.anthropicClient.messages.create({
        model: modelOverride || config.solutionModel || "claude-3-7-sonnet-20250219",
        max_tokens: 4000,
        messages: messages,
        temperature: 0.2
      });

      return (response.content[0] as { type: 'text', text: string }).text;
    }
    
    throw new Error("No valid AI provider configured");
  }

  /**
   * Generate a vision completion using the appropriate AI service
   */
  public async generateVisionCompletion(
    prompt: string,
    imageDataList: string[],
    systemPrompt: string = "",
    modelOverride?: string,
    signal?: AbortSignal
  ): Promise<string> {
    const config = configHelper.loadConfig();
    
    if (config.apiProvider === "openai") {
      if (!this.openaiClient) {
        throw new Error("OpenAI client not initialized");
      }
      
      const messages = [
        {
          role: "system" as const,
          content: systemPrompt
        },
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: prompt
            },
            ...imageDataList.map(data => ({
              type: "image_url" as const,
              image_url: { url: `data:image/png;base64,${data}` }
            }))
          ]
        }
      ];
      
      const response = await this.openaiClient.chat.completions.create({
        model: modelOverride || config.extractionModel || "gpt-4o",
        messages: messages,
        max_tokens: 4000,
        temperature: 0.2
      });
      
      return response.choices[0].message.content || "";
    } else if (config.apiProvider === "gemini") {
      if (!this.geminiApiKey) {
        throw new Error("Gemini API key not initialized");
      }
      
      // Create Gemini message structure
      const geminiMessages: GeminiMessage[] = [
        {
          role: "user",
          parts: [
            {
              text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt
            },
            ...imageDataList.map(data => ({
              inlineData: {
                mimeType: "image/png",
                data: data
              }
            }))
          ]
        }
      ];

      // Make API request to Gemini
      const response = await axios.default.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelOverride || config.extractionModel || "gemini-2.0-flash"}:generateContent?key=${this.geminiApiKey}`,
        {
          contents: geminiMessages,
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4000
          }
        },
        { signal }
      );

      const responseData = response.data as GeminiResponse;
      
      if (!responseData.candidates || responseData.candidates.length === 0) {
        throw new Error("Empty response from Gemini API");
      }
      
      return responseData.candidates[0].content.parts[0].text;
    } else if (config.apiProvider === "anthropic") {
      if (!this.anthropicClient) {
        throw new Error("Anthropic client not initialized");
      }
      
      const messages = [
        {
          role: "user" as const,
          content: [
            {
              type: "text" as const,
              text: systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt
            },
            ...imageDataList.map(data => ({
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: "image/png" as const,
                data: data
              }
            }))
          ]
        }
      ];

      // Send to Anthropic API
      const response = await this.anthropicClient.messages.create({
        model: modelOverride || config.extractionModel || "claude-3-7-sonnet-20250219",
        max_tokens: 4000,
        messages: messages,
        temperature: 0.2
      });

      return (response.content[0] as { type: 'text', text: string }).text;
    }
    
    throw new Error("No valid AI provider configured");
  }
}

// Export a singleton instance
export const aiService = new AIService(); 