import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { solutionProcessor } from '../SolutionProcessor';
import { aiService } from '../AIService';
import { responseParser } from '../ResponseParser';

// Mock dependencies
vi.mock('../AIService', () => ({
  aiService: {
    generateCompletion: vi.fn()
  }
}));

vi.mock('../ResponseParser', () => ({
  responseParser: {
    parseBruteForceResponse: vi.fn(),
    parseOptimizedResponse: vi.fn(),
    parseStandardSolutionResponse: vi.fn()
  }
}));

describe('SolutionProcessor', () => {
  const mockProblemInfo = {
    problem_statement: 'Test problem',
    constraints: 'Test constraints',
    example_input: 'Test input',
    example_output: 'Test output'
  };

  const mockBruteForceResponse = 'Brute force response';
  const mockOptimizedResponse = 'Optimized response';
  
  const mockParsedBruteForce = {
    code: 'brute force code',
    timeComplexity: 'O(n^2)',
    spaceComplexity: 'O(n)',
    complexityRationale: 'brute force rationale'
  };
  
  const mockParsedOptimized = {
    optimizationAnalysis: ['optimization point 1', 'optimization point 2'],
    code: 'optimized code',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    complexityRationale: 'optimized rationale'
  };

  const mockAbortSignal = { aborted: false } as AbortSignal;
  const mockMainWindow = {
    webContents: {
      send: vi.fn()
    }
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Set up default mock implementations
    vi.mocked(aiService.generateCompletion)
      .mockImplementation(async (prompt) => {
        if (prompt.includes('brute force')) {
          return mockBruteForceResponse;
        } else {
          return mockOptimizedResponse;
        }
      });
      
    vi.mocked(responseParser.parseBruteForceResponse)
      .mockReturnValue(mockParsedBruteForce);
      
    vi.mocked(responseParser.parseOptimizedResponse)
      .mockReturnValue(mockParsedOptimized);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should generate a complete solution with brute force and optimized approaches', async () => {
    const result = await solutionProcessor.generateSolutions(
      mockProblemInfo,
      'javascript',
      mockMainWindow,
      mockAbortSignal
    );

    // Verify success
    expect(result.success).toBe(true);
    
    // Verify API calls
    expect(aiService.generateCompletion).toHaveBeenCalledTimes(2);
    
    // Check the data structure
    const data = result.data;
    expect(data).toBeDefined();
    if (data) {
      expect(data).toHaveProperty('problemStatement', mockProblemInfo.problem_statement);
      expect(data).toHaveProperty('bruteForceCode', mockParsedBruteForce.code);
      expect(data).toHaveProperty('bruteForceTimeComplexity', mockParsedBruteForce.timeComplexity);
      expect(data).toHaveProperty('bruteForceSpaceComplexity', mockParsedBruteForce.spaceComplexity);
      expect(data).toHaveProperty('bruteForceComplexityRationale', mockParsedBruteForce.complexityRationale);
      expect(data).toHaveProperty('optimizationAnalysis', mockParsedOptimized.optimizationAnalysis);
      expect(data).toHaveProperty('optimizedCode', mockParsedOptimized.code);
      expect(data).toHaveProperty('optimizedTimeComplexity', mockParsedOptimized.timeComplexity);
      expect(data).toHaveProperty('optimizedSpaceComplexity', mockParsedOptimized.spaceComplexity);
      expect(data).toHaveProperty('optimizedComplexityRationale', mockParsedOptimized.complexityRationale);
    }
  });

  it('should fallback to standard solution if multi-prompt approach fails', async () => {
    // Set up mocks to simulate failure in first approach
    vi.mocked(aiService.generateCompletion)
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce('Standard solution response');
      
    vi.mocked(responseParser.parseStandardSolutionResponse)
      .mockReturnValue({
        code: 'standard code',
        thoughts: ['thought 1', 'thought 2'],
        time_complexity: 'O(n log n)',
        space_complexity: 'O(n)'
      });
    
    const result = await solutionProcessor.generateSolutions(
      mockProblemInfo,
      'javascript',
      mockMainWindow,
      mockAbortSignal
    );
    
    // Verify success despite initial failure
    expect(result.success).toBe(true);
    
    // Verify fallback API call
    expect(aiService.generateCompletion).toHaveBeenCalledTimes(2);
    expect(responseParser.parseStandardSolutionResponse).toHaveBeenCalledTimes(1);
    
    // Verify data is in the standard format
    expect(result.data).toHaveProperty('code');
    expect(result.data).toHaveProperty('thoughts');
    expect(result.data).toHaveProperty('time_complexity');
    expect(result.data).toHaveProperty('space_complexity');
  });
}); 