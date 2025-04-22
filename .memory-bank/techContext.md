# Tech Context: CodeInterviewAssist

**Core Technologies:**

*   **Framework:** Electron (Main Process: Node.js, Renderer Process: Chromium)
*   **Frontend Library:** React (using Vite for development server and build)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, Radix UI (via shadcn/ui components like Dialog, Input, Button)
*   **State Management (UI):** React `useState`, `useEffect`, `useContext` (for Toast).
*   **Asynchronous Operations (UI):** TanStack Query (`QueryClientProvider`) - though usage seems minimal in core `App.tsx`.
*   **Runtime:** Node.js (v16+ required for Electron Main Process)
*   **Package Manager:** npm or bun

**External APIs / Dependencies:**

*   **AI Models:**
    *   OpenAI API (using `openai` library for Chat Completions - Vision & Text)
    *   Google Gemini API (using `axios` for direct REST calls to Generative Language API - Vision & Text)
    *   Anthropic Claude API (using `@anthropic-ai/sdk` library for Messages API - Vision & Text)
*   **Key Integration Points:**
    *   AI Logic & Multi-Provider Handling: `electron/ProcessingHelper.ts`
    *   Configuration (Loading/Saving Keys, Models): `electron/ConfigHelper.ts`, `src/components/Settings/SettingsDialog.tsx`
    *   Main/Renderer Communication Bridge: `electron/preload.ts` (exposes `window.electronAPI`), `electron/ipcHandlers.ts` (defines handlers)
*   **Other Libraries:**
    *   `axios`: For Gemini API calls.
    *   `dotenv`: Loading environment variables (primarily dev).
    *   `lucide-react`: Icons.

**Development Environment:**

*   Requires Git.
*   Platform-specific run scripts (`stealth-run.bat`, `stealth-run.sh`).
*   Build process: `npm install`, `npm run clean` (recommended), platform run script (which likely runs Vite build and Electron start).
*   Packaging scripts (`package-mac`, `package-win`) using `electron-builder` (inferred from `package.json`).

**Operating System Considerations:**

*   Cross-platform (Windows, macOS, Linux).
*   Specific configurations/permissions needed (macOS screen recording, script execution).
*   macOS/Linux requires script execution permissions (`chmod +x`

## Architecture & Key Components

*   **Framework:** Electron (Main Process + Renderer Process)
*   **Renderer:** React (using Vite), TypeScript, Tailwind CSS, Shadcn UI
*   **Main Process:** Node.js (Electron environment), TypeScript
*   **State Management (Renderer):** React state (`useState`, `useRef`), TanStack Query (for server state/async ops like fetching screenshots).
*   **Configuration:** `electron-store` for persistent settings (API keys, model choice, language, opacity). Managed by `ConfigHelper.ts`.
*   **AI Interaction:** Centralized in `AIService.ts` supporting multiple providers (OpenAI, Gemini, Anthropic). Uses `axios` for Gemini, official SDKs for OpenAI/Anthropic.
*   **Core Logic:**
    *   `ScreenshotHelper.ts`: Handles taking screenshots (platform-specific logic).
    *   `ProcessingHelper.ts`: Orchestrates the flow from screenshots to solution/debug analysis, manages abort controllers.
    *   `SolutionProcessor.ts`: Generates coding solutions using prompts from `prompts.ts`.
    *   `ResponseParser.ts`: Parses structured (JSON) and semi-structured (Markdown) responses from AI models.
    *   `ShortcutsHelper.ts`: Manages global keyboard shortcuts.
*   **UI Components:** Reusable components in `src/components/` (e.g., `SolutionCommands`, `ScreenshotQueue`, `SettingsDialog`). Pages/Views in `src/_pages/`.
*   **Main/Renderer Communication Bridge:** `electron/preload.ts` (exposes `window.electronAPI`), `electron/ipcHandlers.ts` (defines handlers).
*   **Styling:** Tailwind CSS utility classes, `components.json` for Shadcn UI theme.
*   **Build/Dev:** Vite for renderer HMR, `electron-builder` inferred from `package.json` for packaging.
*   **Auto-Update:** Uses `electron-updater` integrated in `autoUpdater.ts`.

## Planned Additions (Behavioral Feature)

*   **Data:**
    *   `src/data/amazon_lps.json`: Static list of Amazon Leadership Principles.
    *   `src/data/behavioral_stories.json`: User-provided STAR stories tagged with LPs.
*   **UI:**
    *   New state variable for `currentMode` (`coding` | `behavioral` | `settings`).
    *   New component: `src/pages/BehavioralAssistant.tsx`.
*   **Backend:**
    *   New IPC channel: `process-behavioral-question`.
    *   Handler will involve multiple sequential `AIService` calls (LP extraction, Story selection, Story generation fallback).
*   **State Management:** Add `currentMode` state to control view rendering.
*   **Shortcuts:** Add new global shortcut to switch to `behavioral` mode.