# Active Context

**Last Updated:** $(date +%Y-%m-%d %H:%M:%S)

✅ **Recent Changes:**

*   **Code Cleanup:** Moved shared types (`BehavioralStory`, `AmazonLP`) from `electron/ipcHandlers.ts` to `electron/types.ts` and updated imports. (Skipped uncommenting API call in `BehavioralAssistant.tsx` as it wasn't found).
*   **Tested Behavioral Assistant (End-to-End):** Confirmed initial question processing, story selection, reasoning display, anticipated follow-ups, user-initiated follow-ups, and detailed story generation (`generate-behavioral-story-detail`) are working correctly after recent fixes.
*   **Fixed AI Service Call Error:** Corrected a `TypeError` in the `generate-behavioral-story-detail` IPC handler (`electron/ipcHandlers.ts`) by changing the AI call from the non-existent `aiService.generateText()` to the correct `aiService.generateCompletion()`, adjusting parameters accordingly.
*   **Fixed API Key Retrieval Error:** Corrected a `TypeError` in the `generate-behavioral-story-detail` IPC handler (`electron/ipcHandlers.ts`) by changing the call from the non-existent `configHelper.getApiKey()` to the correct `configHelper.loadConfig().apiKey`.
*   **Behavioral Assistant UI Refactor & Anticipated Follow-ups:**
    *   Refactored `BehavioralAssistant.tsx` into a two-column layout.
    *   Implemented logic to automatically generate and display anticipated follow-up questions and answers in the right column after a story is selected.
    *   Added `getAnticipatedBehavioralFollowUpsPrompt` to `electron/prompts.ts`.
    *   Added `generate-anticipated-follow-ups` IPC handler to `electron/ipcHandlers.ts`.
    *   Updated `preload.ts` and `types/electron.d.ts` for the new IPC channel.
*   **Behavioral Assistant Prompt Engineering:**
    *   Refined `getBehavioralStorySelectionPrompt` to generate richer `reasoning` including STAR summary, impact, and lessons learned.
    *   Refined `getBehavioralFollowUpPrompt` to ensure answers maintain the confident tone and incorporate story context (impact/lessons).
*   **Resolved Runtime File Loading Error:** Fixed `ENOENT` error when loading data files (`amazon_lps.json`, `behavioral_stories.json`) in development by switching from `app.getAppPath()` to `__dirname` for relative path construction in `electron/ipcHandlers.ts`.
*   Configured `package.json` build settings (`extraResources`) to include `src/data` in packaged app resources.
*   Updated `electron/ipcHandlers.ts` to use `process.resourcesPath` (packaged) or `__dirname` (dev) for loading data files.
*   Corrected development path logic to point to `src/data` relative to `app.getAppPath()`.
*   **Resolved Build Error:** Fixed persistent Rollup error ("X is not exported by Y") by:
    *   Moving `prompts.ts` into the `electron/` directory.
    *   Creating `electron/types.ts` to hold shared interfaces (`ProblemInfo`, `ProblemExample`).
    *   Updating all relevant imports (`main.ts`, `prompts.ts`, `ResponseParser.ts`, `ipcHandlers.ts`) to use the new types file, breaking the circular dependency.
    *   Fixing a syntax error (missing closing `*/` comment) in `electron/prompts.ts` which was commenting out the exported functions.
*   **Behavioral Assistant - Step 1 (Data Stores):**
    *   Created placeholder `src/data/amazon_lps.json`.
    *   Created placeholder `src/data/behavioral_stories.json`.
    *   Populated JSON files with initial data.
*   **Behavioral Assistant - Step 2 (Shortcut & Mode):**
    *   Defined `CmdOrCtrl+Shift+B` (behavioral) and `CmdOrCtrl+Shift+C` (coding) shortcuts in `electron/shortcuts.ts`.
    *   Added `ViewMode` type and `onSetViewMode` listener to `preload.ts` and `types/electron.d.ts`.
    *   Implemented `currentMode` state (`'coding' | 'behavioral' | 'settings'`) and `codingSubView` state in `src/_pages/SubscribedApp.tsx`.
    *   Added `useEffect` in `SubscribedApp.tsx` to handle `set-view-mode` IPC messages.
*   **Behavioral Assistant - Step 3 (UI Component):**
    *   Created basic `src/pages/BehavioralAssistant.tsx` component with input, button, and result area.
    *   Updated `src/_pages/SubscribedApp.tsx` to import and render `BehavioralAssistant.tsx` when `currentMode` is `'behavioral'`.
    *   Enhanced `BehavioralAssistant.tsx` UI to display selected story details and reasoning.
    *   Added conditional UI elements for follow-up questions in `BehavioralAssistant.tsx`.
*   **Behavioral Assistant - Step 4 (Backend IPC - Initial Question):**
    *   Defined `process-behavioral-question` IPC channel.
    *   Added `processBehavioralQuestion` function signature to `types/electron.d.ts`.
    *   Added `processBehavioralQuestion` function to `electronAPI` in `preload.ts`.
*   **Behavioral Assistant - Step 5 (AI Workflow - Selection Only):**
    *   Implemented logic within `process-behavioral-question` handler in `electron/ipcHandlers.ts`.
    *   Loads LPs from `src/data/amazon_lps.json`.
    *   Loads stories from `src/data/behavioral_stories.json`.
    *   **AI Call 1 (LP Extraction):** Implemented using `aiService.generateCompletion` and `getBehavioralLPExtractionPrompt`.
    *   **AI Call 2 (Story Selection):** Implemented using `aiService.generateCompletion` and `getBehavioralStorySelectionPrompt`.
    *   Removed story generation fallback based on user clarification.
*   **Behavioral Assistant - Step 7 (Prompt Engineering):**
    *   Added prompts (`getBehavioralLPExtractionPrompt`, `getBehavioralStorySelectionPrompt`) to `prompts.ts`.
    *   Added prompt (`getBehavioralFollowUpPrompt`) to `prompts.ts`.
*   **Behavioral Assistant - Follow-up Implementation:**
    *   Added `getBehavioralFollowUpPrompt` to `prompts.ts`.
    *   Added `process-behavioral-follow-up` IPC handler to `electron/ipcHandlers.ts` with AI call.
    *   Added `processBehavioralFollowUp` signature to `types/electron.d.ts`.
    *   Added `processBehavioralFollowUp` function to `preload.ts`.
    *   Added `handleFollowUpSubmit` function (with placeholder call) to `BehavioralAssistant.tsx`.

---

### 🧠 Next Steps

*   **Address UI Polish/Refinement:** (From backlog) Review `BehavioralAssistant.tsx` for potential UI improvements (loading states, transitions, etc.).
*   **Investigate Mode Switching:** Check implementation of `CmdOrCtrl+Shift+C` shortcut and `set-view-mode` IPC handling in `SubscribedApp.tsx`. (User query)

---

### ❗ Active Decisions / Context

*   AI text/completion generation uses `aiService.generateCompletion()`.
*   API Key retrieval uses `configHelper.loadConfig().apiKey`.
*   Behavioral Assistant UI uses a two-column layout: Left for selected story/reasoning, Right for AI-generated anticipated follow-ups.
*   Anticipated follow-ups are generated automatically after a story is selected.
*   Reasoning for story selection is enriched to include STAR summary, impact, and lessons learned.
*   Answers to follow-up questions (both anticipated and user-initiated) should maintain a confident, natural tone and leverage story context.
*   Behavioral Assistant feature focuses solely on **selecting** pre-written user stories from `behavioral_stories.json`.
*   **AI Story Generation fallback is removed** per user clarification (user context not needed for generation).
*   Follow-up questions are implemented for selected behavioral stories.
*   Build errors related to `prompts.ts` exports are resolved.
*   Circular dependency between `main`, `ipcHandlers`, and `prompts` resolved by extracting types to `electron/types.ts`.
*   Configured `extraResources` in `package.json` to handle data files for packaging.
*   Path logic in `ipcHandlers.ts` updated to differentiate between packaged and development environments for data loading (now fixed using `__dirname` for dev).
*   UI for behavioral questions is conditionally rendered in the main view, triggered by `CmdOrCtrl+Shift+B`.
*   Follow-up questions feature for *coding* solutions remains complete and frozen.

## Active Context - CodeInterviewAssist

**Session Date:** 2024-07-30

**Current Focus:** Transitioning from follow-up questions to Behavioral Question Assistant feature.

---

### ✅ Recent Changes

*   Implemented end-to-end flow for follow-up questions on coding solutions.
*   Corrected IPC bridge signatures (`processFollowUpQuestion`).
*   Added IPC handler for `cancel-ongoing-requests`.
*   Updated `electron.d.ts` types for new/modified IPC functions.
*   Fixed sticky positioning for the follow-up UI section at the bottom of the viewport.

---

### 🧠 Next Steps

**Implement Behavioral Question Assistant Feature:**

1.  **Data Stores:**
    *   Create `src/data/amazon_lps.json` (Array of LP strings).
    *   Create `src/data/behavioral_stories.json` (Array of objects: `{ id: string | number, storyText: string, lps: string[] }`).
2.  **Shortcut & Mode:**
    *   Define a new global shortcut (e.g., `Cmd/Ctrl+Shift+B`) for behavioral mode.
    *   Implement `currentMode: 'coding' | 'behavioral' | 'settings'` state (likely in `App.tsx`).
    *   Update shortcut handlers to set the correct mode.
3.  **UI Component:**
    *   Create `src/pages/BehavioralAssistant.tsx`.
    *   Implement input field, submit button, and display area for results.
    *   Update `SubscribedApp.tsx` to conditionally render `BehavioralAssistant.tsx` based on `currentMode`.
4.  **Backend IPC:**
    *   Define `process-behavioral-question` IPC channel.
    *   Add corresponding function to `electronAPI` in `preload.ts`.
    *   Update `electron.d.ts` with the new function signature.
    *   Implement the handler in `ipcHandlers.ts`.
5.  **AI Workflow (in `process-behavioral-question` handler):**
    *   **AI Call 1 (LP Extraction):** Input user question + LP list -> Output JSON list of LPs.
    *   **AI Call 2 (Story Selection):** Input user question, extracted LPs, stories list -> Output JSON `{ selectedStoryId: ..., reasoning: ... }`.
    *   Retrieve and return selected story + reasoning.
    *   **Fallback:**
        *   **AI Call 3 (Story Generation):** Input user question, extracted LPs, user context (TBD) -> Output JSON `{ generatedStoryText: ... }`.
        *   Return generated story + disclaimer.
6.  **User Context for Generation:** Define mechanism (config/UI) - *Deferred*.
7.  **Prompt Engineering:** Iteratively develop and test prompts for all AI calls.

---

### ❗ Active Decisions / Context

*   Follow-up questions feature is complete and frozen.
*   Behavioral questions will use a multi-step AI process: LP extraction -> Story selection -> (Fallback) Story generation.
*   UI for behavioral questions will be conditionally rendered in the main view, triggered by a new shortcut.
*   AI will be used for both LP identification *and* story selection.
*   STAR stories and LP lists will be stored in dedicated JSON files.
*   AI-generated stories will require user background context (details TBD). 