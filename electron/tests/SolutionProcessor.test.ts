import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { solutionProcessor } from '../SolutionProcessor';
import { aiService } from '../AIService';
import { responseParser, BasicSolutionData, DetailedSolutionData, NarrativeSolutionData, ProblemExample } from '../ResponseParser';
import { BrowserWindow } from 'electron';
import { getNarrativeSolutionPrompt, getFallbackPrompt } from '../../prompts';

// Mock dependencies
vi.mock('../AIService', () => ({
  aiService: {
    generateCompletion: vi.fn()
  }
}));

vi.mock('../ResponseParser', () => ({
  responseParser: {
    parseStandardSolutionResponse: vi.fn(),
    parseNarrativeResponse: vi.fn()
  }
}));

// Mock the prompt function
vi.mock('../../prompts', async (importOriginal) => {
  const actual = await importOriginal() as any; // Import actual module
  return {
    getNarrativeSolutionPrompt: vi.fn(),
    getFallbackPrompt: vi.fn(),
  };
});

// Type guards
function isDetailedSolution(data: BasicSolutionData | DetailedSolutionData | NarrativeSolutionData): data is DetailedSolutionData {
  return data && typeof data === 'object' && 'bruteForceCode' in data;
}

function isBasicSolution(data: BasicSolutionData | DetailedSolutionData | NarrativeSolutionData): data is BasicSolutionData {
  return data && typeof data === 'object' && 'thoughts' in data;
}

// NEW type guard for NarrativeSolutionData
function isNarrativeSolutionData(data: BasicSolutionData | DetailedSolutionData | NarrativeSolutionData): data is NarrativeSolutionData {
  return data && typeof data === 'object' && 'problemAnalysis' in data && 'optimalImplementation' in data;
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

  const mockAbortSignal = { aborted: false } as AbortSignal;
  const mockMainWindow: Partial<BrowserWindow> = {
    webContents: {
      send: vi.fn()
    } as any
  };

  // NEW Mock for NarrativeSolutionData response
  const mockNarrativeApiResponse = 'Narrative API response';
  const mockParsedNarrative: NarrativeSolutionData = {
    problemAnalysis: 'Parsed problem analysis.',
    bruteForce: {
      explanation: 'Parsed brute force explanation.',
      codeOrPseudocode: 'brute force code/pseudo',
      timeComplexity: 'O(n^2)',
      spaceComplexity: 'O(1)',
      inefficiencyReason: 'Parsed inefficiency reason.'
    },
    optimizationStrategy: {
      explanation: 'Parsed optimization strategy explanation.',
      pseudocode: 'optimal pseudocode',
      timeComplexity: 'O(n)',
      spaceComplexity: 'O(n)'
    },
    optimalImplementation: {
      code: 'parsed optimal code',
      dryRun: 'parsed dry run'
    }
  };
  
  // Mock for the prompt function result
  const mockNarrativePromptResult = {
    promptText: 'narrative prompt text',
    systemPrompt: 'narrative system prompt'
  };

  // Add dummy confirmed data for narrative test
  const mockConfirmedUnderstanding = "The user confirmed this understanding.";
  const mockConfirmedExamples: ProblemExample[] = [
    { input: "test1", output: "out1" },
    { input: "test2", output: "out2", explanation: "expl2" }
  ];

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

    // Default mock for the NEW narrative path
    vi.mocked(getNarrativeSolutionPrompt).mockReturnValue(mockNarrativePromptResult);
    vi.mocked(aiService.generateCompletion).mockResolvedValue(mockNarrativeApiResponse);
    vi.mocked(responseParser.parseNarrativeResponse).mockReturnValue(mockParsedNarrative);

    // Mock fallback prompt if needed for fallback test
    vi.mocked(getFallbackPrompt).mockReturnValue({ promptText: 'fallback prompt', systemPrompt: 'fallback system' });
    vi.mocked(responseParser.parseStandardSolutionResponse).mockReturnValue({ 
      code: 'fallback code', thoughts: [], time_complexity: 'O(n)', space_complexity: 'O(1)' 
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should generate a complete narrative solution', async () => {
    const result = await solutionProcessor.generateSolutions(
      mockProblemInfo,
      'javascript',
      mockMainWindow as BrowserWindow,
      mockAbortSignal,
      mockConfirmedUnderstanding,
      mockConfirmedExamples
    );

    // Verify success
    expect(result.success).toBe(true);

    // Verify mocks were called correctly
    expect(getNarrativeSolutionPrompt).toHaveBeenCalledWith(
      'javascript', 
      mockProblemInfo, 
      mockConfirmedUnderstanding,
      mockConfirmedExamples
    );
    expect(aiService.generateCompletion).toHaveBeenCalledWith(
      mockNarrativePromptResult.promptText,
      mockNarrativePromptResult.systemPrompt,
      undefined,
      mockAbortSignal
    );
    expect(responseParser.parseNarrativeResponse).toHaveBeenCalledWith(mockNarrativeApiResponse);

    // Check the data structure
    const data = result.data;
    expect(data).toBeDefined();

    // Use the NEW type guard
    if (data && isNarrativeSolutionData(data)) {
      // Assertions for NarrativeSolutionData
      expect(data.problemAnalysis).toBe(mockParsedNarrative.problemAnalysis);
      expect(data.bruteForce.explanation).toBe(mockParsedNarrative.bruteForce.explanation);
      expect(data.bruteForce.codeOrPseudocode).toBe(mockParsedNarrative.bruteForce.codeOrPseudocode);
      // ... add assertions for all fields in NarrativeSolutionData
      expect(data.optimalImplementation.code).toBe(mockParsedNarrative.optimalImplementation.code);
      expect(data.optimalImplementation.dryRun).toBe(mockParsedNarrative.optimalImplementation.dryRun);
    } else {
      // Fail the test if the data structure is not NarrativeSolutionData
      console.error("Expected NarrativeSolutionData, but received:", data); // Log error for debugging
      expect(isNarrativeSolutionData(data)).toBe(true); // Add explicit assertion
    }
  });

  it('should fallback to standard solution if narrative approach fails', async () => {
    // Set up mocks to simulate failure in the narrative approach
    vi.mocked(getNarrativeSolutionPrompt).mockReturnValue(mockNarrativePromptResult); // Still need prompt
    vi.mocked(aiService.generateCompletion)
      .mockRejectedValueOnce(new Error('API Error')) // First call (narrative) fails
      .mockResolvedValueOnce('Standard solution response'); // Second call (fallback) succeeds

    // Rerun the generateSolutions call, now expecting fallback
    const result = await solutionProcessor.generateSolutions(
      mockProblemInfo,
      'javascript',
      mockMainWindow as BrowserWindow,
      mockAbortSignal,
      mockConfirmedUnderstanding,
      mockConfirmedExamples
    );

    expect(result.success).toBe(true); // Fallback should succeed
    expect(getNarrativeSolutionPrompt).toHaveBeenCalledTimes(1); // Called once
    expect(getFallbackPrompt).toHaveBeenCalledTimes(1); // Fallback prompt called
    expect(aiService.generateCompletion).toHaveBeenCalledTimes(2); // Narrative failed, fallback called
    expect(responseParser.parseNarrativeResponse).not.toHaveBeenCalled(); // Narrative parse not called
    expect(responseParser.parseStandardSolutionResponse).toHaveBeenCalledTimes(1); // Fallback parse called

    // Check data is basic solution
    expect(isBasicSolution(result.data)).toBe(true);
    expect(result.data).toHaveProperty('code', 'fallback code');
  });
}); 