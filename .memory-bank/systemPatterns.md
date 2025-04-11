# System Patterns: CodeInterviewAssist

**Architectural Patterns:**

*   **Desktop Application:** Uses Electron to create a cross-platform desktop application.
*   **Main Process (`electron/`):** Handles core logic, window management, OS integration, and external API calls.
    *   `main.ts`: Entry point, app lifecycle, window creation/management, helper initialization, state management (window visibility, position, current view, etc.).
    *   `ProcessingHelper.ts`: Central hub for AI interactions (OpenAI, Gemini, Anthropic). Manages vision API calls for problem extraction and debugging, text generation for solutions. Constructs prompts, parses responses.
    *   `ConfigHelper.ts`: Manages loading, saving, and validating user configuration (API keys, models, provider).
    *   `ScreenshotHelper.ts`: Handles capturing screenshots, managing queues (main and extra/debug), generating previews, deleting files.
    *   `ShortcutsHelper.ts`: Registers and manages global keyboard shortcuts.
    *   `ipcHandlers.ts`: Defines listeners for requests coming from the renderer process via IPC.
    *   `preload.ts`: Securely bridges the main and renderer processes using `contextBridge`, exposing specific functions (`window.electronAPI`).
*   **Renderer Process (`src/`):** React-based UI displayed within the Electron window.
    *   `App.tsx`: Main component, manages global UI state (API key status, initialization, language), conditional rendering (Welcome vs. Main App vs. Settings), sets up context providers.
    *   `SettingsDialog.tsx`: Modal for configuring API provider, key, and model selections. Communicates with main process via `window.electronAPI` to load/save config.
    *   `SubscribedApp.tsx` (Inferred): Likely the main application UI displayed after initialization and API key setup.
    *   Communication: Interacts with the main process exclusively through the `window.electronAPI` object exposed by `preload.ts`.
*   **Inter-Process Communication (IPC):** Uses Electron's `ipcMain` (main) and `ipcRenderer` (preload/renderer) for asynchronous message passing between the main and renderer processes. `contextBridge` ensures security.

**Data Flow (Example: Initial Problem Solving):**

1.  **UI (`SubscribedApp.tsx`):** User triggers processing (e.g., clicks button or uses shortcut).
2.  **Renderer -> Preload:** Call `window.electronAPI.triggerProcessScreenshots()`.
3.  **Preload -> Main:** `ipcRenderer.invoke("trigger-process-screenshots")`.
4.  **Main (`ipcHandlers.ts`):** Handler for "trigger-process-screenshots" invokes `deps.processingHelper.processScreenshots()`.
5.  **Main (`ProcessingHelper.ts`):**
    *   Gets screenshot queue (`screenshotHelper.getScreenshotQueue`).
    *   Loads images, prepares API request (for configured provider/extraction model).
    *   Sends status updates to UI (`mainWindow.webContents.send("processing-status", ...)`).
    *   Calls AI API (OpenAI/Gemini/Anthropic).
    *   Parses problem JSON, stores it (`deps.setProblemInfo`).
    *   Sends `PROBLEM_EXTRACTED` event (`mainWindow.webContents.send(...)`).
    *   Calls internal `generateSolutionsHelper`.
    *   Sends request to solution model.
    *   Parses solution, thoughts, complexity.
    *   Sends `SOLUTION_SUCCESS` event (`mainWindow.webContents.send(...)`).
6.  **Preload -> Renderer:** Listeners (`onProblemExtracted`, `onSolutionSuccess`, `onProcessingStatus`) receive events via `ipcRenderer.on`.
7.  **UI (`SubscribedApp.tsx`):** Updates state based on received events and data, displaying progress, problem info, and final solution.

**Design Principles:**

*   **Privacy First:** Local processing emphasized; API keys stored locally; data sent only to the chosen external AI provider.
*   **User Control:** Users provide keys, choose providers/models.
*   **Extensibility:** Structure facilitates adding AI models (`ProcessingHelper.ts`, `SettingsDialog.tsx`), languages.
*   **Clear Separation:** Main process handles backend/OS tasks, Renderer handles UI, IPC manages communication.
*   **Open Source (AGPL-3.0):** Encourages community involvement.
*   **Simplicity:** Avoids complex infrastructure (auth servers, etc.). 