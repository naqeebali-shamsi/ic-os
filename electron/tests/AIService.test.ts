import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIService } from '../AIService';
import { configHelper } from '../ConfigHelper';

// Mock ConfigHelper
vi.mock('../ConfigHelper', () => ({
  configHelper: {
    loadConfig: vi.fn().mockReturnValue({
      apiKey: 'test-api-key',
      apiProvider: 'openai',
      extractionModel: 'gpt-4o',
      solutionModel: 'gpt-4o',
      debuggingModel: 'gpt-4o',
      language: 'javascript',
      opacity: 1.0
    }),
    on: vi.fn()
  }
}));

// Mock OpenAI
vi.mock('openai', () => ({
  OpenAI: vi.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'OpenAI response' } }]
        })
      }
    }
  }))
}));

// Mock Anthropic
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [{ type: 'text', text: 'Anthropic response' }]
      })
    }
  }))
}));

// Mock Axios
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: {
        candidates: [
          {
            content: {
              parts: [{ text: 'Gemini response' }]
            },
            finishReason: 'STOP'
          }
        ]
      }
    }),
    isCancel: vi.fn().mockReturnValue(false)
  }
}));

describe('AIService', () => {
  let aiService: AIService;
  const mockConfig = {
    apiKey: 'test-api-key',
    apiProvider: 'openai',
    extractionModel: 'gpt-4o',
    solutionModel: 'gpt-4o',
    debuggingModel: 'gpt-4o',
    language: 'javascript',
    opacity: 1.0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(configHelper.loadConfig).mockReturnValue(mockConfig);
    
    // Create a new instance for each test
    aiService = new AIService();
    
    // Manually set the client properties to bypass initialization
    const anyService = aiService as any;
    anyService.openaiClient = {
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'OpenAI response' } }]
          })
        }
      }
    };
    anyService.geminiApiKey = 'test-gemini-key';
    anyService.anthropicClient = {
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Anthropic response' }]
        })
      }
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getProvider', () => {
    it('should return the provider from config', () => {
      expect(aiService.getProvider()).toBe('openai');
    });
  });

  describe('hasValidClient', () => {
    it('should return true when client is initialized', () => {
      expect(aiService.hasValidClient()).toBe(true);
    });
  });
}); 