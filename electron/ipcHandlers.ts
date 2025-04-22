// ipcHandlers.ts

import { ipcMain, shell, dialog } from "electron"
import { randomBytes } from "crypto"
import { IIpcHandlerDeps } from "./main"
import { configHelper } from "./ConfigHelper"
import { aiService } from "./AIService"
import { getFollowUpPrompt, getRefinedUnderstandingPrompt, getNarrativeSolutionPrompt, getBehavioralLPExtractionPrompt, getBehavioralStorySelectionPrompt, getBehavioralStoryGenerationPrompt, getBehavioralFollowUpPrompt, getAnticipatedBehavioralFollowUpsPrompt, getBehavioralStoryDetailPrompt } from "./prompts"
import { responseParser } from "./ResponseParser"
// Import shared types
import { ProblemUnderstandingData, ProblemExample, AmazonLP, BehavioralStory } from './types';
import * as fs from 'fs/promises'
import * as path from 'path'
import { app } from "electron"

// Define types for behavioral data (Consider moving to a types file)
// interface AmazonLP {
//   name: string;
//   description: string;
// }

// interface BehavioralStory {
//   id: string;
//   title: string;
//   principles: string[];
//   situation: string;
//   task: string;
//   action: string;
//   result: string;
// }

// Define return type for the handler
interface BehavioralProcessingResult {
  success: boolean;
  selectedStory?: BehavioralStory;
  generatedStoryText?: string; // For fallback
  reasoning?: string; // For selection
  error?: string;
}

export function initializeIpcHandlers(deps: IIpcHandlerDeps): void {
  console.log("Initializing IPC handlers");

  try {
    console.log("Registering: get-config");
    ipcMain.handle("get-config", () => {
      return configHelper.loadConfig();
    });

    console.log("Registering: update-config");
    ipcMain.handle("update-config", (_event, updates) => {
      return configHelper.updateConfig(updates);
    });

    console.log("Registering: check-api-key");
    ipcMain.handle("check-api-key", () => {
      return configHelper.hasApiKey();
    });

    console.log("Registering: validate-api-key");
    ipcMain.handle("validate-api-key", async (_event, apiKey) => {
      // First check the format
      if (!configHelper.isValidApiKeyFormat(apiKey)) {
        return { 
          valid: false, 
          error: "Invalid API key format. OpenAI API keys start with 'sk-'" 
        };
      }
      
      // Then test the API key with OpenAI
      const result = await configHelper.testApiKey(apiKey);
      return result;
    })

    // Credits handlers
    ipcMain.handle("set-initial-credits", async (_event, credits: number) => {
      const mainWindow = deps.getMainWindow()
      if (!mainWindow) return

      try {
        // Set the credits in a way that ensures atomicity
        await mainWindow.webContents.executeJavaScript(
          `window.__CREDITS__ = ${credits}`
        )
        mainWindow.webContents.send("credits-updated", credits)
      } catch (error) {
        console.error("Error setting initial credits:", error)
        throw error
      }
    })

    ipcMain.handle("decrement-credits", async () => {
      const mainWindow = deps.getMainWindow()
      if (!mainWindow) return

      try {
        const currentCredits = await mainWindow.webContents.executeJavaScript(
          "window.__CREDITS__"
        )
        if (currentCredits > 0) {
          const newCredits = currentCredits - 1
          await mainWindow.webContents.executeJavaScript(
            `window.__CREDITS__ = ${newCredits}`
          )
          mainWindow.webContents.send("credits-updated", newCredits)
        }
      } catch (error) {
        console.error("Error decrementing credits:", error)
      }
    })

    // Screenshot queue handlers
    console.log("Registering: get-screenshot-queue");
    ipcMain.handle("get-screenshot-queue", () => {
      return deps.getScreenshotQueue()
    })

    ipcMain.handle("get-extra-screenshot-queue", () => {
      return deps.getExtraScreenshotQueue()
    })

    console.log("Registering: delete-screenshot");
    ipcMain.handle("delete-screenshot", async (event, path: string) => {
      return deps.deleteScreenshot(path)
    })

    console.log("Registering: get-image-preview");
    ipcMain.handle("get-image-preview", async (event, path: string) => {
      return deps.getImagePreview(path)
    })

    // Screenshot processing handlers
    console.log("Registering: process-screenshots");
    ipcMain.handle("process-screenshots", async () => {
      // Check for API key before processing
      if (!configHelper.hasApiKey()) {
        const mainWindow = deps.getMainWindow();
        if (mainWindow) {
          mainWindow.webContents.send(deps.PROCESSING_EVENTS.API_KEY_INVALID);
        }
        return;
      }
      
      await deps.processingHelper?.processScreenshots()
    })

    // Window dimension handlers
    console.log("Registering: update-content-dimensions");
    ipcMain.handle(
      "update-content-dimensions",
      async (event, { width, height }: { width: number; height: number }) => {
        if (width && height) {
          deps.setWindowDimensions(width, height)
        }
      }
    )

    ipcMain.handle(
      "set-window-dimensions",
      (event, width: number, height: number) => {
        deps.setWindowDimensions(width, height)
      }
    )

    // Screenshot management handlers
    console.log("Registering: get-screenshots");
    ipcMain.handle("get-screenshots", async () => {
      try {
        let previews = []
        const currentView = deps.getView()

        if (currentView === "queue") {
          const queue = deps.getScreenshotQueue()
          previews = await Promise.all(
            queue.map(async (path) => ({
              path,
              preview: await deps.getImagePreview(path)
            }))
          )
        } else {
          const extraQueue = deps.getExtraScreenshotQueue()
          previews = await Promise.all(
            extraQueue.map(async (path) => ({
              path,
              preview: await deps.getImagePreview(path)
            }))
          )
        }

        return previews
      } catch (error) {
        console.error("Error getting screenshots:", error)
        throw error
      }
    })

    // Screenshot trigger handlers
    console.log("Registering: trigger-screenshot");
    ipcMain.handle("trigger-screenshot", async () => {
      const mainWindow = deps.getMainWindow()
      if (mainWindow) {
        try {
          const screenshotPath = await deps.takeScreenshot()
          const preview = await deps.getImagePreview(screenshotPath)
          mainWindow.webContents.send("screenshot-taken", {
            path: screenshotPath,
            preview
          })
          return { success: true }
        } catch (error) {
          console.error("Error triggering screenshot:", error)
          return { error: "Failed to trigger screenshot" }
        }
      }
      return { error: "No main window available" }
    })

    ipcMain.handle("take-screenshot", async () => {
      try {
        const screenshotPath = await deps.takeScreenshot()
        const preview = await deps.getImagePreview(screenshotPath)
        return { path: screenshotPath, preview }
      } catch (error) {
        console.error("Error taking screenshot:", error)
        return { error: "Failed to take screenshot" }
      }
    })

    // Auth-related handlers removed

    console.log("Registering: open-external-url");
    ipcMain.handle("open-external-url", (event, url: string) => {
      shell.openExternal(url)
    })
    
    // Open external URL handler
    console.log("Registering: openLink");
    ipcMain.handle("openLink", (event, url: string) => {
      try {
        console.log(`Opening external URL: ${url}`);
        shell.openExternal(url);
        return { success: true };
      } catch (error) {
        console.error(`Error opening URL ${url}:`, error);
        return { success: false, error: `Failed to open URL: ${error}` };
      }
    })

    // Settings portal handler
    console.log("Registering: open-settings-portal");
    ipcMain.handle("open-settings-portal", () => {
      const mainWindow = deps.getMainWindow();
      if (mainWindow) {
        mainWindow.webContents.send("show-settings-dialog");
        return { success: true };
      }
      return { success: false, error: "Main window not available" };
    })

    // Window management handlers
    console.log("Registering: toggle-window");
    ipcMain.handle("toggle-window", () => {
      try {
        deps.toggleMainWindow()
        return { success: true }
      } catch (error) {
        console.error("Error toggling window:", error)
        return { error: "Failed to toggle window" }
      }
    })

    ipcMain.handle("reset-queues", async () => {
      try {
        deps.clearQueues()
        return { success: true }
      } catch (error) {
        console.error("Error resetting queues:", error)
        return { error: "Failed to reset queues" }
      }
    })

    // Process screenshot handlers
    console.log("Registering: trigger-process-screenshots");
    ipcMain.handle("trigger-process-screenshots", async () => {
      try {
        // Check for API key before processing
        if (!configHelper.hasApiKey()) {
          const mainWindow = deps.getMainWindow();
          if (mainWindow) {
            mainWindow.webContents.send(deps.PROCESSING_EVENTS.API_KEY_INVALID);
          }
          return { success: false, error: "API key required" };
        }
        
        await deps.processingHelper?.processScreenshots()
        return { success: true }
      } catch (error) {
        console.error("Error processing screenshots:", error)
        return { error: "Failed to process screenshots" }
      }
    })

    // Reset handlers
    console.log("Registering: trigger-reset");
    ipcMain.handle("trigger-reset", () => {
      try {
        // First cancel any ongoing requests
        deps.processingHelper?.cancelOngoingRequests()

        // Clear all queues immediately
        deps.clearQueues()

        // Reset view to queue
        deps.setView("queue")

        // Get main window and send reset events
        const mainWindow = deps.getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          // Send reset events in sequence
          mainWindow.webContents.send("reset-view")
          mainWindow.webContents.send("reset")
        }

        return { success: true }
      } catch (error) {
        console.error("Error triggering reset:", error)
        return { error: "Failed to trigger reset" }
      }
    })

    // Window movement handlers
    console.log("Registering: trigger-move-left");
    ipcMain.handle("trigger-move-left", () => {
      try {
        deps.moveWindowLeft()
        return { success: true }
      } catch (error) {
        console.error("Error moving window left:", error)
        return { error: "Failed to move window left" }
      }
    })

    ipcMain.handle("trigger-move-right", () => {
      try {
        deps.moveWindowRight()
        return { success: true }
      } catch (error) {
        console.error("Error moving window right:", error)
        return { error: "Failed to move window right" }
      }
    })

    ipcMain.handle("trigger-move-up", () => {
      try {
        deps.moveWindowUp()
        return { success: true }
      } catch (error) {
        console.error("Error moving window up:", error)
        return { error: "Failed to move window up" }
      }
    })

    ipcMain.handle("trigger-move-down", () => {
      try {
        deps.moveWindowDown()
        return { success: true }
      } catch (error) {
        console.error("Error moving window down:", error)
        return { error: "Failed to move window down" }
      }
    })
    
    // Delete last screenshot handler
    console.log("Registering: delete-last-screenshot");
    ipcMain.handle("delete-last-screenshot", async () => {
      try {
        const queue = deps.getView() === "queue" 
          ? deps.getScreenshotQueue() 
          : deps.getExtraScreenshotQueue()
        
        if (queue.length === 0) {
          return { success: false, error: "No screenshots to delete" }
        }
        
        // Get the last screenshot in the queue
        const lastScreenshot = queue[queue.length - 1]
        
        // Delete it
        const result = await deps.deleteScreenshot(lastScreenshot)
        
        // Notify the renderer about the change
        const mainWindow = deps.getMainWindow()
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("screenshot-deleted", { path: lastScreenshot })
        }
        
        return result
      } catch (error) {
        console.error("Error deleting last screenshot:", error)
        return { success: false, error: "Failed to delete last screenshot" }
      }
    })

    // Cancel ongoing requests handler
    console.log("Registering: cancel-ongoing-requests");
    ipcMain.handle("cancel-ongoing-requests", (_event) => {
      // Cancel any ongoing processing requests
      deps.processingHelper?.cancelOngoingRequests()
      return { success: true }
    })

    // Follow-up Question Handler
    console.log("Registering: process-follow-up-question");
    ipcMain.handle("process-follow-up-question", async (event, args) => {
      console.log("Received process-follow-up-question:", args);
      const mainWindow = deps.getMainWindow();
      if (!mainWindow) {
        return { success: false, error: "Main window not available" };
      }

      // Destructure args passed from frontend
      const {
        previousOptimalCode,
        previousOptimalDryRun,
        problemAnalysis,
        // Include other context fields if needed by the prompt
        question,
        language
      } = args;

      // Basic validation
      if (!question || !language || !previousOptimalCode) {
        return { success: false, error: "Missing required arguments for follow-up question." };
      }

      try {
        mainWindow.webContents.send("processing-status", { 
            message: "Processing follow-up question...", 
            progress: 50 // Or omit progress if not meaningful here
        });

        // Get the prompt
        const { promptText, systemPrompt } = getFollowUpPrompt(
          language,
          problemAnalysis || "", // Provide empty string if null/undefined
          previousOptimalCode,
          previousOptimalDryRun || "", // Provide empty string if null/undefined
          question
        );

        // Call AI service
        const responseContent = await aiService.generateCompletion(
          promptText,
          systemPrompt,
          undefined, // Config override (optional)
        );

        mainWindow.webContents.send("processing-status", { 
            message: "Parsing follow-up answer...",
            progress: 90
        });

        // Parse the response - expects { optimalImplementation: { code: ..., dryRun: ... } }
         let parsedJson: { optimalImplementation?: { code: string; dryRun: string } } = {};
         try {
             // Similar cleaning as narrative parser
             const cleanedResponse = responseContent.replace(/\`\`\`json\n?|\`\`\`/g, '').trim();
             if (!cleanedResponse.startsWith('{') || !cleanedResponse.endsWith('}')) {
                 throw new Error("Follow-up response is not a valid JSON object.");
             }
             parsedJson = JSON.parse(cleanedResponse);
         } catch (parseError) {
             console.error("Failed to parse follow-up response JSON:", parseError);
             console.error("Original follow-up response content:", responseContent.substring(0, 500));
             throw new Error(`Failed to parse follow-up AI response. Error: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
         }

        // Validate the structure
        if (!parsedJson.optimalImplementation || !parsedJson.optimalImplementation.code || typeof parsedJson.optimalImplementation.dryRun === 'undefined') {
          console.error("Parsed follow-up JSON missing expected structure:", parsedJson);
          throw new Error("Parsed follow-up JSON does not contain 'optimalImplementation' with 'code' and 'dryRun'.");
        }
        
        console.log("Follow-up processing successful.");
        // Return data in the format expected by frontend { success: true, data: OptimalImplementationHistory }
        return { success: true, data: parsedJson.optimalImplementation };

      } catch (error: any) {
        console.error("Error processing follow-up question:", error);
        mainWindow.webContents.send("processing-status", { error: error.message }); // Send error status
        return { success: false, error: error.message || "An unknown error occurred processing the follow-up." };
      }
    });

    // NEW: Submit user clarification to refine understanding
    console.log("Registering: submit-user-clarification");
    ipcMain.handle("submit-user-clarification", async (_event, {
      problemInfo,
      previousUnderstanding,
      previousExamples,
      previousQuestions,
      userClarification
    }: {
      problemInfo: any;
      previousUnderstanding: string;
      previousExamples: Array<{input: string; output: string; explanation?: string}>;
      previousQuestions: string[];
      userClarification: string;
    }) => {
      const mainWindow = deps.getMainWindow();
      if (!mainWindow) throw new Error("Main window not available");
      // Generate refined understanding
      const { promptText, systemPrompt } = getRefinedUnderstandingPrompt(
        problemInfo,
        previousUnderstanding,
        previousExamples,
        previousQuestions,
        userClarification
      );
      const responseContent = await aiService.generateCompletion(
        promptText,
        systemPrompt
      );
      const refined: ProblemUnderstandingData = responseParser.parseRefinedUnderstandingResponse(responseContent);
      return refined;
    });

    // NEW: Trigger solution generation after user confirmation
    console.log("Registering: trigger-solution-generation");
    ipcMain.handle("trigger-solution-generation", async (_event, {
      problemInfo,
      confirmedUnderstanding,
      confirmedExamples,
      language
    }: {
      problemInfo: any;
      confirmedUnderstanding: string;
      confirmedExamples: Array<{input: string; output: string; explanation?: string}>;
      language: string;
    }) => {
      const mainWindow = deps.getMainWindow();
      if (!mainWindow) throw new Error("Main window not available");
      // Generate solution based on confirmed understanding
      const { promptText, systemPrompt } = getNarrativeSolutionPrompt(
        language,
        problemInfo,
        confirmedUnderstanding,
        confirmedExamples
      );
      const responseContent = await aiService.generateCompletion(
        promptText,
        systemPrompt
      );
      const solutionData = responseParser.parseNarrativeResponse(responseContent);
      return solutionData;
    });

    // --- Behavioral Question Processing --- 
    console.log("Registering: process-behavioral-question");
    ipcMain.handle("process-behavioral-question", async (event, question: string): Promise<BehavioralProcessingResult> => {
      console.log(`[IPC] Received behavioral question: ${question}`);
      const mainWindow = deps.getMainWindow();
      const sendStatus = (message: string, progress: number) => {
        if (mainWindow) {
          mainWindow.webContents.send("processing-status", { message, progress });
        }
      };

      try {
        sendStatus("Loading behavioral data...", 10);

        // 1. Load LPs
        let amazonLPs: AmazonLP[] = [];
        try {
          const lpPath = app.isPackaged
            ? path.join(process.resourcesPath, 'data', 'amazon_lps.json')
            : path.join(__dirname, '..', 'src', 'data', 'amazon_lps.json');
          const lpData = await fs.readFile(lpPath, 'utf-8');
          amazonLPs = JSON.parse(lpData);
          console.log(`[IPC] Loaded ${amazonLPs.length} LPs from ${lpPath}`);
        } catch (err) {
          console.error("[IPC] Error loading amazon_lps.json:", err);
          return { success: false, error: "Failed to load Leadership Principles data." };
        }

        // 2. Load Stories
        let stories: BehavioralStory[] = [];
        try {
          const storiesPath = app.isPackaged
            ? path.join(process.resourcesPath, 'data', 'behavioral_stories.json')
            : path.join(__dirname, '..', 'src', 'data', 'behavioral_stories.json');
          const storiesData = await fs.readFile(storiesPath, 'utf-8');
          stories = JSON.parse(storiesData);
          console.log(`[IPC] Loaded ${stories.length} behavioral stories from ${storiesPath}`);
        } catch (err) {
          console.error("[IPC] Error loading behavioral_stories.json:", err);
          return { success: false, error: "Failed to load behavioral stories data." };
        }
        
        if (amazonLPs.length === 0 || stories.length === 0) {
          console.warn("[IPC] LPs or Stories data is empty.");
          // Depending on flow, maybe this isn't an error if generation is primary?
          // For now, let's return an error if selection is expected.
          // return { success: false, error: "Required behavioral data is empty." };
        }

        // 3. AI Call 1: Extract LPs from question
        sendStatus("Analyzing question for relevant principles...", 30);
        let extractedLPs: string[] = [];
        try {
          const { promptText, systemPrompt } = getBehavioralLPExtractionPrompt(question, amazonLPs);
          const extractionResponse = await aiService.generateCompletion(promptText, systemPrompt);
          // Basic JSON parsing (assuming simple array response)
          const cleanedExtraction = extractionResponse.replace(/```json\n?|```/g, '').trim();
          extractedLPs = JSON.parse(cleanedExtraction);
          if (!Array.isArray(extractedLPs) || !extractedLPs.every(item => typeof item === 'string')) {
            console.error("[IPC] LP Extraction response is not a string array:", cleanedExtraction);
            throw new Error("AI response for LP extraction was not a valid string array.");
          }
          console.log("[IPC] Extracted LPs from AI:", extractedLPs);
          if (extractedLPs.length === 0) {
             console.warn("[IPC] AI did not extract any relevant LPs for the question.");
             // Decide how to proceed - maybe select based on question keywords or fallback?
             // For now, let's default to the first LP if none are found to avoid errors downstream
             if (amazonLPs.length > 0) {
                 extractedLPs = [amazonLPs[0].name];
                 console.warn(`[IPC] Defaulting to first LP: ${extractedLPs[0]}`);
             } else {
                 throw new Error("No LPs extracted and no LPs loaded to use as default.");
             }
          }
        } catch (error) {
          console.error("[IPC] Error during LP extraction AI call:", error);
          throw new Error(`Failed during LP extraction: ${error instanceof Error ? error.message : String(error)}`);
        }
        
        // 4. AI Call 2: Select best story based on question + LPs
        sendStatus("Selecting relevant story...", 60);
        let storyId: string | null = null;
        let reasoning: string = "No selection attempted.";
        try {
          // Only attempt selection if stories exist
          if (stories.length > 0) {
              const { promptText, systemPrompt } = getBehavioralStorySelectionPrompt(question, extractedLPs, stories);
              const selectionResponse = await aiService.generateCompletion(promptText, systemPrompt);
              const cleanedSelection = selectionResponse.replace(/```json\n?|```/g, '').trim();
              const selectionResult = JSON.parse(cleanedSelection);
              
              // Validate selection result structure
              if (typeof selectionResult !== 'object' || selectionResult === null || 
                  !('selectedStoryId' in selectionResult) || typeof selectionResult.reasoning !== 'string') {
                   console.error("[IPC] Story Selection response has invalid structure:", cleanedSelection);
                  throw new Error("AI response for story selection had invalid structure.");
              }
              
              storyId = selectionResult.selectedStoryId; // Can be string or null
              reasoning = selectionResult.reasoning;
              console.log(`[IPC] AI Story Selection result: ID=${storyId}, Reasoning=${reasoning}`);
          } else {
              console.log("[IPC] No stories loaded, skipping story selection.");
              reasoning = "No stories available to select from.";
          }
        } catch (error) {
            console.error("[IPC] Error during Story Selection AI call:", error);
            // Don't throw here, allow fallback to generation
            reasoning = `Error during selection: ${error instanceof Error ? error.message : String(error)}. Proceeding to generation fallback.`;
            storyId = null; // Ensure storyId is null if selection failed
        }

        // 5. Process Selection Result
        if (storyId) {
          const selectedStory = stories.find(s => s.id === storyId);
          if (selectedStory) {
            sendStatus("Story selection complete.", 100);
            console.log(`[IPC] Returning selected story: ${storyId}`);
            return { success: true, selectedStory: selectedStory, reasoning: reasoning };
          } else {
            // Story ID was returned but not found in our list - internal error
            console.error(`[IPC] AI selected story ID ${storyId} but it was not found in loaded stories.`);
            reasoning += " (Error: Selected story ID not found internally)."; // Append internal error info
            // Fall through to return 'no story selected' state
          }
        }

        // 6. No Story Selected or Found
        // If storyId is null OR if it was non-null but not found in the list
        sendStatus("No suitable story found.", 100);
        console.log(`[IPC] No matching story found or selected. Reasoning: ${reasoning}`);
        return { 
          success: true, // Operation succeeded, just no story matched
          selectedStory: undefined, 
          generatedStoryText: undefined, // Ensure this is undefined
          reasoning: reasoning // Provide the reason why no story was selected (from AI or error)
        };

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error during behavioral processing.";
        console.error("[IPC] Error processing behavioral question:", error);
        sendStatus("Error processing request.", 100);
        return { success: false, error: errorMessage };
      } finally {
        // Potentially clear status after a delay?
      }
    });

    // --- Generate Behavioral Story Detail ---
    console.log("Registering: generate-behavioral-story-detail"); // Log registration
    ipcMain.handle('generate-behavioral-story-detail', async (event, storyId: string): Promise<BehavioralStoryDetailResult> => {
         console.log(`[IPC Handler] generate-behavioral-story-detail invoked for ID: ${storyId}`); // Log invocation

         // Check API Key
         if (!configHelper.hasApiKey()) {
             console.warn("[IPC] Generate detail failed: API key missing.");
             return { success: false, error: "API key is not configured." };
         }
         // Check storyId
         if (!storyId) {
             console.warn("[IPC] Generate detail failed: No story ID provided.");
             return { success: false, error: "No story ID provided." };
         }

          const mainWindow = deps.getMainWindow();
          const sendStatus = (message: string, progress?: number) => {
            // ... sendStatus logic ...
             if (mainWindow) {
               if (typeof message === 'string') {
                  mainWindow.webContents.send("story-detail-status", { message, progress });
               } else {
                   console.warn('[IPC] Attempted to send detail status with non-string message:', message);
               }
             }
          };

         try {
             sendStatus("Loading behavioral stories...", 10);
             // Load stories (assuming loadBehavioralStories is defined/imported correctly)
             // Let's reuse the global loadBehavioralStories function if defined, otherwise keep local temp one
             // const stories = await loadBehavioralStories(); // Assuming global function defined earlier
             // TEMP: Keeping local load logic for now, ensure it's robust
             let stories: BehavioralStory[] = [];
              try {
                const storiesPath = app.isPackaged
                  ? path.join(process.resourcesPath, 'data', 'behavioral_stories.json')
                  : path.join(__dirname, '..', 'src', 'data', 'behavioral_stories.json');
                const storiesData = await fs.readFile(storiesPath, 'utf-8');
                stories = JSON.parse(storiesData);
                if (!Array.isArray(stories)) {
                  throw new Error("Parsed stories data is not an array.");
                }
              } catch (err) {
                  console.error("[IPC] Error loading behavioral stories for detail generation:", err);
                  throw new Error("Failed to load stories for detail generation.");
              }

             const story = stories.find(s => s.id === storyId);

             if (!story) {
                 console.warn(`[IPC] Story ID ${storyId} not found for detail generation.`);
                  sendStatus(`Error: Story ID ${storyId} not found.`, 100);
                 return { success: false, error: `Story with ID ${storyId} not found.` };
             }

             sendStatus(`Found story \"${story.title}\". Generating detailed narrative...`, 30);
             // *** Use imported function, remove require ***
             // const { getBehavioralStoryDetailPrompt } = require("./prompts");
             const prompt = getBehavioralStoryDetailPrompt(story); // Uses imported function

             // const apiKey = configHelper.getApiKey(); // This should now work - INCORRECT
             const apiKey = configHelper.loadConfig().apiKey; // CORRECT way to get the key
             if (!apiKey) {
                throw new Error("API Key became unavailable during processing.");
             }

             // *** Use imported service, remove require ***
             // const { aiService } = require("./AIService");
             // const generatedText = await aiService.generateText(prompt, apiKey, { model: "gpt-4-turbo" }); // INCORRECT METHOD
             const generatedText = await aiService.generateCompletion(prompt, "", "gpt-4-turbo"); // CORRECT METHOD: Use generateCompletion, pass model override

             sendStatus("Detailed narrative generated successfully.", 100);
             console.log(`[IPC] Successfully generated detailed story for ID ${storyId}.`);
             return { success: true, detailedStory: generatedText };

         } catch (error) {
             console.error(`[IPC] Error in generate-behavioral-story-detail handler for ID ${storyId}:`, error);
             const errorMsg = error instanceof Error ? error.message : String(error);
              sendStatus(`Error: ${errorMsg}`, 100);
             return { success: false, error: `Failed to generate detailed story: ${errorMsg}` };
         }
    });
    // --- End Generate Behavioral Story Detail ---

    // --- Behavioral Follow-up Processing ---
    console.log("Registering: process-behavioral-follow-up");
    ipcMain.handle("process-behavioral-follow-up", async (event, args: {
      originalQuestion: string;
      selectedStory: BehavioralStory; // Use the defined interface
      followUpQuestion: string;
    }): Promise<{ success: boolean; explanation?: string; error?: string }> => {
      console.log(`[IPC] Received behavioral follow-up: ${args.followUpQuestion}`);
      const mainWindow = deps.getMainWindow();
      const sendStatus = (message: string, progress?: number) => {
        if (mainWindow) {
          // Use a different status message type maybe, or just update generic status
          mainWindow.webContents.send("processing-status", { message, progress });
        }
      };

      // Basic validation
      if (!args.originalQuestion || !args.selectedStory || !args.followUpQuestion) {
          console.error("[IPC] Missing arguments for behavioral follow-up.");
          return { success: false, error: "Missing required arguments for follow-up." };
      }

      try {
          sendStatus("Processing follow-up question...", 50);

          const { promptText, systemPrompt } = getBehavioralFollowUpPrompt(
              args.originalQuestion,
              args.selectedStory, 
              args.followUpQuestion
          );

          const responseContent = await aiService.generateCompletion(promptText, systemPrompt);
          const cleanedResponse = responseContent.replace(/```json\n?|```/g, '').trim();
          const parsedResult = JSON.parse(cleanedResponse);

          if (typeof parsedResult !== 'object' || parsedResult === null || typeof parsedResult.explanation !== 'string') {
              console.error("[IPC] Behavioral follow-up response has invalid structure:", cleanedResponse);
              throw new Error("AI response for behavioral follow-up had invalid structure.");
          }

          sendStatus("Follow-up processing complete.", 100);
          return { success: true, explanation: parsedResult.explanation };

      } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error during behavioral follow-up.";
          console.error("[IPC] Error processing behavioral follow-up:", error);
          sendStatus("Error processing follow-up.");
          return { success: false, error: errorMessage };
      }
    });
    // --- End Behavioral Follow-up Processing ---

    // --- Anticipated Follow-up Generation ---
    console.log("Registering: generate-anticipated-follow-ups");
    ipcMain.handle("generate-anticipated-follow-ups", async (event, args: {
      originalQuestion: string;
      selectedStory: BehavioralStory; // Use the defined interface
    }): Promise<{ success: boolean; followUps?: Array<{ question: string; answer: string }>; error?: string }> => {
      console.log(`[IPC] Generating anticipated follow-ups for story: ${args.selectedStory.id}`);
      const mainWindow = deps.getMainWindow();
      const sendStatus = (message: string, progress?: number) => {
        if (mainWindow) {
          mainWindow.webContents.send("processing-status", { message, progress });
        }
      };

      if (!args.originalQuestion || !args.selectedStory) {
        console.error("[IPC] Missing arguments for generating anticipated follow-ups.");
        return { success: false, error: "Missing required arguments."};
      }

      try {
        // No need for status updates here as it runs quickly after main response
        // sendStatus("Generating anticipated follow-ups...", 10);

        const { promptText, systemPrompt } = getAnticipatedBehavioralFollowUpsPrompt(
          args.originalQuestion,
          args.selectedStory
        );

        const responseContent = await aiService.generateCompletion(promptText, systemPrompt);
        const cleanedResponse = responseContent.replace(/```json\n?|```/g, '').trim();
        
        // Basic validation: Ensure it looks like an array
        if (!cleanedResponse.startsWith('[') || !cleanedResponse.endsWith(']')) {
            console.error("[IPC] Anticipated follow-ups response is not a valid JSON array string:", cleanedResponse.substring(0, 200));
            throw new Error("AI response for anticipated follow-ups was not a valid JSON array string.");
        }
        
        const parsedResult = JSON.parse(cleanedResponse);

        // More robust validation: check if it's an array of objects with correct keys
        if (!Array.isArray(parsedResult) || !parsedResult.every(item => 
            typeof item === 'object' && item !== null && 'question' in item && 'answer' in item &&
            typeof item.question === 'string' && typeof item.answer === 'string'
        )) {
          console.error("[IPC] Anticipated follow-ups response has invalid structure:", parsedResult);
          throw new Error("Parsed anticipated follow-ups JSON does not contain an array of {question, answer} objects.");
        }

        // sendStatus("Follow-up generation complete.", 100);
        console.log(`[IPC] Successfully generated ${parsedResult.length} anticipated follow-ups.`);
        return { success: true, followUps: parsedResult };

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error generating anticipated follow-ups.";
        console.error("[IPC] Error generating anticipated follow-ups:", error);
        // Don't send status error to user, as this is a background enhancement
        // sendStatus("Error generating follow-ups.");
        return { success: false, error: errorMessage };
      }
    });
    // --- End Anticipated Follow-up Generation ---

    // Process follow-up question handler (for coding)
    ipcMain.handle("process-follow-up", async (event, data) => {
      // ... existing code ...
    });

    console.log("IPC handler initialization complete.");

  } catch (error) {
    console.error("FATAL ERROR during IPC handler initialization:", error);
    // Optionally, notify the user via dialog or quit the app
    dialog.showErrorBox("Initialization Error", `Failed to initialize core application components: ${error.message}`)
    app.quit();
  }
}
