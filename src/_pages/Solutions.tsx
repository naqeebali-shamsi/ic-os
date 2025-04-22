// Solutions.tsx
import React, { useState, useEffect, useRef, Fragment } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
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
import { NarrativeSolutionData, BasicSolutionData, ProblemUnderstandingData, ProblemExample } from "../../electron/ResponseParser" // Adjust path if necessary

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

// --- Reusable Display Components (Simplified/Adapted for Narrative Flow) ---

// Generic Section Component
const SectionCard = ({
  title,
  children,
  isLoading,
  loadingText
}: {
  title: string
  children: React.ReactNode
  isLoading: boolean
  loadingText?: string
}) => (
  <Card className="bg-card/70 border-border/40 flex flex-col">
    <CardHeader className="p-3 border-b border-border/20">
      <CardTitle className="text-sm font-bold text-foreground tracking-tight">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4 overflow-y-auto">
      {isLoading ? (
        <p className="text-xs bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 bg-clip-text text-transparent animate-pulse">
          {loadingText || `Loading ${title.toLowerCase()}...`}
        </p>
      ) : (
        children
      )}
    </CardContent>
  </Card>
)

// Markdown Content Display
const MarkdownContent = ({ content }: { content: string | undefined | null }) => {
  if (!content) return <p className="text-sm text-muted-foreground">Not available.</p>;

  // Explicitly replace literal \n with actual newlines
  const formattedContent = content.replace(/\\n/g, '\n');

  return (
    <div className="text-[13px] leading-[1.4] text-foreground prose prose-sm prose-invert max-w-none">
      {/* Pass the formatted content to ReactMarkdown */}
      {/* Keep remark-breaks plugin as it might handle other cases */}
      <ReactMarkdown remarkPlugins={[remarkBreaks]}>{formattedContent}</ReactMarkdown>
    </div>
  )
}

// Code Display with Copy Button
const CodeBlock = ({
  code,
  language
}: {
  code: string | undefined | null
  language: string
}) => {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    if (code) {
      // Replace literal \n with actual newlines before copying too?
      const codeToCopy = code.replace(/\\n/g, '\n');
      navigator.clipboard.writeText(codeToCopy).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  if (!code) return <p className="text-sm text-muted-foreground">Code not available.</p>;

  // Replace literal \n with actual newlines for display
  const formattedCode = code.replace(/\\n/g, '\n');

  return (
    <div className="relative w-full">
      <button
        onClick={copyToClipboard}
        className="absolute top-2 right-2 text-xs text-foreground bg-black/10 hover:bg-black/20 rounded px-2 py-1 transition z-10"
        disabled={!code}
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
          paddingTop: "2.5rem",
          fontSize: "13px",
          lineHeight: "1.4",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          backgroundColor: "rgba(22, 27, 34, 0.5)",
          borderRadius: "0.375rem"
        }}
        wrapLongLines={true}
      >
        {formattedCode}
      </SyntaxHighlighter>
    </div>
  )
}

// Complexity Pair Display
const ComplexityPair = ({ time, space }: { time: string | undefined | null, space: string | undefined | null }) => {
    if (!time && !space) return <p className="text-sm text-muted-foreground">Complexity not available.</p>;
    return (
        <div className="space-y-2 text-[13px] leading-[1.4] text-foreground">
            {time && <div><strong>Time:</strong> {time}</div>}
            {space && <div><strong>Space:</strong> {space}</div>}
        </div>
    )
}

// --- Main Solutions Component --- 
export interface SolutionsProps {
  setView: (view: "queue" | "solutions" | "debug") => void
  credits: number
  currentLanguage: string
  setLanguage: (language: string) => void
}

// Define type for the optimal implementation part to store history
type OptimalImplementationHistory = { code: string; dryRun: string };

const Solutions: React.FC<SolutionsProps> = ({
  setView,
  credits,
  currentLanguage,
  setLanguage
}) => {
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  // State for the main narrative solution data
  const [solutionData, setSolutionData] = useState<NarrativeSolutionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // State to hold history of optimal implementations (initial + follow-ups)
  const [optimalHistory, setOptimalHistory] = useState<OptimalImplementationHistory[]>([])
  const [followUpQuestion, setFollowUpQuestion] = useState("")
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false)
  const [followUpError, setFollowUpError] = useState<string | null>(null); // State for follow-up errors
  // Two-step flow state
  const [problemInfo, setProblemInfo] = useState<any>(null)
  const [viewStage, setViewStage] = useState<'loading'|'awaiting_confirmation'|'solving'|'solution_displayed'|'error'>('loading')
  const [understandingData, setUnderstandingData] = useState<ProblemUnderstandingData | null>(null)
  const [userClarification, setUserClarification] = useState<string>('')
  const [clarificationError, setClarificationError] = useState<string | null>(null)

  // Use refs to keep track of listeners
  const listenersAttached = useRef(false)
  const solutionListenerCleanup = useRef<(() => void) | null>(null)
  const errorListenerCleanup = useRef<(() => void) | null>(null)
  const statusListenerCleanup = useRef<(() => void) | null>(null)

  // Effect to set up IPC listeners
  useEffect(() => {
    if (!listenersAttached.current) {
      console.log("Attaching IPC listeners for Solutions view (Narrative)");

      solutionListenerCleanup.current = window.electronAPI.onSolutionSuccess((data: NarrativeSolutionData | BasicSolutionData) => {
        console.log("Received SOLUTION_SUCCESS data (Narrative Check):", data);
        // Type guard to ensure it's NarrativeSolutionData
        if (data && 'problemAnalysis' in data && 'optimalImplementation' in data) { 
          setSolutionData(data) 
          // Initialize history with the first optimal implementation
          setOptimalHistory([data.optimalImplementation]) 
          setIsLoading(false) 
        } else {
           // Handle case where fallback BasicSolutionData might be received, or unexpected structure
           console.warn("Received solution data is not in Narrative format. Displaying basic info or fallback.");
           // Potentially set a different state or show a simplified view
           setIsLoading(false); // Still stop loading
           // Maybe show a message or fallback UI here based on `BasicSolutionData`
        }
      });

      errorListenerCleanup.current = window.electronAPI.onSolutionError((error: string) => {
        console.error("Received SOLUTION_ERROR:", error);
        showToast("Solution Error", error, "error")
        setIsLoading(false)
        // Consider navigating back or showing error state
        // setView("queue") 
      });

      statusListenerCleanup.current = window.electronAPI.onProcessingStatus((status: any) => {
        console.log("Processing Status:", status);
        if (!solutionData && optimalHistory.length === 0) { // Only set loading if no data AND no history yet
          setIsLoading(true);
        }
      });

      // NEW: listen for problem info extraction
      window.electronAPI.onProblemExtracted((info: any) => {
        console.log('Problem info extracted:', info)
        setProblemInfo(info)
      })
      // NEW: listen for initial understanding data
      window.electronAPI.onUnderstandingGenerated((data: ProblemUnderstandingData) => {
        console.log('Received initial understanding:', data)
        setUnderstandingData(data)
        setViewStage('awaiting_confirmation')
        setIsLoading(false)
      })
      // NEW: listen for direct solution success (skip flow)
      window.electronAPI.onSolutionSuccess((data: NarrativeSolutionData | BasicSolutionData) => {
        console.log('Received full solution via skip flow:', data)
        setSolutionData(data as NarrativeSolutionData)
        if ((data as NarrativeSolutionData).optimalImplementation) {
          setOptimalHistory([(data as NarrativeSolutionData).optimalImplementation])
        }
        setViewStage('solution_displayed')
        setIsLoading(false)
      })

      listenersAttached.current = true;
    }

    return () => {
      if (listenersAttached.current) {
        console.log("Cleaning up IPC listeners for Solutions view (Narrative)");
        solutionListenerCleanup.current?.();
        errorListenerCleanup.current?.();
        statusListenerCleanup.current?.();
        listenersAttached.current = false;
      }
    }
  }, [showToast, solutionData, optimalHistory.length]); // Add dependencies

  // Follow-up question handling
  const handleFollowUpSubmit = async () => {
    if (!solutionData) return; // Need initial solution data
    console.log("Follow-up submitted:", followUpQuestion);
    setFollowUpError(null); // Clear previous error
    setIsFollowUpLoading(true);

    try {
      // We need a way to pass context. Passing the previous optimal implementation for now.
      // Ideally, the backend handles context better (e.g., conversation history)
      const previousOptimal = optimalHistory[optimalHistory.length - 1];
      
      // *** TODO: Update IPC call if needed ***
      // Assume processFollowUpQuestion now takes previous context and returns 
      // { success: boolean, data?: OptimalImplementationHistory, error?: string }
      const result = await window.electronAPI.processFollowUpQuestion({
        previousOptimalCode: previousOptimal?.code || "",
        previousOptimalDryRun: previousOptimal?.dryRun || "",
        problemAnalysis: solutionData.problemAnalysis,
        question: followUpQuestion,
        language: currentLanguage
      });

      console.log("Follow-up response received:", result);

      if (result && result.success && result.data) {
        // Append the new optimal implementation to history
        setOptimalHistory(prev => [...prev, result.data!]); 
        setFollowUpQuestion(""); // Clear input on success
      } else if (result && result.error) {
        setFollowUpError(result.error);
        showToast("Follow-up Error", result.error, "error");
      } else {
         const errorMsg = "Received an unexpected response for follow-up.";
         setFollowUpError(errorMsg);
         showToast("Follow-up Error", errorMsg, "error");
      }
    } catch (error: any) {
      console.error("Error calling processFollowUpQuestion:", error);
      const errorMsg = error.message || "An unknown error occurred during follow-up.";
      setFollowUpError(errorMsg);
      showToast("Follow-up Request Failed", errorMsg, "error");
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  // Back to queue handler
  const handleBackToQueue = () => {
    setView("queue")
    window.electronAPI.cancelOngoingRequests() // Cancel if going back
  }

  // Handlers for confirmation and clarification
  const handleConfirm = async () => {
    if (!understandingData || !problemInfo) return
    setViewStage('solving')
    // Trigger full solution generation
    try {
      const sol: NarrativeSolutionData = await window.electronAPI.triggerSolutionGeneration({
        problemInfo,
        confirmedUnderstanding: understandingData.understandingStatement,
        confirmedExamples: understandingData.generatedExamples,
        language: currentLanguage
      })
      setSolutionData(sol)
      setOptimalHistory([sol.optimalImplementation])
      setViewStage('solution_displayed')
    } catch (err: any) {
      console.error('Error generating solution after confirm:', err)
      setViewStage('error')
    }
  }

  const handleClarify = async () => {
    if (!understandingData || !problemInfo) return
    if (!userClarification.trim()) {
      setClarificationError('Please provide clarification before submitting')
      return
    }
    setClarificationError(null)
    setViewStage('loading')
    try {
      const refined: ProblemUnderstandingData = await window.electronAPI.submitUserClarification({
        problemInfo,
        previousUnderstanding: understandingData.understandingStatement,
        previousExamples: understandingData.generatedExamples,
        previousQuestions: understandingData.clarifyingQuestions,
        userClarification
      })
      setUnderstandingData(refined)
      setUserClarification('')
      setViewStage('awaiting_confirmation')
    } catch (err: any) {
      console.error('Error refining understanding:', err)
      setClarificationError(err.message || 'Clarification failed')
      setViewStage('awaiting_confirmation')
    }
  }

  // Render based on current stage
  if (viewStage === 'loading') {
    return (
      <div className="p-4 bg-transparent space-y-4 flex flex-col max-h-screen overflow-y-auto">
        <SolutionCommands
          setView={setView}
          credits={credits}
          currentLanguage={currentLanguage}
          setLanguage={setLanguage}
          onBack={handleBackToQueue}
          onDebug={() => {}} // Debug might need context
        />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-gray-400 animate-pulse">Processing problem...</p>
        </div>
      </div>
    )
  }
  if (viewStage === 'awaiting_confirmation' && understandingData) {
    return (
      <div className="p-4 bg-transparent space-y-6 flex flex-col max-h-screen overflow-y-auto pb-48">
        <SolutionCommands setView={setView} credits={credits} currentLanguage={currentLanguage} setLanguage={setLanguage} onBack={handleBackToQueue} onDebug={() => {}} />
        <SectionCard title="Confirm Problem Understanding" isLoading={false}>
          <MarkdownContent content={understandingData.understandingStatement} />
          {understandingData.generatedExamples.map((ex: ProblemExample, idx) => (
            <div key={idx} className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold">Example {idx + 1}:</h3>
              <MarkdownContent content={`**Input:** ${ex.input}`} />
              <MarkdownContent content={`**Output:** ${ex.output}`} />
              {ex.explanation && <MarkdownContent content={ex.explanation} />}
            </div>
          ))}
          {understandingData.clarifyingQuestions.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold">Clarifying Questions:</h3>
              <ul className="list-disc list-inside">
                {understandingData.clarifyingQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}
          <div className="mt-6 space-y-3">
            <Textarea placeholder="Enter clarifications or corrections..." value={userClarification} onChange={e => setUserClarification(e.target.value)} rows={3} />
            {clarificationError && <p className="text-xs text-red-400">{clarificationError}</p>}
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleClarify} disabled={viewStage === 'loading'}>Submit Clarification</Button>
              <Button variant="success" onClick={handleConfirm} disabled={viewStage === 'loading'}>Confirm & Proceed</Button>
            </div>
          </div>
        </SectionCard>
      </div>
    )
  }
  if (viewStage === 'error') {
    return (
      <div className="p-4 flex-grow flex items-center justify-center">
        <p className="text-red-400">An error occurred. Please try again.</p>
      </div>
    )
  }

  // Final solution display
  if (!solutionData) {
    return (
      <div className="p-4 bg-transparent space-y-4 flex flex-col max-h-screen overflow-y-auto">
          <SolutionCommands
             setView={setView}
             credits={credits}
             currentLanguage={currentLanguage}
             setLanguage={setLanguage}
             onBack={handleBackToQueue}
             onDebug={() => {}} // Debug might need context
          />
        <div className="flex-grow flex items-center justify-center">
          <p className="text-red-400">Failed to load solution data or received incompatible format.</p>
        </div>
      </div>
    );
  }

  // Main Render - Narrative Flow
  return (
    <div className="p-4 bg-transparent space-y-6 flex flex-col max-h-screen overflow-y-auto pb-48">
      {/* Header/Commands Section */} 
      <SolutionCommands
        setView={setView}
        credits={credits}
        currentLanguage={currentLanguage}
        setLanguage={setLanguage}
        onBack={handleBackToQueue}
        onDebug={() => window.electronAPI.runDebug()} // Assuming debug uses current state
      />

      {/* Narrative Sections */} 
      <SectionCard title="1. Problem Analysis" isLoading={false}>
        <MarkdownContent content={solutionData.problemAnalysis} />
      </SectionCard>

      <SectionCard title="2. Brute Force Approach" isLoading={false}>
        <div className="space-y-3">
          <MarkdownContent content={solutionData.bruteForce.explanation} />
          <CodeBlock code={solutionData.bruteForce.codeOrPseudocode} language={currentLanguage} />
          <ComplexityPair
             time={solutionData.bruteForce.timeComplexity}
             space={solutionData.bruteForce.spaceComplexity}
          />
          <MarkdownContent content={solutionData.bruteForce.inefficiencyReason} />
        </div>
      </SectionCard>

      <SectionCard title="3. Optimization Strategy" isLoading={false}>
         <div className="space-y-3">
             <MarkdownContent content={solutionData.optimizationStrategy.explanation} />
             <CodeBlock code={solutionData.optimizationStrategy.pseudocode} language="text" />
             <ComplexityPair
                 time={solutionData.optimizationStrategy.timeComplexity}
                 space={solutionData.optimizationStrategy.spaceComplexity}
             />
         </div>
      </SectionCard>
      
      {/* Optimal Implementation & Dry Run History */} 
      <SectionCard
         title={`4. Optimal Implementation & Dry Run (${currentLanguage})`}
         isLoading={false}
      >
         <div className="space-y-4">
            {optimalHistory.map((impl, index) => (
               <Fragment key={index}>
                  {index > 0 && (
                    <div className="pt-4 mt-4 border-t border-border/30">
                       <p className="text-xs text-muted-foreground mb-2">Update based on follow-up #{index}:</p>
                    </div>
                  )}
                  <h3 className="text-sm font-semibold text-foreground">Implementation #{index + 1}:</h3>
                  <CodeBlock code={impl.code} language={currentLanguage} />
                  <h3 className="text-sm font-semibold text-foreground mt-3">Dry Run #{index + 1}:</h3>
                  <div className="whitespace-pre-wrap">
                     <MarkdownContent content={impl.dryRun} />
                  </div>
               </Fragment>
            ))}
         </div>
      </SectionCard>

      {/* Follow-up Question Section (Sticky at Bottom) */}
      <div className="mt-4 p-4 bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-lg border border-slate-700/50 shadow-lg sticky bottom-0 backdrop-blur-sm z-10">
        <h3 className="text-base font-semibold text-foreground mb-3">Ask a Follow-up Question</h3>
        <Textarea
          placeholder="Ask about the optimal solution, request modifications, etc..."
          value={followUpQuestion}
          onChange={(e) => setFollowUpQuestion(e.target.value)}
          className="bg-slate-800 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500 focus:ring-blue-500 mb-3"
          rows={3}
        />
        <Button
          onClick={handleFollowUpSubmit}
          disabled={!followUpQuestion.trim() || isFollowUpLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {isFollowUpLoading ? "Submitting..." : "Submit Follow-up"}
        </Button>
        {followUpError && (
           <p className="text-xs text-red-400 mt-2">Error: {followUpError}</p>
        )}
      </div>

    </div> // End main container
  );
}

export default Solutions;
