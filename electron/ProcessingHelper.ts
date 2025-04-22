// ProcessingHelper.ts
import fs from "node:fs"
import * as axios from "axios"
import { BrowserWindow } from "electron"
import { IProcessingHelperDeps, ProblemInfo } from "./main"
import { ScreenshotHelper } from "./ScreenshotHelper"
import { configHelper } from "./ConfigHelper"
import { aiService } from "./AIService"
import { responseParser, InitialAnalysisResponse, ProblemExample, ProblemUnderstandingData } from "./ResponseParser"
import { solutionProcessor } from "./SolutionProcessor"
import { getProblemUnderstandingPrompt, getRefinedUnderstandingPrompt } from "../prompts"

export class ProcessingHelper {
  private deps: IProcessingHelperDeps
  private screenshotHelper: ScreenshotHelper

  // Add state for confirmed understanding/examples
  private confirmedUnderstanding: string | null = null;
  private confirmedExamples: ProblemExample[] | null = null;

  // AbortControllers for API requests
  private currentProcessingAbortController: AbortController | null = null
  private currentExtraProcessingAbortController: AbortController | null = null

  constructor(deps: IProcessingHelperDeps) {
    this.deps = deps
    this.screenshotHelper = deps.getScreenshotHelper() || new ScreenshotHelper(deps.getView ? deps.getView() : 'queue')
  }

  private async waitForInitialization(
    mainWindow: BrowserWindow
  ): Promise<void> {
    let attempts = 0
    const maxAttempts = 50 // 5 seconds total

    while (attempts < maxAttempts) {
      const isInitialized = await mainWindow.webContents.executeJavaScript(
        "window.__IS_INITIALIZED__"
      )
      if (isInitialized) return
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }
    throw new Error("App failed to initialize after 5 seconds")
  }

  private async getCredits(): Promise<number> {
    const mainWindow = this.deps.getMainWindow()
    if (!mainWindow) return 999 // Unlimited credits in this version

    try {
      await this.waitForInitialization(mainWindow)
      return 999 // Always return sufficient credits to work
    } catch (error) {
      console.error("Error getting credits:", error)
      return 999 // Unlimited credits as fallback
    }
  }

  private async getLanguage(): Promise<string> {
    try {
      // Get language from config
      const config = configHelper.loadConfig();
      if (config.language) {
        return config.language;
      }
      
      // Fallback to window variable if config doesn't have language
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        try {
          await this.waitForInitialization(mainWindow)
          const language = await mainWindow.webContents.executeJavaScript(
            "window.__LANGUAGE__"
          )

          if (
            typeof language === "string" &&
            language !== undefined &&
            language !== null
          ) {
            return language;
          }
        } catch (err) {
          console.warn("Could not get language from window", err);
        }
      }
      
      // Default fallback
      return "python";
    } catch (error) {
      console.error("Error getting language:", error)
      return "python"
    }
  }

  public async processScreenshots(): Promise<void> {
    console.log("[ProcessingHelper] processScreenshots invoked. View=", this.deps.getView());
    const mainWindow = this.deps.getMainWindow()
    if (!mainWindow) return

    // First verify we have a valid AI client
    console.log("[ProcessingHelper] Checking AI client...");
    if (!aiService.hasValidClient()) {
      console.error("AI client not initialized");
      mainWindow.webContents.send(
        this.deps.PROCESSING_EVENTS.API_KEY_INVALID
      );
      return;
    }

    const view = this.deps.getView()
    console.log("Processing screenshots in view:", view)

    if (view === "queue") {
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.INITIAL_START)
      const screenshotQueue = this.screenshotHelper.getScreenshotQueue()
      console.log("Processing main queue screenshots:", screenshotQueue)
      
      // Check if the queue is empty
      if (!screenshotQueue || screenshotQueue.length === 0) {
        console.log("No screenshots found in queue");
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);
        return;
      }

      // Check that files actually exist
      const existingScreenshots = screenshotQueue.filter(path => fs.existsSync(path));
      if (existingScreenshots.length === 0) {
        console.log("Screenshot files don't exist on disk");
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);
        return;
      }

      try {
        // Ensure existing processing is cancelled
        if (this.currentProcessingAbortController) {
          this.currentProcessingAbortController.abort();
        }
        this.currentProcessingAbortController = new AbortController();
        const signal = this.currentProcessingAbortController.signal;

        const screenshots = await Promise.all(
          existingScreenshots.map(async (path) => {
            try {
              return {
                path,
                preview: await this.screenshotHelper.getImagePreview(path),
                data: fs.readFileSync(path).toString('base64')
              };
            } catch (err) {
              console.error(`Error reading screenshot ${path}:`, err);
              return null;
            }
          })
        )

        // Filter out any nulls from failed screenshots
        const validScreenshots = screenshots.filter(Boolean);
        
        if (validScreenshots.length === 0) {
          throw new Error("Failed to load screenshot data");
        }

        // STEP 1: Initial Analysis (Problem Extraction & Understanding/Examples)
        const initialResult = await this.processScreenshotsHelper(validScreenshots, signal);
        if (!initialResult.success || !initialResult.data) {
            throw new Error(initialResult.error || "Failed during initial analysis step.");
        }
        
        // Store problem info (already done in processScreenshotsHelper)
        const problemInfo = initialResult.problemInfo;

        // Check if initial analysis determined examples were present (skip confirmation)
        if (typeof initialResult.data === 'object' && 'examplesPresent' in initialResult.data && initialResult.data.examplesPresent === true) {
            console.log("Examples present in initial screenshots. Skipping confirmation.");
            // Set confirmed state directly from problemInfo (assuming it's accurate)
            this.confirmedUnderstanding = problemInfo?.problem_statement || "Extracted directly"; // Or derive a better understanding if possible
            this.confirmedExamples = [
              { input: problemInfo?.example_input || "N/A", output: problemInfo?.example_output || "N/A" }
            ];
            // Trigger solution generation directly
            mainWindow.webContents.send("processing-status", { message: "Skipping confirmation, generating solution...", progress: 45 });
            const solutionResult = await this.generateSolutionsHelper(signal);
            if (solutionResult.success && solutionResult.data) {
                mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.SOLUTION_SUCCESS, solutionResult.data);
            } else {
                throw new Error(solutionResult.error || "Solution generation failed after skipping confirmation.");
            }
        } 
        // Check if initial analysis returned understanding data (needs confirmation)
        else if (typeof initialResult.data === 'object' && 'understandingStatement' in initialResult.data) {
            console.log("Initial understanding generated. Sending to renderer for confirmation.");
            // Store understanding/examples temporarily before confirmation
            // Note: We don't set confirmed state here yet.
            mainWindow.webContents.send("understanding-generated", initialResult.data); 
            mainWindow.webContents.send("processing-status", { message: "Waiting for user confirmation...", progress: 45 });
            // --- Workflow pauses here. Resumes when user confirms/clarifies via IPC --- 
        } else {
            // Handle unexpected response from initial analysis
            throw new Error("Unexpected response format from initial analysis.");
        }

        // End of initial queue branch
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
          errorMessage
        )
        console.error("Processing error:", error)
        if (axios.isCancel(error)) {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
            "Processing was canceled by the user."
          )
        } else {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
            errorMessage || "Server error. Please try again."
          )
        }
        // Reset view back to queue on error
        console.log("Resetting view to queue due to error")
        this.deps.setView("queue")
      } finally {
        this.currentProcessingAbortController = null
      }
    } else {
      // view == 'solutions'
      const extraScreenshotQueue =
        this.screenshotHelper.getExtraScreenshotQueue()
      console.log("Processing extra queue screenshots:", extraScreenshotQueue)
      
      // Check if the extra queue is empty
      if (!extraScreenshotQueue || extraScreenshotQueue.length === 0) {
        console.log("No extra screenshots found in queue");
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);
        
        return;
      }

      // Check that files actually exist
      const existingExtraScreenshots = extraScreenshotQueue.filter(path => fs.existsSync(path));
      if (existingExtraScreenshots.length === 0) {
        console.log("Extra screenshot files don't exist on disk");
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);
        return;
      }
      
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.DEBUG_START)

      // Initialize AbortController
      this.currentExtraProcessingAbortController = new AbortController()
      const { signal } = this.currentExtraProcessingAbortController

      try {
        // Get all screenshots (both main and extra) for processing
        const allPaths = [
          ...this.screenshotHelper.getScreenshotQueue(),
          ...existingExtraScreenshots
        ];
        
        const screenshots = await Promise.all(
          allPaths.map(async (path) => {
            try {
              if (!fs.existsSync(path)) {``
                console.warn(`Screenshot file does not exist: ${path}`);
                return null;
              }
              
              return {
                path,
                preview: await this.screenshotHelper.getImagePreview(path),
                data: fs.readFileSync(path).toString('base64')
              };
            } catch (err) {
              console.error(`Error reading screenshot ${path}:`, err);
              return null;
            }
          })
        )
        
        // Filter out any nulls from failed screenshots
        const validScreenshots = screenshots.filter(Boolean);
        
        if (validScreenshots.length === 0) {
          throw new Error("Failed to load screenshot data for debugging");
        }
        
        console.log(
          "Combined screenshots for processing:",
          validScreenshots.map((s) => s.path)
        )

        const result = await this.processExtraScreenshotsHelper(
          validScreenshots,
          signal
        )

        if (result.success) {
          this.deps.setHasDebugged(true)
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.DEBUG_SUCCESS,
            result.data
          )
        } else {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.DEBUG_ERROR,
            result.error
          )
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        if (axios.isCancel(error)) {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.DEBUG_ERROR,
            "Extra processing was canceled by the user."
          )
        } else {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.DEBUG_ERROR,
            errorMessage
          )
        }
      } finally {
        this.currentExtraProcessingAbortController = null
      }
    }
  }

  private async processScreenshotsHelper(
    screenshots: Array<{ path: string; data: string }>,
    signal: AbortSignal
  ): Promise<{
    success: boolean;
    data?: InitialAnalysisResponse;
    problemInfo?: ProblemInfo | null;
    error?: string;
  }> {
    const mainWindow = this.deps.getMainWindow();
    if (!mainWindow) return { success: false, error: 'Main window not available' };
    try {
      console.log('[ProcessingHelper] Starting initial analysis helper');
      const language = await this.getLanguage();
      console.log('[ProcessingHelper] Detected language:', language);

      // Extract problem info from screenshots
      mainWindow.webContents.send('processing-status', { message: 'Extracting problem information...', progress: 20 });
      const imageDataList = screenshots.map(s => s.data);
      const systemPrompt =
        'You are a coding challenge interpreter. Extract problem details from screenshots in JSON with fields: problem_statement, constraints, example_input, example_output.';
      const extractionPrompt =
        `Extract the coding problem details from these screenshots in JSON. Language: ${language}`;
      const responseText = await aiService.generateVisionCompletion(
        extractionPrompt,
        imageDataList,
        systemPrompt,
        undefined,
        signal
      );
      const jsonText = responseText.replace(/```json|```/g, '').trim();
      let problemInfo: ProblemInfo | null = null;
      try {
        problemInfo = JSON.parse(jsonText) as ProblemInfo;
      } catch (e) {
        console.error("Failed to parse extracted JSON:", jsonText, e);
        return { success: false, error: "Failed to parse AI response as JSON." };
      }

      console.log('[ProcessingHelper] Extracted problemInfo:', problemInfo);
      // Pass the parsed problemInfo
      this.deps.setProblemInfo(problemInfo);
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.PROBLEM_EXTRACTED, problemInfo);

      // Perform initial understanding & example generation
      mainWindow.webContents.send('processing-status', { message: 'Generating understanding & examples...', progress: 40 });
      const { promptText, systemPrompt: sysPrompt } = getProblemUnderstandingPrompt(problemInfo);
      const analysisResponse = await aiService.generateCompletion(promptText, sysPrompt, undefined, signal);
      const initialAnalysis = responseParser.parseInitialAnalysisResponse(analysisResponse);
      console.log('[ProcessingHelper] Initial analysis result:', initialAnalysis);

      return { success: true, data: initialAnalysis, problemInfo };
    } catch (error) {
      console.error('[ProcessingHelper] processScreenshotsHelper error:', error);
      return { success: false, error: (error as Error).message || 'Unknown error' };
    }
  }

  private async generateSolutionsHelper(signal: AbortSignal) {
    try {
      const problemInfo = this.deps.getProblemInfo();
      const language = await this.getLanguage();
      const mainWindow = this.deps.getMainWindow();
      
      // Retrieve the confirmed understanding and examples from state
      const understanding = this.confirmedUnderstanding;
      const examples = this.confirmedExamples;

      if (!problemInfo) throw new Error("No problem info available for solution generation.");
      if (!understanding) throw new Error("Confirmed understanding is missing for solution generation.");
      if (!examples) throw new Error("Confirmed examples are missing for solution generation.");

      console.log("Generating solution with confirmed understanding:", understanding);
      if (mainWindow) {
        // Status message already sent by caller
        // mainWindow.webContents.send("processing-status", { message: "Generating comprehensive analysis...", progress: 50 });
      }

      // Pass the confirmed data to solutionProcessor
      return await solutionProcessor.generateSolutions(
        problemInfo,
        language,
        mainWindow,
        signal,
        understanding, // Pass confirmed understanding
        examples       // Pass confirmed examples
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Solution generation error:", error);
      const mainWindow = this.deps.getMainWindow();
      if (mainWindow) {
           mainWindow.webContents.send("processing-status", { error: errorMessage });
      }
      return { success: false, error: errorMessage || "Failed to generate solution" };
    }
  }

  private async processExtraScreenshotsHelper(
    screenshots: Array<{ path: string; data: string }>,
    signal: AbortSignal
  ) {
    try {
      const problemInfo = this.deps.getProblemInfo();
      const language = await this.getLanguage();
      const mainWindow = this.deps.getMainWindow();

      if (!problemInfo) {
        throw new Error("No problem info available");
      }

      // Update progress status
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Processing debug screenshots...",
          progress: 30
        });
      }

      // Prepare the images for the API call
      const imageDataList = screenshots.map(screenshot => screenshot.data);
      
      // Define system and debug prompts
      const systemPrompt = `You are a coding interview assistant helping debug and improve solutions. Analyze these screenshots which include either error messages, incorrect outputs, or test cases, and provide detailed debugging help.

Your response MUST follow this exact structure with these section headers (use ### for headers):
### Issues Identified
- List each issue as a bullet point with clear explanation

### Specific Improvements and Corrections
- List specific code changes needed as bullet points

### Optimizations
- List any performance optimizations if applicable

### Explanation of Changes Needed
Here provide a clear explanation of why the changes are needed

### Key Points
- Summary bullet points of the most important takeaways

If you include code examples, use proper markdown code blocks with language specification.`;

      const debugPrompt = `I'm solving this coding problem: "${problemInfo.problem_statement}" in ${language}. I need help with debugging or improving my solution. Here are screenshots of my code, the errors or test cases. Please provide a detailed analysis with:
1. What issues you found in my code
2. Specific improvements and corrections
3. Any optimizations that would make the solution better
4. A clear explanation of the changes needed`;

      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Analyzing code and generating debug feedback...",
          progress: 60
        });
      }

      // Use vision API to analyze code and debug info in screenshots
      const debugContent = await aiService.generateVisionCompletion(
        debugPrompt,
        imageDataList,
        systemPrompt,
        undefined,
        signal
      );
      
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Debug analysis complete",
          progress: 100
        });
      }

      // Parse the debug response
      const debugResult = responseParser.parseDebugResponse(debugContent);
      
      // Combine with standard response structure expected by frontend
      const response = {
        code: debugResult.code,
        debug_analysis: debugResult.debug_analysis,
        thoughts: debugResult.thoughts,
        time_complexity: "N/A - Debug mode",
        space_complexity: "N/A - Debug mode"
      };

      return { success: true, data: response };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Debug processing error:", error);
      return { success: false, error: errorMessage || "Failed to process debug request" };
    }
  }

  public cancelOngoingRequests(): void {
    let wasCancelled = false

    if (this.currentProcessingAbortController) {
      this.currentProcessingAbortController.abort()
      this.currentProcessingAbortController = null
      wasCancelled = true
    }

    if (this.currentExtraProcessingAbortController) {
      this.currentExtraProcessingAbortController.abort()
      this.currentExtraProcessingAbortController = null
      wasCancelled = true
    }

    this.deps.setHasDebugged(false)

    this.deps.setProblemInfo(null)

    const mainWindow = this.deps.getMainWindow()
    if (wasCancelled && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS)
    }
  }

  // Method called by IPC handler when user SUBMITS CLARIFICATION
  public async handleUserClarification(userClarification: string, signal: AbortSignal): Promise<ProblemUnderstandingData> {
      const problemInfo = this.deps.getProblemInfo();
      // TODO: Need to retrieve the *previous* understanding state sent to the user
      // This might require storing it temporarily when "understanding-generated" is emitted
      const previousUnderstanding = "Placeholder: Retrieve previous understanding";
      const previousExamples: ProblemExample[] = []; // Placeholder
      const previousQuestions: string[] = []; // Placeholder

      if (!problemInfo) throw new Error("Cannot process clarification: Problem info missing.");
      
      const mainWindow = this.deps.getMainWindow();
      if (mainWindow) mainWindow.webContents.send("processing-status", { message: "Generating refined understanding...", progress: 55 });

      const { promptText, systemPrompt } = getRefinedUnderstandingPrompt(
          problemInfo, 
          previousUnderstanding, 
          previousExamples, 
          previousQuestions, 
          userClarification
      );
      const responseContent = await aiService.generateCompletion(promptText, systemPrompt, undefined, signal);
      const refinedData = responseParser.parseRefinedUnderstandingResponse(responseContent);
      
      // Send refined data back to UI for potential re-confirmation?
      // Or directly proceed to solution generation? Let's assume proceed for now.
      console.log("Refined understanding generated. Proceeding to solution.");
      this.confirmedUnderstanding = refinedData.understandingStatement;
      this.confirmedExamples = refinedData.generatedExamples;
      
      if (mainWindow) mainWindow.webContents.send("understanding-generated", refinedData); // Update UI with refined understanding
      await this.triggerSolutionGenerationAfterConfirmation(signal);

      return refinedData; // Return refined data (though flow proceeds async)
  }

  // Method called by IPC handler when user CONFIRMS understanding (or after clarification)
  public async triggerSolutionGenerationAfterConfirmation(signal: AbortSignal): Promise<void> {
      const mainWindow = this.deps.getMainWindow();
      if (!mainWindow) return;
      const problemInfo = this.deps.getProblemInfo();

      if (!problemInfo || !this.confirmedUnderstanding || !this.confirmedExamples) {
          console.error("Missing confirmed data for solution generation.");
          mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, "Missing confirmed data.");
          return;
      }

      try {
          mainWindow.webContents.send("processing-status", { message: "User confirmed, generating solution...", progress: 50 });
          
          const solutionResult = await this.generateSolutionsHelper(signal);
          if (solutionResult.success && solutionResult.data) {
              mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.SOLUTION_SUCCESS, solutionResult.data);
          } else {
              throw new Error(solutionResult.error || "Solution generation failed after confirmation.");
          }
      } catch (error) {
          console.error("Error during solution generation after confirmation:", error);
          const errorMessage = error instanceof Error ? error.message : "Unknown error during solution generation";
          mainWindow.webContents.send("processing-status", { error: errorMessage });
          mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR, errorMessage);
      }
  }
}
