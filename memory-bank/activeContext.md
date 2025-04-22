# Active Context

## ✅ Recent Changes

*   Resolved build error related to `getBehavioralLPExtractionPrompt` export and potential circular dependencies by moving `prompts.ts`.
*   Designed prompt template (`getBehavioralStoryDetailPrompt`) for generating rich, detailed behavioral story narratives from outlines.
*   Implemented backend logic (IPC handler `generate-behavioral-story-detail` in `electron/ipcHandlers.ts`) to handle detail generation requests using `aiService`.
*   Updated preload script (`electron/preload.ts`) to expose the new IPC channel.
*   Updated UI (`src/pages/BehavioralAssistant.tsx`) to:
    *   Add a button to trigger detailed story generation.
    *   Display loading states and errors for generation.
    *   Render the generated Markdown narrative using `react-markdown`.
    *   Make the detailed narrative display area scrollable.
    *   Implement real IPC call for follow-up questions.
*   Resolved build error by adding `react-markdown` and `remark-gfm` dependencies.
*   Diagnosed and fixed IPC errors: "No handler registered" and "configHelper.getApiKey is not a function" by ensuring handler code was present and removing mixed `require`/`import` usage.
*   Fixed UI console error related to `status.message.toLowerCase()` potentially being called on undefined.

## 🧠 Next Steps

*   **Test the implemented detailed story generation feature thoroughly.**
    *   Verify button appearance and function.
    *   Check loading states and status messages.
    *   Confirm successful Markdown rendering and scrolling.
    *   Assess quality of generated narrative.
    *   Test error handling.
*   Implement the proposed "Technical Details" side column feature after testing.

## ❗ Active Decisions / Context

*   Detailed story generation uses a backend API approach within the Electron main process.
*   The main process IPC handler (`generate-behavioral-story-detail`) orchestrates fetching the story, formatting the prompt, calling the AI (`gpt-4-turbo`), and returning the result.
*   UI uses `react-markdown` with `remark-gfm` for rendering.
*   Follow-up questions are now handled via a dedicated IPC call.
*   IPC handler initialization logging has been enhanced for debugging. 