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