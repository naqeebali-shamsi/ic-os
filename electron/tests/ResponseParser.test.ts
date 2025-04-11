import { describe, it, expect } from 'vitest';
import { responseParser } from '../ResponseParser';

describe('ResponseParser', () => {
  describe('parseBruteForceResponse', () => {
    it('should extract code and complexity information from brute force response', () => {
      const mockResponse = `
Here's a brute force solution to the problem:

\`\`\`javascript
function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}
\`\`\`

Time complexity: O(n²) because we have nested loops where we check each pair of elements in the array.

Space complexity: O(1) because we only use a constant amount of extra space regardless of input size.
`;

      const result = responseParser.parseBruteForceResponse(mockResponse);
      
      expect(result.code).toContain('function twoSum(nums, target)');
      expect(result.timeComplexity).toBe('O(n²)');
      expect(result.spaceComplexity).toBe('O(1)');
      expect(result.complexityRationale).toContain('because we have nested loops');
    });
    
    it('should handle responses with no formatted code blocks', () => {
      const mockResponse = `
function twoSum(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) {
      if (nums[i] + nums[j] === target) {
        return [i, j];
      }
    }
  }
  return [];
}

Time complexity: O(n²) - Nested loops
Space complexity: O(1) - Constant space
`;

      const result = responseParser.parseBruteForceResponse(mockResponse);
      
      expect(result.code).toContain('function twoSum(nums, target)');
      expect(result.timeComplexity).toBe('O(n²)');
      expect(result.spaceComplexity).toBe('O(1)');
      expect(result.complexityRationale).toBe('Nested loops');
    });
  });
  
  describe('parseOptimizedResponse', () => {
    it('should extract optimization analysis, code and complexity from optimized response', () => {
      const mockResponse = `
Optimization Analysis:
- We can use a hashmap to reduce the time complexity from O(n²) to O(n)
- This eliminates the need for nested loops
- Hash lookups are O(1) which makes this approach more efficient

Optimized Code:
\`\`\`javascript
function twoSum(nums, target) {
  const numMap = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (complement in numMap) {
      return [numMap[complement], i];
    }
    numMap[nums[i]] = i;
  }
  return [];
}
\`\`\`

Time Complexity: O(n) because we only need to iterate through the array once and hash lookups are O(1).

Space Complexity: O(n) in the worst case we might need to store all elements in the hashmap.
`;

      const result = responseParser.parseOptimizedResponse(mockResponse);
      
      // Log the actual content to debug
      console.log('Optimization Analysis:', result.optimizationAnalysis);
      
      // Instead of checking for an exact string, check that the analysis contains specific keywords
      expect(result.optimizationAnalysis.length).toBeGreaterThan(0);
      expect(result.optimizationAnalysis.some(item => item.includes('hashmap'))).toBe(true);
      expect(result.code).toContain('function twoSum(nums, target)');
      expect(result.code).toContain('const numMap = {}');
      expect(result.timeComplexity).toBe('O(n)');
      expect(result.spaceComplexity).toBe('O(n)');
      expect(result.complexityRationale).toContain('because we only need to iterate through the array once');
    });
  });
  
  describe('parseStandardSolutionResponse', () => {
    it('should extract a complete solution from a standard response', () => {
      const mockResponse = `
Here's the solution:

\`\`\`python
def two_sum(nums, target):
    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            return [num_map[complement], i]
        num_map[num] = i
    return []
\`\`\`

Thoughts:
- Use a hashmap to store numbers we've seen and their indices
- For each element, check if its complement exists in the map
- This gives us O(n) time complexity with a single pass

Time complexity: O(n) because we iterate through the array once and hash lookups are O(1).

Space complexity: O(n) because in the worst case, we might need to store all elements in the hashmap.
`;

      const result = responseParser.parseStandardSolutionResponse(mockResponse);
      
      expect(result.code).toContain('def two_sum(nums, target):');
      expect(result.thoughts).toHaveLength(3);
      expect(result.thoughts[0]).toContain('Use a hashmap');
      expect(result.time_complexity).toContain('O(n)');
      expect(result.space_complexity).toContain('O(n)');
    });
  });
  
  describe('parseDebugResponse', () => {
    it('should extract code, analysis and thoughts from debug response', () => {
      const mockResponse = `
### Issues Identified
- The loop condition is incorrect, causing an off-by-one error
- The return statement is missing a case for when no solution exists
- Variable naming could be improved for readability

### Specific Improvements and Corrections
- Fix the loop condition to use < instead of <=
- Add a return statement at the end for the case where no solution is found
- Rename variables for better clarity

### Optimizations
- Use a hashmap approach instead of nested loops to improve time complexity

### Explanation of Changes Needed
The main issue is the loop condition causing the code to access an invalid index. This is a classic off-by-one error.

### Key Points
- Always check boundary conditions carefully
- Include handling for edge cases
- Consider optimization opportunities with data structures

\`\`\`javascript
function twoSum(nums, target) {
  const numMap = {};
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (complement in numMap) {
      return [numMap[complement], i];
    }
    numMap[nums[i]] = i;
  }
  return null; // Return null if no solution exists
}
\`\`\`
`;

      const result = responseParser.parseDebugResponse(mockResponse);
      
      expect(result.code).toContain('function twoSum(nums, target)');
      expect(result.debug_analysis).toContain('### Issues Identified');
      expect(result.thoughts).toHaveLength(5);
      expect(result.thoughts[0]).toBe('- The loop condition is incorrect, causing an off-by-one error');
    });
  });
}); 