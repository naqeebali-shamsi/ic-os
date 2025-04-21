import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { solutionProcessor } from '../SolutionProcessor';
import { aiService } from '../AIService';
import { responseParser, BasicSolutionData, DetailedSolutionData, FourQuadrantData } from '../ResponseParser';
import { BrowserWindow } from 'electron';

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
    parseStandardSolutionResponse: vi.fn(),
    parseFourQuadrantResponse: vi.fn()
  }
}));

// Type guards
function isDetailedSolution(data: BasicSolutionData | DetailedSolutionData | FourQuadrantData): data is DetailedSolutionData {
  return data && typeof data === 'object' && 'bruteForceCode' in data;
}

function isBasicSolution(data: BasicSolutionData | DetailedSolutionData | FourQuadrantData): data is BasicSolutionData {
  return data && typeof data === 'object' && 'thoughts' in data;
}

function isFourQuadrantData(data: BasicSolutionData | DetailedSolutionData | FourQuadrantData): data is FourQuadrantData {
  return data && typeof data === 'object' && 'problemUnderstanding' in data;
}

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
    complexityRationale: 'brute force rationale',
    dryRunVisualization: 'Brute force dry run: i=0, j=1, nums[i]=2, nums[j]=7, sum=9, return [0,1]'
  };
  
  const mockParsedOptimized = {
    optimizationAnalysis: ['optimization point 1', 'optimization point 2'],
    code: 'optimized code',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(1)',
    complexityRationale: 'optimized rationale',
    dryRunVisualization: 'Optimized dry run: i=0, nums[i]=2, complement=7, numMap={}, add 2 to numMap; i=1, nums[i]=7, complement=2, found in numMap, return [0,1]'
  };

  const mockFourQuadrantApiResponse = 'Four quadrant API response';
  const mockParsedFourQuadrant: FourQuadrantData = {
    problemUnderstanding: 'Understood the problem well.',
    bruteForceApproach: 'Try all pairs.',
    optimalSolutionPseudocode: 'Use a hash map.',
    optimalSolutionImplementation: {
      code: 'optimal code here',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)',
      thinkingProcess: 'Store seen numbers.'
    }
  };

  const mockAbortSignal = { aborted: false } as AbortSignal;
  const mockMainWindow: Partial<BrowserWindow> = {
    webContents: {
      send: vi.fn()
    } as any
  };

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

    vi.mocked(responseParser.parseFourQuadrantResponse)
      .mockReturnValue(mockParsedFourQuadrant);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should generate a complete solution with brute force and optimized approaches', async () => {
    const result = await solutionProcessor.generateSolutions(
      mockProblemInfo,
      'javascript',
      mockMainWindow as BrowserWindow,
      mockAbortSignal
    );

    // Debug logging
    console.log("SolutionProcessor.generateSolutions result:", result.data);

    // Verify success
    expect(result.success).toBe(true);
    
    // Verify API calls
    expect(aiService.generateCompletion).toHaveBeenCalledTimes(2);
    
    // Check the data structure
    const data = result.data;
    expect(data).toBeDefined();
    
    // Use type guard to check the structure
    if (data && isDetailedSolution(data)) {
      console.log("Brute force dry run:", data.bruteForceDryRunVisualization ?? 'Not available');
      console.log("Optimized dry run:", data.optimizedDryRunVisualization ?? 'Not available');
      
      // Assertions for DetailedSolutionData
      expect(data).toHaveProperty('problemStatement', mockProblemInfo.problem_statement);
      expect(data).toHaveProperty('bruteForceCode', mockParsedBruteForce.code);
      expect(data).toHaveProperty('bruteForceTimeComplexity', mockParsedBruteForce.timeComplexity);
      expect(data).toHaveProperty('bruteForceSpaceComplexity', mockParsedBruteForce.spaceComplexity);
      expect(data).toHaveProperty('bruteForceComplexityRationale', mockParsedBruteForce.complexityRationale);
      expect(data).toHaveProperty('bruteForceDryRunVisualization', mockParsedBruteForce.dryRunVisualization);
      expect(data).toHaveProperty('optimizationAnalysis', mockParsedOptimized.optimizationAnalysis);
      expect(data).toHaveProperty('optimizedCode', mockParsedOptimized.code);
      expect(data).toHaveProperty('optimizedTimeComplexity', mockParsedOptimized.timeComplexity);
      expect(data).toHaveProperty('optimizedSpaceComplexity', mockParsedOptimized.spaceComplexity);
      expect(data).toHaveProperty('optimizedComplexityRationale', mockParsedOptimized.complexityRationale);
      expect(data).toHaveProperty('optimizedDryRunVisualization', mockParsedOptimized.dryRunVisualization);
    } else {
      // Fail the test if the data structure is not as expected
      expect(data).toBeUndefined(); // Or assert the structure should be DetailedSolutionData
    }
  });

  it('should generate a complete four-quadrant solution', async () => {
    const result = await solutionProcessor.generateSolutions(
      mockProblemInfo,
      'javascript',
      mockMainWindow as BrowserWindow,
      mockAbortSignal
    );

    // Debug logging
    console.log("SolutionProcessor.generateSolutions result:", result.data);

    // Verify success
    expect(result.success).toBe(true);

    // Verify API calls
    expect(aiService.generateCompletion).toHaveBeenCalledTimes(1);
    expect(responseParser.parseFourQuadrantResponse).toHaveBeenCalledWith(mockFourQuadrantApiResponse);

    // Check the data structure
    const data = result.data;
    expect(data).toBeDefined();

    // Use the NEW type guard
    if (data && isFourQuadrantData(data)) {
      console.log("Four Quadrant Data:", data);

      // Assertions for FourQuadrantData
      expect(data.problemUnderstanding).toBe(mockParsedFourQuadrant.problemUnderstanding);
      expect(data.bruteForceApproach).toBe(mockParsedFourQuadrant.bruteForceApproach);
      expect(data.optimalSolutionPseudocode).toBe(mockParsedFourQuadrant.optimalSolutionPseudocode);
      expect(data.optimalSolutionImplementation.code).toBe(mockParsedFourQuadrant.optimalSolutionImplementation.code);
      expect(data.optimalSolutionImplementation.timeComplexity).toBe(mockParsedFourQuadrant.optimalSolutionImplementation.timeComplexity);
      expect(data.optimalSolutionImplementation.spaceComplexity).toBe(mockParsedFourQuadrant.optimalSolutionImplementation.spaceComplexity);
      expect(data.optimalSolutionImplementation.thinkingProcess).toBe(mockParsedFourQuadrant.optimalSolutionImplementation.thinkingProcess);
    } else {
      // Fail the test if the data structure is not FourQuadrantData
      console.error("Expected FourQuadrantData, but received:", data);
      expect(data).toBeDefined();
      expect(isFourQuadrantData(data)).toBe(true);
    }
  });

  it('should fallback to standard solution if multi-prompt approach fails', async () => {
    // Set up mocks to simulate failure in the four-quadrant approach
    vi.mocked(aiService.generateCompletion)
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce('Standard solution response');
      
    const mockStandardResponse: BasicSolutionData = {
      code: 'standard code',
      thoughts: ['thought 1', 'thought 2'],
      time_complexity: 'O(n log n)',
      space_complexity: 'O(n)',
      dryRunVisualization: 'Standard solution dry run: Initialize numMap={}, i=0, num=2, complement=7, add to map, i=1, num=7, complement=2, found in map, return [0,1]'
    };
    vi.mocked(responseParser.parseStandardSolutionResponse)
      .mockReturnValue(mockStandardResponse);
    
    const result = await solutionProcessor.generateSolutions(
      mockProblemInfo,
      'javascript',
      mockMainWindow as BrowserWindow,
      mockAbortSignal
    );
    
    // Debug logging
    console.log("Fallback solution result:", result.data);
    const data = result.data;
    expect(data).toBeDefined();

    // Use type guard to check the structure
    if (data && isBasicSolution(data)) {
      console.log("Fallback solution dry run:", data.dryRunVisualization ?? 'Not available');
      
      // Verify success despite initial failure
      expect(result.success).toBe(true);
      
      // Verify fallback API call
      expect(aiService.generateCompletion).toHaveBeenCalledTimes(2);
      expect(responseParser.parseStandardSolutionResponse).toHaveBeenCalledTimes(1);
      
      // Assertions for BasicSolutionData
      expect(data).toHaveProperty('code', mockStandardResponse.code);
      expect(data).toHaveProperty('thoughts', mockStandardResponse.thoughts);
      expect(data).toHaveProperty('time_complexity', mockStandardResponse.time_complexity);
      expect(data).toHaveProperty('space_complexity', mockStandardResponse.space_complexity);
      expect(data).toHaveProperty('dryRunVisualization', mockStandardResponse.dryRunVisualization);
    } else {
      // Fail the test if the data structure is not as expected
      console.error("Expected BasicSolutionData after fallback, but received:", data);
      expect(data).toBeDefined();
      expect(isBasicSolution(data)).toBe(true);
    }
  });
}); 