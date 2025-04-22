import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// Import shared types from electron directory
import type { BehavioralStory, AmazonLP } from '../../electron/types'; // Assuming relative path works

// Type matching the structure in ipcHandlers.ts (consider sharing types)
// interface BehavioralStory {
//   id: string;
//   title: string;
//   principles: string[];
//   situation: string;
//   task: string;
//   action: string;
//   result: string;
// }

interface BehavioralProcessingResult {
  success: boolean;
  selectedStory?: BehavioralStory; // Uses imported type now
  generatedStoryText?: string; // Keep for type consistency, though not expected
  reasoning?: string;
  error?: string;
}

interface FollowUpResult {
  success: boolean;
  explanation?: string;
  error?: string;
}

interface BehavioralStoryDetailResult {
  success: boolean;
  detailedStory?: string;
  error?: string;
}

interface StatusUpdate {
    message: string;
    progress?: number;
}

const BehavioralAssistant: React.FC = () => {
  const [question, setQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  
  // State for initial results
  const [currentStory, setCurrentStory] = useState<BehavioralStory | null>(null);
  const [selectionReasoning, setSelectionReasoning] = useState<string | null>(null);

  // State for follow-up
  const [followUpQuestion, setFollowUpQuestion] = useState<string>('');
  const [isFollowUpLoading, setIsFollowUpLoading] = useState<boolean>(false);
  const [followUpExplanation, setFollowUpExplanation] = useState<string | null>(null);
  const [followUpError, setFollowUpError] = useState<string | null>(null);

  // New state for detailed story
  const [detailedStory, setDetailedStory] = useState<string | null>(null);
  const [isGeneratingDetail, setIsGeneratingDetail] = useState<boolean>(false);
  const [detailGenerationError, setDetailGenerationError] = useState<string | null>(null);
  const [detailStatus, setDetailStatus] = useState<string | null>(null);

  // New state for processing status
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  useEffect(() => {
    const handleProcessingStatus = (status: StatusUpdate) => {
        console.log("[Behavioral UI] Processing Status:", status);
        if (status && status.message) {
            setProcessingStatus(`${status.message}${status.progress != null ? ` (${status.progress}%)` : ''}`);
            if (status.progress === 100 || status.message.toLowerCase().includes('error')) {
               setTimeout(() => setProcessingStatus(null), 2000);
            }
        } else {
            console.warn("[Behavioral UI] Received invalid processing status:", status);
        }
    };
    const handleDetailStatus = (status: StatusUpdate) => {
        console.log("[Behavioral UI] Detail Status:", status);
        if (status && status.message) {
            setDetailStatus(`${status.message}${status.progress != null ? ` (${status.progress}%)` : ''}`);
             if (status.progress === 100 || status.message.toLowerCase().includes('error')) {
                setTimeout(() => setDetailStatus(null), 2000);
            }
        } else {
             console.warn("[Behavioral UI] Received invalid detail status:", status);
        }
    };
     const handleFollowUpStatus = (status: StatusUpdate) => {
        console.log("[Behavioral UI] Follow-up Status:", status);
    };

    window.electronAPI.on('processing-status', handleProcessingStatus);
    window.electronAPI.on('story-detail-status', handleDetailStatus);
    window.electronAPI.on('follow-up-status', handleFollowUpStatus);

    return () => {
      window.electronAPI.removeListener('processing-status', handleProcessingStatus);
      window.electronAPI.removeListener('story-detail-status', handleDetailStatus);
      window.electronAPI.removeListener('follow-up-status', handleFollowUpStatus);
    };
  }, []);

  const handleSubmit = async () => {
    if (!question.trim()) return;
    setIsLoading(true);
    setProcessingError(null);
    setCurrentStory(null);
    setSelectionReasoning(null);
    setFollowUpQuestion('');
    setFollowUpExplanation(null);
    setFollowUpError(null);
    setDetailedStory(null);
    setDetailGenerationError(null);
    setProcessingStatus("Starting analysis...");
    console.log("[Behavioral UI] Submitting question:", question);

    try {
      const response: BehavioralProcessingResult = await window.electronAPI.processBehavioralQuestion(question);
      console.log("[Behavioral UI] Received response:", response);
      if (response.success) {
        setCurrentStory(response.selectedStory || null);
        setSelectionReasoning(response.reasoning || (response.selectedStory ? 'Story selected.' : 'No specific story selected.'));
        if (!response.selectedStory) {
          console.log("[Behavioral UI] No story selected.");
        }
      } else {
        console.error("[Behavioral UI] Processing error:", response.error);
        setProcessingError(response.error || 'An unknown error occurred during analysis.');
      }
    } catch (error) {
      console.error("[Behavioral UI] Error calling processBehavioralQuestion:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setProcessingError(`IPC Error during analysis: ${errorMsg}`);
    } finally {
      setIsLoading(false);
      setProcessingStatus(null);
    }
  };

  const handleFollowUpSubmit = async () => {
    if (!followUpQuestion.trim() || !currentStory) return;
    setIsFollowUpLoading(true);
    setFollowUpExplanation(null);
    setFollowUpError(null);
    console.log("[Behavioral UI] Submitting follow-up:", followUpQuestion);
    console.log("[Behavioral UI] Context story:", currentStory.id);

    try {
       const response: FollowUpResult = await window.electronAPI.processBehavioralFollowUp({
          originalQuestion: question,
          selectedStory: currentStory,
          followUpQuestion: followUpQuestion
       });
       console.log("[Behavioral UI] Follow-up response:", response);
       if (response.success) {
         setFollowUpExplanation(response.explanation || "AI provided no explanation.");
       } else {
         setFollowUpError(`Follow-up failed: ${response.error || 'Unknown error'}`);
       }
    } catch (error) {
       console.error("[Behavioral UI] Error processing follow-up:", error);
       setFollowUpError(`IPC Error during follow-up: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleGenerateDetail = async () => {
    if (!currentStory || isGeneratingDetail) return;
    setIsGeneratingDetail(true);
    setDetailGenerationError(null);
    setDetailedStory(null);
    setDetailStatus("Generating detailed narrative...");
    console.log(`[Behavioral UI] Requesting detail for story: ${currentStory.id}`);

    try {
      const result: BehavioralStoryDetailResult = await window.electronAPI.generateBehavioralStoryDetail(currentStory.id);
      console.log("[Behavioral UI] Received detail generation result:", result);
      if (result.success && result.detailedStory) {
        setDetailedStory(result.detailedStory);
      } else {
        setDetailGenerationError(result.error || 'Failed to generate detailed story. Unknown error.');
      }
    } catch (error) {
      console.error("[Behavioral UI] Error calling generateBehavioralStoryDetail:", error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      setDetailGenerationError(`IPC Error generating detail: ${errorMsg}`);
    } finally {
      setIsGeneratingDetail(false);
      setDetailStatus(null);
    }
  };

  return (
    <div className="p-4 flex flex-col h-full bg-gray-900 text-gray-100">
      <h2 className="text-xl font-semibold mb-4 text-center">Behavioral Question Assistant</h2>
      
      {/* Initial Question Input */}
      <div className="mb-4">
        <label htmlFor="behavioral-question" className="block text-sm font-medium text-gray-300 mb-1">
          Enter Behavioral Question:
        </label>
        <Textarea
          id="behavioral-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g., Tell me about a time you handled conflict with a coworker..."
          className="w-full resize-none bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500"
          rows={4} 
        />
      </div>

      <Button 
        onClick={handleSubmit}
        disabled={isLoading || !question.trim()}
        className="mb-4 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
      >
        {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : 'Analyze Question & Find Story'}
      </Button>

      {/* Loading/Status Indicator for initial processing */}
      {isLoading && processingStatus && (
          <div className="text-center text-sm text-gray-400 mb-3 animate-pulse">{processingStatus}</div>
      )}

      {/* Display Area */}
      <div className="flex-grow overflow-hidden">
        <ScrollArea className="h-full pr-3">
          {processingError && (
            <Card className="mb-4 border-red-500 bg-red-900/20">
              <CardHeader>
                <CardTitle className="text-red-400">Analysis Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-300">{processingError}</p>
              </CardContent>
            </Card>
          )}

          {selectionReasoning && !currentStory && !isLoading && (
            <Card className="mb-4 border-yellow-500 bg-yellow-900/20">
              <CardHeader>
                <CardTitle className="text-yellow-300">Analysis Result</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-200 italic">{selectionReasoning}</p>
              </CardContent>
            </Card>
          )}

          {currentStory && (
            <Card className="mb-4 border-gray-700 bg-gray-800/50">
              <CardHeader>
                <CardTitle className="text-blue-300">Selected Story: {currentStory.title}</CardTitle>
                {selectionReasoning && <CardDescription className="text-gray-400 pt-1">Reasoning: {selectionReasoning}</CardDescription>}
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-300">
                <p><strong className="text-gray-100">Principles:</strong> {currentStory.principles.join(', ')}</p>
                <p><strong className="text-gray-100">Situation:</strong> {currentStory.situation}</p>
                <p><strong className="text-gray-100">Task:</strong> {currentStory.task}</p>
                <p><strong className="text-gray-100">Action:</strong> {currentStory.action}</p>
                <p><strong className="text-gray-100">Result:</strong> {currentStory.result}</p>

                {/* Button to Generate Detailed Story */}
                <div className="pt-3">
                   <Button
                      onClick={handleGenerateDetail}
                      disabled={isGeneratingDetail}
                      variant="outline"
                      size="sm"
                      className="border-purple-500 text-purple-300 hover:bg-purple-900/30 hover:text-purple-200 w-full sm:w-auto"
                   >
                     {isGeneratingDetail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                     {isGeneratingDetail ? 'Generating Narrative...' : (detailedStory ? 'Regenerate Detailed Narrative' : 'Generate Detailed Narrative')}
                   </Button>
                </div>

                 {/* Loading/Status Indicator for detail generation */}
                 {isGeneratingDetail && detailStatus && (
                     <div className="text-center text-sm text-purple-300 pt-2 animate-pulse">{detailStatus}</div>
                 )}

                {/* Display Detailed Story Error */}
                {detailGenerationError && (
                   <div className="mt-3 p-3 rounded bg-red-900/30 border border-red-600 text-red-300 text-sm">
                      <strong>Error Generating Detail:</strong> {detailGenerationError}
                   </div>
                )}

                {/* Display Detailed Story with Scrolling */}
                {detailedStory && !isGeneratingDetail && (
                   <div className="mt-4 pt-4 border-t border-gray-600">
                     <h4 className="text-md font-semibold mb-2 text-purple-200">Detailed Narrative:</h4>
                      <ScrollArea className="max-h-[400px] overflow-y-auto pr-2 border border-gray-700 rounded bg-gray-850/50">
                         <div className="prose prose-sm prose-invert max-w-none p-3 ">
                             <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {detailedStory}
                             </ReactMarkdown>
                         </div>
                      </ScrollArea>
                   </div>
                )}

              </CardContent>
            </Card>
          )}

          {/* Follow-up Section */}
          {currentStory && (
            <div className="mt-4 border-t border-gray-700 pt-4">
              <h3 className="text-lg font-semibold mb-2 text-gray-200">Ask a Follow-up Question:</h3>
              <Textarea
                id="follow-up-question"
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                placeholder={`e.g., How did your manager react? What would you do differently?`}
                className="w-full resize-none bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500 mb-2"
                rows={3}
              />
              <Button
                onClick={handleFollowUpSubmit}
                disabled={isFollowUpLoading || !followUpQuestion.trim()}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
              >
                {isFollowUpLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : 'Submit Follow-up'}
              </Button>

              {followUpError && (
                 <Card className="mt-4 border-red-500 bg-red-900/20">
                   <CardHeader><CardTitle className="text-red-400">Follow-up Error</CardTitle></CardHeader>
                   <CardContent><p className="text-red-300">{followUpError}</p></CardContent>
                 </Card>
              )}

              {followUpExplanation && (
                <Card className="mt-4 border-gray-700 bg-gray-800/50">
                  <CardHeader><CardTitle className="text-green-300">Follow-up Answer</CardTitle></CardHeader>
                   <CardContent className="prose prose-sm prose-invert max-w-none p-3">
                     <ReactMarkdown remarkPlugins={[remarkGfm]}>
                       {followUpExplanation}
                     </ReactMarkdown>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};

export default BehavioralAssistant; 