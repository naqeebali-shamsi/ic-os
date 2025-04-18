// Solutions.tsx
import React, { useState, useEffect, useRef } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism"
import ReactMarkdown from 'react-markdown'

import ScreenshotQueue from "../components/Queue/ScreenshotQueue"

import { ProblemStatementData } from "../types/solutions"
import SolutionCommands from "../components/Solutions/SolutionCommands"
import Debug from "./Debug"
import { useToast } from "../contexts/toast"
import { COMMAND_KEY } from "../utils/platform"

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
    <h2 className="text-[13px] font-medium text-white tracking-wide">
      {title}
    </h2>
    {isLoading ? (
      <div className="mt-4 flex">
        <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
          Extracting problem statement...
        </p>
      </div>
    ) : (
      <div className="text-[13px] leading-[1.4] text-gray-100 max-w-[600px]">
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
      <h2 className="text-[13px] font-medium text-white tracking-wide">
        {title}
      </h2>
      {isLoading ? (
        <div className="space-y-1.5">
          <div className="mt-4 flex">
            <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
              Loading solutions...
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full relative">
          <button
            onClick={copyToClipboard}
            className="absolute top-2 right-2 text-xs text-white bg-white/10 hover:bg-white/20 rounded px-2 py-1 transition"
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
      <h2 className="text-[13px] font-medium text-white tracking-wide">
        {title}
      </h2>
      {isLoading ? (
        <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
          Calculating complexity...
        </p>
      ) : (
        <div className="space-y-3">
          <div className="text-[13px] leading-[1.4] text-gray-100 bg-white/5 rounded-md p-3">
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
              <div>
                <strong>Time:</strong> {formattedTimeComplexity}
              </div>
            </div>
          </div>
          <div className="text-[13px] leading-[1.4] text-gray-100 bg-white/5 rounded-md p-3">
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
      <h2 className="text-[13px] font-medium text-white tracking-wide">
        {title}
      </h2>
      {isLoading ? (
        <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
          Generating visualization...
        </p>
      ) : dryRunVisualization ? (
        <div className="text-[13px] leading-[1.4] text-gray-100 bg-white/5 rounded-md p-3 prose prose-sm prose-invert max-w-none">
          {/* Use ReactMarkdown to render the content */}
          <ReactMarkdown>{dryRunVisualization}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-[13px] leading-[1.4] text-gray-300 bg-white/5 rounded-md p-3">
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
      <h2 className="text-[13px] font-medium text-white tracking-wide">
        {title}
      </h2>
      {isLoading ? (
        <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
          Loading response...
        </p>
      ) : content ? (
        <div className="text-[13px] leading-[1.4] text-gray-100 bg-white/5 rounded-md p-3 whitespace-pre-wrap">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      ) : (
        <div className="text-[13px] leading-[1.4] text-gray-300 bg-white/5 rounded-md p-3">
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
  const contentRef = useRef<HTMLDivElement>(null)

  const [debugProcessing, setDebugProcessing] = useState(false)
  const [problemStatementData, setProblemStatementData] =
    useState<ProblemStatementData | null>(null)
  const [solutionData, setSolutionData] = useState<string | null>(null)
  const [thoughtsData, setThoughtsData] = useState<string[] | null>(null)
  const [timeComplexityData, setTimeComplexityData] = useState<string | null>(
    null
  )
  const [spaceComplexityData, setSpaceComplexityData] = useState<string | null>(
    null
  )
  
  // Add state for brute force solution data
  const [bruteForceCode, setBruteForceCode] = useState<string | null>(null)
  const [bruteForceTimeComplexity, setBruteForceTimeComplexity] = useState<string | null>(null)
  const [bruteForceSpaceComplexity, setBruteForceSpaceComplexity] = useState<string | null>(null)
  const [isDetailedSolution, setIsDetailedSolution] = useState<boolean>(false)

  // Add state for dry run visualizations
  const [bruteForceDryRun, setBruteForceDryRun] = useState<string | null>(null)
  const [optimizedDryRun, setOptimizedDryRun] = useState<string | null>(null)
  // Add state for raw responses
  const [rawBruteForceResponse, setRawBruteForceResponse] = useState<string | null>(null)
  const [rawOptimizedResponse, setRawOptimizedResponse] = useState<string | null>(null)

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [tooltipHeight, setTooltipHeight] = useState(0)

  const [isResetting, setIsResetting] = useState(false)

  interface Screenshot {
    id: string
    path: string
    preview: string
    timestamp: number
  }

  const [extraScreenshots, setExtraScreenshots] = useState<Screenshot[]>([])

  useEffect(() => {
    const fetchScreenshots = async () => {
      try {
        const existing = await window.electronAPI.getScreenshots()
        console.log("Raw screenshot data:", existing)
        const screenshots = (Array.isArray(existing) ? existing : []).map(
          (p) => ({
            id: p.path,
            path: p.path,
            preview: p.preview,
            timestamp: Date.now()
          })
        )
        console.log("Processed screenshots:", screenshots)
        setExtraScreenshots(screenshots)
      } catch (error) {
        console.error("Error loading extra screenshots:", error)
        setExtraScreenshots([])
      }
    }

    fetchScreenshots()
  }, [solutionData])

  const { showToast } = useToast()

  useEffect(() => {
    // Height update logic
    const updateDimensions = () => {
      if (contentRef.current) {
        let contentHeight = contentRef.current.scrollHeight
        const contentWidth = contentRef.current.scrollWidth
        if (isTooltipVisible) {
          contentHeight += tooltipHeight
        }
        window.electronAPI.updateContentDimensions({
          width: contentWidth,
          height: contentHeight
        })
      }
    }

    // Initialize resize observer
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current)
    }
    updateDimensions()

    // Set up event listeners
    const cleanupFunctions = [
      window.electronAPI.onScreenshotTaken(async () => {
        try {
          const existing = await window.electronAPI.getScreenshots()
          const screenshots = (Array.isArray(existing) ? existing : []).map(
            (p) => ({
              id: p.path,
              path: p.path,
              preview: p.preview,
              timestamp: Date.now()
            })
          )
          setExtraScreenshots(screenshots)
        } catch (error) {
          console.error("Error loading extra screenshots:", error)
        }
      }),
      window.electronAPI.onResetView(() => {
        // Set resetting state first
        setIsResetting(true)

        // Remove queries
        queryClient.removeQueries({
          queryKey: ["solution"]
        })
        queryClient.removeQueries({
          queryKey: ["new_solution"]
        })

        // Reset screenshots
        setExtraScreenshots([])

        // After a small delay, clear the resetting state
        setTimeout(() => {
          setIsResetting(false)
        }, 0)
      }),
      window.electronAPI.onSolutionStart(() => {
        // Every time processing starts, reset relevant states
        setSolutionData(null)
        setThoughtsData(null)
        setTimeComplexityData(null)
        setSpaceComplexityData(null)
        
        // Reset detailed solution states too
        setIsDetailedSolution(false)
        setBruteForceCode(null)
        setBruteForceTimeComplexity(null)
        setBruteForceSpaceComplexity(null)
        setBruteForceDryRun(null)
        setOptimizedDryRun(null)
      }),
      window.electronAPI.onProblemExtracted((data) => {
        queryClient.setQueryData(["problem_statement"], data)
      }),
      //if there was an error processing the initial solution
      window.electronAPI.onSolutionError((error: string) => {
        showToast("Processing Failed", error, "error")
        // Reset solutions in the cache (even though this shouldn't ever happen) and complexities to previous states
        const solution = queryClient.getQueryData(["solution"]) as {
          code: string
          thoughts: string[]
          time_complexity: string
          space_complexity: string
        } | null
        if (!solution) {
          setView("queue")
        }
        setSolutionData(solution?.code || null)
        setThoughtsData(solution?.thoughts || null)
        setTimeComplexityData(solution?.time_complexity || null)
        setSpaceComplexityData(solution?.space_complexity || null)
        console.error("Processing error:", error)
      }),
      //when the initial solution is generated, we'll set the solution data to that
      window.electronAPI.onSolutionSuccess((data) => {
        if (!data) {
          console.warn("Received empty or invalid solution data")
          return
        }
        console.log("Solution success:", data)
        
        // Debug logging for dry run visualizations
        console.log("Dry run data received:", {
          bruteForceDryRun: data.bruteForceDryRunVisualization,
          optimizedDryRun: data.optimizedDryRunVisualization
        })
        
        console.log("Raw response data:", {
          bruteForceRaw: data.rawBruteForceResponse?.substring(0, 100),
          optimizedRaw: data.rawOptimizedResponse?.substring(0, 100)
        })

        // Check if we received the new detailed solution format (with brute force & optimized)
        if ('bruteForceCode' in data && 'optimizedCode' in data) {
          // Using new detailed solution format
          setIsDetailedSolution(true)
          
          // Store brute force data
          setBruteForceCode(data.bruteForceCode || null)
          setBruteForceTimeComplexity(data.bruteForceTimeComplexity || null)
          setBruteForceSpaceComplexity(data.bruteForceSpaceComplexity || null)
          setBruteForceDryRun(data.bruteForceDryRunVisualization || null)
          setRawBruteForceResponse(data.rawBruteForceResponse || null)
          
          // Debug logging for brute force dry run
          console.log("Setting brute force dry run:", data.bruteForceDryRunVisualization)
          
          // Using optimized solution as the main solution
          const detailedSolution = {
            code: data.optimizedCode,
            thoughts: data.optimizationAnalysis || [],
            time_complexity: data.optimizedTimeComplexity,
            space_complexity: data.optimizedSpaceComplexity,
            dryRunVisualization: data.optimizedDryRunVisualization,
            rawResponse: data.rawOptimizedResponse
          }
          
          // Debug logging for optimized dry run
          console.log("Setting optimized dry run:", data.optimizedDryRunVisualization)
          setRawOptimizedResponse(data.rawOptimizedResponse || null)

          queryClient.setQueryData(["solution"], detailedSolution)
          setSolutionData(detailedSolution.code || null)
          setThoughtsData(detailedSolution.thoughts || null)
          setTimeComplexityData(detailedSolution.time_complexity || null)
          setSpaceComplexityData(detailedSolution.space_complexity || null)
          setOptimizedDryRun(detailedSolution.dryRunVisualization || null)
        } else {
          // Using the older basic solution format
          setIsDetailedSolution(false)
          setBruteForceCode(null)
          setBruteForceTimeComplexity(null)
          setBruteForceSpaceComplexity(null)
          setBruteForceDryRun(null)
          setRawBruteForceResponse(null)
          setRawOptimizedResponse(null)
          
          const solutionData = {
            code: data.code,
            thoughts: data.thoughts,
            time_complexity: data.time_complexity,
            space_complexity: data.space_complexity,
            dryRunVisualization: data.dryRunVisualization,
            rawResponse: data.rawResponse
          }

          queryClient.setQueryData(["solution"], solutionData)
          setSolutionData(solutionData.code || null)
          setThoughtsData(solutionData.thoughts || null)
          setTimeComplexityData(solutionData.time_complexity || null)
          setSpaceComplexityData(solutionData.space_complexity || null)
          setOptimizedDryRun(solutionData.dryRunVisualization || null)
          setRawOptimizedResponse(solutionData.rawResponse || null)
        }

        // Fetch latest screenshots when solution is successful
        const fetchScreenshots = async () => {
          try {
            const existing = await window.electronAPI.getScreenshots()
            const screenshots =
              existing.previews?.map((p) => ({
                id: p.path,
                path: p.path,
                preview: p.preview,
                timestamp: Date.now()
              })) || []
            setExtraScreenshots(screenshots)
          } catch (error) {
            console.error("Error loading extra screenshots:", error)
            setExtraScreenshots([])
          }
        }
        fetchScreenshots()
      }),

      //########################################################
      //DEBUG EVENTS
      //########################################################
      window.electronAPI.onDebugStart(() => {
        //we'll set the debug processing state to true and use that to render a little loader
        setDebugProcessing(true)
      }),
      //the first time debugging works, we'll set the view to debug and populate the cache with the data
      window.electronAPI.onDebugSuccess((data) => {
        queryClient.setQueryData(["new_solution"], data)
        setDebugProcessing(false)
      }),
      //when there was an error in the initial debugging, we'll show a toast and stop the little generating pulsing thing.
      window.electronAPI.onDebugError(() => {
        showToast(
          "Processing Failed",
          "There was an error debugging your code.",
          "error"
        )
        setDebugProcessing(false)
      }),
      window.electronAPI.onProcessingNoScreenshots(() => {
        showToast(
          "No Screenshots",
          "There are no extra screenshots to process.",
          "neutral"
        )
      }),
      // Removed out of credits handler - unlimited credits in this version
    ]

    return () => {
      resizeObserver.disconnect()
      cleanupFunctions.forEach((cleanup) => cleanup())
    }
  }, [isTooltipVisible, tooltipHeight])

  useEffect(() => {
    setProblemStatementData(
      queryClient.getQueryData(["problem_statement"]) || null
    )
    setSolutionData(queryClient.getQueryData(["solution"]) || null)

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.query.queryKey[0] === "problem_statement") {
        setProblemStatementData(
          queryClient.getQueryData(["problem_statement"]) || null
        )
      }
      if (event?.query.queryKey[0] === "solution") {
        const solution = queryClient.getQueryData(["solution"]) as {
          code: string
          thoughts: string[]
          time_complexity: string
          space_complexity: string
        } | null

        setSolutionData(solution?.code ?? null)
        setThoughtsData(solution?.thoughts ?? null)
        setTimeComplexityData(solution?.time_complexity ?? null)
        setSpaceComplexityData(solution?.space_complexity ?? null)
      }
    })
    return () => unsubscribe()
  }, [queryClient])

  const handleTooltipVisibilityChange = (visible: boolean, height: number) => {
    setIsTooltipVisible(visible)
    setTooltipHeight(height)
  }

  const handleDeleteExtraScreenshot = async (index: number) => {
    const screenshotToDelete = extraScreenshots[index]

    try {
      const response = await window.electronAPI.deleteScreenshot(
        screenshotToDelete.path
      )

      if (response.success) {
        // Fetch and update screenshots after successful deletion
        const existing = await window.electronAPI.getScreenshots()
        const screenshots = (Array.isArray(existing) ? existing : []).map(
          (p) => ({
            id: p.path,
            path: p.path,
            preview: p.preview,
            timestamp: Date.now()
          })
        )
        setExtraScreenshots(screenshots)
      } else {
        console.error("Failed to delete extra screenshot:", response.error)
        showToast("Error", "Failed to delete the screenshot", "error")
      }
    } catch (error) {
      console.error("Error deleting extra screenshot:", error)
      showToast("Error", "Failed to delete the screenshot", "error")
    }
  }

  return (
    <>
      {!isResetting && queryClient.getQueryData(["new_solution"]) ? (
        <Debug
          isProcessing={debugProcessing}
          setIsProcessing={setDebugProcessing}
          currentLanguage={currentLanguage}
          setLanguage={setLanguage}
        />
      ) : (
        <div ref={contentRef} className="relative">
          <div className="space-y-3 px-4 py-3">
          {/* Conditionally render the screenshot queue if solutionData is available */}
          {solutionData && (
            <div className="bg-transparent w-fit">
              <div className="pb-3">
                <div className="space-y-3 w-fit">
                  <ScreenshotQueue
                    isLoading={debugProcessing}
                    screenshots={extraScreenshots}
                    onDeleteScreenshot={handleDeleteExtraScreenshot}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navbar of commands with the SolutionsHelper */}
          <SolutionCommands
            onTooltipVisibilityChange={handleTooltipVisibilityChange}
            isProcessing={!problemStatementData || !solutionData}
            extraScreenshots={extraScreenshots}
            credits={credits}
            currentLanguage={currentLanguage}
            setLanguage={setLanguage}
          />

          {/* Main Content - Modified width constraints */}
          <div className="w-full text-sm text-black bg-black/60 rounded-md">
            <div className="rounded-lg overflow-hidden">
              <div className="px-4 py-3 space-y-4 max-w-full">
                {!solutionData && (
                  <>
                    <ContentSection
                      title="Problem Statement"
                      content={problemStatementData?.problem_statement}
                      isLoading={!problemStatementData}
                    />
                    {problemStatementData && (
                      <div className="mt-4 flex">
                        <p className="text-xs bg-gradient-to-r from-gray-300 via-gray-100 to-gray-300 bg-clip-text text-transparent animate-pulse">
                          Generating solutions...
                        </p>
                      </div>
                    )}
                  </>
                )}

                {solutionData && (
                  <>
                    <ContentSection
                      title={`My Thoughts (${COMMAND_KEY} + Arrow keys to scroll)`}
                      content={
                        thoughtsData && (
                          <div className="space-y-3">
                            <div className="space-y-1">
                              {thoughtsData.map((thought, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <div className="w-1 h-1 rounded-full bg-blue-400/80 mt-2 shrink-0" />
                                  <div>{thought}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }
                      isLoading={!thoughtsData}
                    />
                    
                    {isDetailedSolution && bruteForceCode && (
                      <>
                        <SolutionSection
                          title="Brute Force Solution"
                          content={bruteForceCode}
                          isLoading={!bruteForceCode}
                          currentLanguage={currentLanguage}
                        />
                        
                        <DryRunSection
                          title="Brute Force Visualization"
                          dryRunVisualization={bruteForceDryRun}
                          isLoading={!bruteForceDryRun}
                        />
                        
                        {/* Add raw response section as fallback */}
                        {!bruteForceDryRun && rawBruteForceResponse && (
                          <RawResponseSection
                            title="Brute Force Trace (Raw)"
                            content={extractDryRunSectionFromMarkdown(rawBruteForceResponse)}
                            isLoading={false}
                          />
                        )}
                        
                        <ComplexitySection
                          title="Brute Force Complexity"
                          timeComplexity={bruteForceTimeComplexity}
                          spaceComplexity={bruteForceSpaceComplexity}
                          isLoading={!bruteForceTimeComplexity || !bruteForceSpaceComplexity}
                        />
                      </>
                    )}

                    <SolutionSection
                      title={isDetailedSolution ? "Optimized Solution" : "Solution"}
                      content={solutionData}
                      isLoading={!solutionData}
                      currentLanguage={currentLanguage}
                    />
                    
                    <DryRunSection
                      title={isDetailedSolution ? "Optimized Visualization" : "Solution Visualization"}
                      dryRunVisualization={optimizedDryRun}
                      isLoading={!optimizedDryRun}
                    />
                    
                    {/* Add raw response section as fallback */}
                    {!optimizedDryRun && rawOptimizedResponse && (
                      <RawResponseSection
                        title={isDetailedSolution ? "Optimized Trace (Raw)" : "Solution Trace (Raw)"}
                        content={extractDryRunSectionFromMarkdown(rawOptimizedResponse)}
                        isLoading={false}
                      />
                    )}

                    <ComplexitySection
                      title="Optimized Complexity"
                      timeComplexity={timeComplexityData}
                      spaceComplexity={spaceComplexityData}
                      isLoading={!timeComplexityData || !spaceComplexityData}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  )
}

export default Solutions
