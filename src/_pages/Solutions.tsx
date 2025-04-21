// Solutions.tsx
import React, { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"
import ReactMarkdown from 'react-markdown'
// Import Card components from shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card" 
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

import ScreenshotQueue from "../components/Queue/ScreenshotQueue"

import { ProblemStatementData } from "../types/solutions"
import SolutionCommands from "../components/Solutions/SolutionCommands"
import Debug from "./Debug"
import { useToast } from "../contexts/toast"
import { COMMAND_KEY } from "../utils/platform"
// Import the new data type
import { FourQuadrantData } from "../../electron/ResponseParser" // Adjust path if necessary

export const ContentSection = ({
  title,
  content,
  isLoading
}: {
  title: string
  content: React.ReactNode
  isLoading: boolean
}) => (
  <div className="space-y-2">
    <h2 className="text-[13px] font-bold text-foreground tracking-wide">
      {title}
    </h2>
    {isLoading ? (
      <div className="mt-4 flex">
        <p className="text-xs bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 bg-clip-text text-transparent animate-pulse">
          Extracting problem statement...
        </p>
      </div>
    ) : (
      <div className="text-[13px] leading-[1.4] text-foreground max-w-[600px]">
        {content}
      </div>
    )}
  </div>
)
const SolutionSection = ({
  title,
  content,
  isLoading,
  currentLanguage
}: {
  title: string
  content: React.ReactNode
  isLoading: boolean
  currentLanguage: string
}) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    if (typeof content === "string") {
      navigator.clipboard.writeText(content).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  return (
    <div className="space-y-2 relative">
      <h2 className="text-[13px] font-bold text-foreground tracking-wide">
        {title}
      </h2>
      {isLoading ? (
        <div className="space-y-1.5">
          <div className="mt-4 flex">
            <p className="text-xs bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 bg-clip-text text-transparent animate-pulse">
              Loading solutions...
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full relative">
          <button
            onClick={copyToClipboard}
            className="absolute top-2 right-2 text-xs text-foreground bg-black/10 hover:bg-black/20 rounded px-2 py-1 transition"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <SyntaxHighlighter
            showLineNumbers
            language={currentLanguage == "golang" ? "go" : currentLanguage}
            style={dracula}
            customStyle={{
              maxWidth: "100%",
              margin: 0,
              padding: "1rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              backgroundColor: "rgba(22, 27, 34, 0.5)"
            }}
            wrapLongLines={true}
          >
            {content as string}
          </SyntaxHighlighter>
        </div>
      )}
    </div>
  )
}

export const ComplexitySection = ({
  title = "Complexity",
  timeComplexity,
  spaceComplexity,
  isLoading
}: {
  title?: string;
  timeComplexity: string | null;
  spaceComplexity: string | null;
  isLoading: boolean;
}) => {
  // Helper to ensure we have proper complexity values
  const formatComplexity = (complexity: string | null): string => {
    // Default if no complexity returned by LLM
    if (!complexity || complexity.trim() === "") {
      return "Complexity not available";
    }

    const bigORegex = /O\([^)]+\)/i;
    // Return the complexity as is if it already has Big O notation
    if (bigORegex.test(complexity)) {
      return complexity;
    }
    
    // Concat Big O notation to the complexity
    return `O(${complexity})`;
  };
  
  const formattedTimeComplexity = formatComplexity(timeComplexity);
  const formattedSpaceComplexity = formatComplexity(spaceComplexity);
  
  return (
    <div className="space-y-2">
      <h2 className="text-[13px] font-bold text-foreground tracking-wide">
        {title}
      </h2>
      {isLoading ? (
        <p className="text-xs bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 bg-clip-text text-transparent animate-pulse">
          Calculating complexity...
        </p>
      ) : (
        <div className="space-y-3">
          <div className="text-[13px] leading-[1.4] text-foreground bg-black/5 rounded-md p-3">
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
              <div>
                <strong>Time:</strong> {formattedTimeComplexity}
              </div>
            </div>
          </div>
          <div className="text-[13px] leading-[1.4] text-foreground bg-black/5 rounded-md p-3">
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
              <div>
                <strong>Space:</strong> {formattedSpaceComplexity}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// New DryRunSection component
export const DryRunSection = ({
  title = "Dry Run & Visualization",
  dryRunVisualization,
  isLoading
}: {
  title?: string;
  dryRunVisualization: string | null | undefined;
  isLoading: boolean;
}) => {
  // Debug logging
  console.log("DryRunSection rendering with:", { title, dryRunVisualization, isLoading });

  return (
    <div className="space-y-2">
      <h2 className="text-[13px] font-bold text-foreground tracking-wide">
        {title}
      </h2>
      {isLoading ? (
        <p className="text-xs bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 bg-clip-text text-transparent animate-pulse">
          Generating visualization...
        </p>
      ) : dryRunVisualization ? (
        <div className="text-[13px] leading-[1.4] text-foreground bg-black/5 rounded-md p-3 prose prose-sm prose-invert max-w-none">
          {/* Use ReactMarkdown to render the content */}
          <ReactMarkdown>{dryRunVisualization}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-[13px] leading-[1.4] text-muted-foreground bg-black/5 rounded-md p-3">
          No visualization available
        </div>
      )}
    </div>
  )
}

// New RawResponseSection component to display markdown
export const RawResponseSection = ({
  title,
  content,
  isLoading
}: {
  title: string;
  content: string | null | undefined;
  isLoading: boolean;
}) => {
  console.log("RawResponseSection rendering with:", { title, content: content?.substring(0, 100) });
  
  return (
    <div className="space-y-2">
      <h2 className="text-[13px] font-bold text-foreground tracking-wide">
        {title}
      </h2>
      {isLoading ? (
        <p className="text-xs bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 bg-clip-text text-transparent animate-pulse">
          Loading response...
        </p>
      ) : content ? (
        <div className="text-[13px] leading-[1.4] text-foreground bg-black/5 rounded-md p-3 whitespace-pre-wrap">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-[13px] leading-[1.4] text-muted-foreground bg-black/5 rounded-md p-3">
          No response available
        </div>
      )}
    </div>
  )
}

// Helper function to extract the dry run section from raw markdown
const extractDryRunSectionFromMarkdown = (markdown: string): string => {
  // Try to extract the section between "Dry Run & Visualization" (or similar) and the next heading
  const dryRunPatterns = [
    /Dry Run & Visualization:?([\s\S]*?)(?:##|\n#|\nTime Complexity|\nSpace Complexity|$)/i,
    /Dry Run:?([\s\S]*?)(?:##|\n#|\nTime Complexity|\nSpace Complexity|$)/i,
    /Visualization:?([\s\S]*?)(?:##|\n#|\nTime Complexity|\nSpace Complexity|$)/i,
    /Trace:?([\s\S]*?)(?:##|\n#|\nTime Complexity|\nSpace Complexity|$)/i,
    /Walk-through:?([\s\S]*?)(?:##|\n#|\nTime Complexity|\nSpace Complexity|$)/i
  ];
  
  console.log("Extracting dry run from raw markdown of length:", markdown.length);
  
  // Try each pattern
  for (const pattern of dryRunPatterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      console.log("Found dry run section with pattern:", pattern);
      return match[1].trim();
    }
  }
  
  console.log("No specific dry run section found, returning a portion of the full response");
  // If no dry run section is found, return a portion of the full markdown
  return "```\n" + markdown.substring(0, 2000) + "\n... (truncated)\n```";
}

// --- Reusable Quadrant Component --- 
const QuadrantCard = ({
  title,
  content,
  isLoading,
  isCode = false,
  language = 'text'
}: {
  title: string
  content: string | null | undefined
  isLoading: boolean
  isCode?: boolean
  language?: string
}) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    if (typeof content === "string" && content) {
      navigator.clipboard.writeText(content).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  const renderContent = () => {
    if (isLoading) {
      return (
        <p className="text-xs bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 bg-clip-text text-transparent animate-pulse">
          Loading {title.toLowerCase()}...
        </p>
      )
    }
    if (!content) {
      return <p className="text-sm text-gray-400">No {title.toLowerCase()} available.</p>
    }
    if (isCode) {
      return (
        <div className="relative w-full">
          <button
            onClick={copyToClipboard}
            className="absolute top-2 right-2 text-xs text-foreground bg-black/10 hover:bg-black/20 rounded px-2 py-1 transition z-10"
            disabled={!content}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <SyntaxHighlighter
            showLineNumbers
            language={language === "golang" ? "go" : language}
            style={dracula}
            customStyle={{
              maxWidth: "100%",
              margin: 0,
              padding: "1rem",
              paddingTop: "2.5rem", // Add padding top to avoid overlap with button
              fontSize: "13px",
              lineHeight: "1.4",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              backgroundColor: "rgba(22, 27, 34, 0.5)",
              borderRadius: "0.375rem" // Match card border radius
            }}
            wrapLongLines={true}
          >
            {content as string}
          </SyntaxHighlighter>
        </div>
      )
    } else {
      return (
        <div className="text-[13px] leading-[1.4] text-foreground prose prose-sm prose-invert max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )
    }
  }

  return (
    <Card className="bg-card/70 border-border/40 flex flex-col h-full">
      <CardHeader className="p-3">
        <CardTitle className="text-sm font-bold text-foreground tracking-tight">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto p-4">
        {renderContent()}
      </CardContent>
    </Card>
  )
}

// --- Main Solutions Component --- 
export interface SolutionsProps {
  setView: (view: "queue" | "solutions" | "debug") => void
  credits: number
  currentLanguage: string
  setLanguage: (language: string) => void
}

const Solutions: React.FC<SolutionsProps> = ({
  setView,
  credits,
  currentLanguage,
  setLanguage
}) => {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [solutionData, setSolutionData] = useState<FourQuadrantData | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Start loading initially
  const [problemStatement, setProblemStatement] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("problem")
  const [rawAiResponse, setRawAiResponse] = useState<string | null>(null) // Store raw response
  const [followUpQuestion, setFollowUpQuestion] = useState("") // State for follow-up input
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false) // Loading state for follow-up
  const [followUpAnswer, setFollowUpAnswer] = useState<string | null>(null) // State for follow-up answer
  const latestJobIdRef = useRef<string | null>(null) // Ref to track the latest job ID
  
  // Use refs to keep track of listeners to prevent duplicates
  const listenersAttached = useRef(false)
  const solutionListenerCleanup = useRef<(() => void) | null>(null)
  const problemListenerCleanup = useRef<(() => void) | null>(null)
  const errorListenerCleanup = useRef<(() => void) | null>(null)
  const statusListenerCleanup = useRef<(() => void) | null>(null)

  // Fetch initial data (like problem statement if available) and set up listeners
  useEffect(() => {
    
    // Function to fetch initial problem statement
    const fetchInitialProblemStatement = async () => {
       const initialProblemData = await queryClient.getQueryData<any>(["problem_statement"])
       if (initialProblemData && initialProblemData.problem_statement) {
          setProblemStatement(initialProblemData.problem_statement)
       }
    }
    fetchInitialProblemStatement()
    
    // Only attach listeners once
    if (!listenersAttached.current) {
        console.log("Attaching IPC listeners for Solutions view");
        
        solutionListenerCleanup.current = window.electronAPI.onSolutionSuccess((data: FourQuadrantData) => {
          console.log("Received SOLUTION_SUCCESS data:", data);
          setSolutionData(data)
          setIsLoading(false)
          // Optionally update query cache if needed, but useState is primary for this view now
          // queryClient.setQueryData(['solution'], data); 
        });

        problemListenerCleanup.current = window.electronAPI.onProblemExtracted((data: any) => {
            // This might still be useful for showing problem statement before solution arrives
            if (data && data.problem_statement) {
              setProblemStatement(data.problem_statement)
              queryClient.setQueryData(["problem_statement"], data)
            }
        });

        errorListenerCleanup.current = window.electronAPI.onSolutionError((error: string) => {
            console.error("Received SOLUTION_ERROR:", error);
            showToast("Solution Error", error, "error")
            setIsLoading(false) // Stop loading on error
            setView("queue") // Go back to queue on error maybe?
        });

        statusListenerCleanup.current = window.electronAPI.onProcessingStatus((status: any) => {
            console.log("Processing Status:", status);
            // Potentially display status message somewhere?
            // For now, just ensure loading state is true if we receive a start message
            if (!solutionData) { // Only set loading if we don't have data yet
                 setIsLoading(true);
            }
        });
        
        listenersAttached.current = true;
    }

    // Cleanup function
    return () => {
      if (listenersAttached.current) {
         console.log("Cleaning up IPC listeners for Solutions view");
         solutionListenerCleanup.current?.();
         problemListenerCleanup.current?.();
         errorListenerCleanup.current?.();
         statusListenerCleanup.current?.();
         listenersAttached.current = false; // Reset flag on unmount
      }
    }
    // Rerun only if dependencies like setView change (which they shouldn't often)
  }, [queryClient, showToast, setView]); 

  // ... (rest of the component, like handleRunDebug, etc.)
  const handleRunDebug = () => {
    window.electronAPI.runDebug()
  }
  
  const handleBackToQueue = () => {
    setView("queue")
    window.electronAPI.cancelOngoingRequests() // Cancel if going back
  }

  const handleFollowUpSubmit = async () => {
    console.log("Follow-up submitted:", followUpQuestion);
    setFollowUpAnswer(null); // Clear previous answer
    setIsFollowUpLoading(true);

    try {
      const result = await window.electronAPI.processFollowUpQuestion({
        previousResponse: rawAiResponse, // Pass the raw response as context
        question: followUpQuestion,
        language: currentLanguage
      });

      console.log("Follow-up response received:", result);

      if (result && result.answer) {
        setFollowUpAnswer(result.answer);
      } else if (result && result.error) {
        showToast({
          title: "Follow-up Error",
          message: result.error,
          type: "error"
        });
      } else {
         showToast({
          title: "Follow-up Error",
          message: "Received an unexpected response from the backend.",
          type: "error"
        });
      }
    } catch (error: any) {
      console.error("Error calling processFollowUpQuestion:", error);
      showToast({
        title: "Follow-up Request Failed",
        message: error.message || "An unknown error occurred.",
        type: "error"
      });
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  // Early return if no data yet AND not loading - represents an empty initial state or error state where nothing loaded
  if (!solutionData && !isLoading) {
    // This block should probably show a specific message like "Waiting for processing..." or handle the error case explicitly.
    // For now, returning a minimal structure or null might be okay, but the main content shouldn't be here.
    // Let's just return the header and a placeholder message.
     return (
      <div className="p-4 bg-transparent space-y-4 flex flex-col max-h-screen overflow-y-auto">
        <SolutionCommands
          setView={setView}
          credits={credits}
          currentLanguage={currentLanguage}
          setLanguage={setLanguage}
          onBack={handleBackToQueue}
          onDebug={handleRunDebug} // Debug might not make sense here
        />
        <div className="flex-grow flex items-center justify-center">
           <p className="text-gray-400">Waiting for solution data...</p> 
        </div>
      </div>
     );
  } // End of early return

  // Main component render logic when loading OR when solutionData is available
  return (
    <div className="p-4 bg-transparent space-y-4 flex flex-col max-h-screen overflow-y-auto">
      {/* Header/Commands Section */}
      <SolutionCommands
        setView={setView}
        credits={credits}
        currentLanguage={currentLanguage}
        setLanguage={setLanguage}
        onBack={handleBackToQueue}
        onDebug={handleRunDebug}
      />

      {/* Vertical Section Layout */}
      <div className="flex flex-col gap-4"> {/* Changed from grid to flex-col */}
        {/* Section 1: Problem Understanding */}
        <QuadrantCard 
          title="1. Problem Understanding" 
          content={solutionData?.problemUnderstanding} 
          isLoading={isLoading}
        />

        {/* Section 2: Brute Force Approach */}
        <QuadrantCard 
          title="2. Brute Force Approach" 
          content={solutionData?.bruteForceApproach} 
          isLoading={isLoading}
        />

        {/* Section 3: Optimal Solution Pseudocode */}
        <QuadrantCard 
          title="3. Optimal Solution Pseudocode" 
          content={solutionData?.optimalSolutionPseudocode} 
          isLoading={isLoading}
        />

        {/* Section 4: Optimal Solution Code */}
        <QuadrantCard
          title="4. Optimal Solution Code"
          content={solutionData?.optimalSolutionImplementation?.code}
          isLoading={isLoading}
          isCode={true}
          language={currentLanguage}
        />
      </div>
      
       {/* Optional: Display Complexity and Thinking Process below the main sections */}
       {!isLoading && solutionData?.optimalSolutionImplementation && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-700">
                 <QuadrantCard
                    title="Optimal Time/Space Complexity"
                    isLoading={false}
                    content={`**Time:** ${solutionData.optimalSolutionImplementation.timeComplexity || 'N/A'}\n**Space:** ${solutionData.optimalSolutionImplementation.spaceComplexity || 'N/A'}`}
                 />
                 <QuadrantCard
                    title="Thinking Process & Constraints"
                    isLoading={false}
                    content={solutionData.optimalSolutionImplementation.thinkingProcess}
                 />
            </div>
       )}

      {/* Keep ScreenshotQueue for debugging? Or remove? */}
      {/* <div className="mt-4 border-t border-gray-700 pt-4">
        <h3 className="text-sm font-medium text-white mb-2">Screenshot Queue (Debug View)</h3>
        <ScreenshotQueue view="solutions" setView={setView} />
      </div> */}
      
      {/* Follow-up Question Section - Now correctly placed in the main return block */}
      {solutionData && !isLoading && (
        <div className="mt-6 p-4 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-3">Ask a Follow-up Question</h3>
          <Textarea
            placeholder="Type your question about the solution here..."
            value={followUpQuestion}
            onChange={(e) => setFollowUpQuestion(e.target.value)}
            className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 mb-3"
            rows={3}
          />
          <Button
            onClick={handleFollowUpSubmit}
            disabled={!followUpQuestion.trim() || isFollowUpLoading} // Disable during loading too
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
          >
            {isFollowUpLoading ? "Submitting..." : "Submit Follow-up"}
          </Button>
        </div>
      )}
      
      {/* Follow-up Answer Section - Now correctly placed */}
      {isFollowUpLoading && (
        <div className="mt-4 p-4 bg-slate-800 rounded-lg border border-slate-700"><p className="text-sm text-gray-300 animate-pulse">Getting answer...</p></div>
      )}
      {followUpAnswer && !isFollowUpLoading && (
        <div className="mt-4 p-4 bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg border border-slate-600 shadow-inner">
           <h4 className="text-md font-semibold text-white mb-2">Follow-up Answer:</h4>
           <div className="text-[13px] leading-[1.4] text-gray-100 prose prose-sm prose-invert max-w-none"><ReactMarkdown>{followUpAnswer}</ReactMarkdown></div>
        </div>
      )}

    </div>
  )
}

export default Solutions
