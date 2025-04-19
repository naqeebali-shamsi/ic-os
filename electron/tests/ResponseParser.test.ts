import { describe, it, expect } from 'vitest';
import { responseParser } from '../ResponseParser';

describe('ResponseParser', () => {
  describe('parseBruteForceResponse', () => {
    it('should extract code, complexity information, and dry run visualization from brute force response', () => {
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

Dry Run & Visualization:
Let's trace this on the example input: nums = [2, 7, 11, 15], target = 9

Iteration 1: i = 0, nums[i] = 2
  Iteration 1.1: j = 1, nums[j] = 7, 2 + 7 = 9 == target, return [0, 1]

Table visualization:
| Iteration | i | j | nums[i] | nums[j] | Sum | Return |
|-----------|---|---|---------|---------|-----|--------|
| 1         | 0 | 1 | 2       | 7       | 9   | [0, 1] |

Time complexity: O(n²) because we have nested loops where we check each pair of elements in the array.

Space complexity: O(1) because we only use a constant amount of extra space regardless of input size.
`;

      console.log("Testing brute force response with dry run visualization");
      const result = responseParser.parseBruteForceResponse(mockResponse);
      
      console.log("Dry run visualization result:", result.dryRunVisualization);
      
      expect(result.code).toContain('function twoSum(nums, target)');
      expect(result.timeComplexity).toBe('O(n²)');
      expect(result.spaceComplexity).toBe('O(1)');
      expect(result.complexityRationale).toContain('because we have nested loops');
      expect(result.dryRunVisualization).toBeDefined();
      expect(result.dryRunVisualization).toContain('Let\'s trace this on the example input');
      expect(result.dryRunVisualization).toContain('Table visualization:');
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
    it('should extract optimization analysis, code, dry run visualization and complexity from optimized response', () => {
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

Dry Run & Visualization:
Let's trace this with example: nums = [2, 7, 11, 15], target = 9

Iteration 1: i=0, nums[i]=2, complement=7, numMap={}, 7 not in numMap, add 2 to numMap
numMap = {2: 0}

Iteration 2: i=1, nums[i]=7, complement=2, numMap={2: 0}, 2 is in numMap, return [0, 1]

numMap visualization:
| Iteration | i | nums[i] | complement | numMap       | Return  |
|-----------|---|---------|------------|--------------|---------|
| 1         | 0 | 2       | 7          | {}           | -       |
| end of 1  | 0 | 2       | 7          | {2: 0}       | -       |
| 2         | 1 | 7       | 2          | {2: 0}       | [0, 1]  |

Time Complexity: O(n) because we only need to iterate through the array once and hash lookups are O(1).

Space Complexity: O(n) in the worst case we might need to store all elements in the hashmap.
`;

      console.log("Testing optimized response with dry run visualization");
      const result = responseParser.parseOptimizedResponse(mockResponse);
      
      console.log("Optimization Analysis:", result.optimizationAnalysis);
      console.log("Dry run visualization result:", result.dryRunVisualization);
      
      expect(result.optimizationAnalysis.length).toBeGreaterThan(0);
      expect(result.optimizationAnalysis.some(item => item.includes('hashmap'))).toBe(true);
      expect(result.code).toContain('function twoSum(nums, target)');
      expect(result.code).toContain('const numMap = {}');
      expect(result.timeComplexity).toBe('O(n)');
      expect(result.spaceComplexity).toBe('O(n)');
      expect(result.complexityRationale).toContain('because we only need to iterate through the array once');
      expect(result.dryRunVisualization).toBeDefined();
      expect(result.dryRunVisualization).toContain('Let\'s trace this with example');
      expect(result.dryRunVisualization).toContain('numMap visualization:');
    });
  });
  
  describe('parseStandardSolutionResponse', () => {
    it('should extract a complete solution with dry run visualization from a standard response', () => {
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

Dry Run & Visualization:
Let's trace the execution with nums = [2, 7, 11, 15], target = 9:

1. Initialize num_map = {}
2. i=0, num=2, complement=7, 7 not in num_map, add num_map[2] = 0
3. i=1, num=7, complement=2, 2 is in num_map, return [0, 1]

| Step | i | num | complement | num_map | Return |
|------|---|-----|------------|---------|--------|
| 1    | - | -   | -          | {}      | -      |
| 2    | 0 | 2   | 7          | {2: 0}  | -      |
| 3    | 1 | 7   | 2          | {2: 0}  | [0, 1] |

Time complexity: O(n) because we iterate through the array once and hash lookups are O(1).

Space complexity: O(n) because in the worst case, we might need to store all elements in the hashmap.
`;

      console.log("Testing standard response with dry run visualization");
      const result = responseParser.parseStandardSolutionResponse(mockResponse);
      
      console.log("Dry run visualization result:", result.dryRunVisualization);
      
      expect(result.code).toContain('def two_sum(nums, target):');
      expect(result.thoughts.length).toBeGreaterThan(0);
      expect(result.thoughts[0]).toContain('Use a hashmap');
      expect(result.time_complexity).toContain('O(n)');
      expect(result.space_complexity).toContain('O(n)');
      expect(result.dryRunVisualization).toBeDefined();
      expect(result.dryRunVisualization).toContain('Let\'s trace the execution');
      expect(result.dryRunVisualization).toContain('| Step | i | num | complement |');
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
      expect(result.thoughts.length).toBeGreaterThan(0);
      expect(result.thoughts[0]).toBe('- The loop condition is incorrect, causing an off-by-one error');
    });
  });
}); 