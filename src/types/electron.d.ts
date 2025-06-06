export type ViewMode = 'coding' | 'behavioral' | 'settings';

// Define the structure for BehavioralStory if not already globally available
// Ideally, share this type between frontend and backend
interface BehavioralStory { 
  id: string;
  title: string;
  principles: string[];
  situation: string;
  task: string;
  action: string;
  result: string;
}

export interface ElectronAPI {
  // Original methods
  openSubscriptionPortal: (authData: {
    id: string
    email: string
  }) => Promise<{ success: boolean; error?: string }>
  updateContentDimensions: (dimensions: {
    width: number
    height: number
  }) => Promise<void>
  clearStore: () => Promise<{ success: boolean; error?: string }>
  getScreenshots: () => Promise<{
    success: boolean
    previews?: Array<{ path: string; preview: string }> | null
    error?: string
  }>
  deleteScreenshot: (
    path: string
  ) => Promise<{ success: boolean; error?: string }>
  onScreenshotTaken: (
    callback: (data: { path: string; preview: string }) => void
  ) => () => void
  onResetView: (callback: () => void) => () => void
  onSolutionStart: (callback: () => void) => () => void
  onDebugStart: (callback: () => void) => () => void
  onDebugSuccess: (callback: (data: any) => void) => () => void
  onSolutionError: (callback: (error: string) => void) => () => void
  onProcessingNoScreenshots: (callback: () => void) => () => void
  onProblemExtracted: (callback: (data: any) => void) => () => void
  onSolutionSuccess: (callback: (data: any) => void) => () => void
  onUnauthorized: (callback: () => void) => () => void
  onDebugError: (callback: (error: string) => void) => () => void
  openExternal: (url: string) => void
  toggleMainWindow: () => Promise<{ success: boolean; error?: string }>
  triggerScreenshot: () => Promise<{ success: boolean; error?: string }>
  triggerProcessScreenshots: () => Promise<{ success: boolean; error?: string }>
  triggerReset: () => Promise<{ success: boolean; error?: string }>
  triggerMoveLeft: () => Promise<{ success: boolean; error?: string }>
  triggerMoveRight: () => Promise<{ success: boolean; error?: string }>
  triggerMoveUp: () => Promise<{ success: boolean; error?: string }>
  triggerMoveDown: () => Promise<{ success: boolean; error?: string }>
  onSubscriptionUpdated: (callback: () => void) => () => void
  onSubscriptionPortalClosed: (callback: () => void) => () => void
  startUpdate: () => Promise<{ success: boolean; error?: string }>
  installUpdate: () => void
  onUpdateAvailable: (callback: (info: any) => void) => () => void
  onUpdateDownloaded: (callback: (info: any) => void) => () => void

  decrementCredits: () => Promise<void>
  setInitialCredits: (credits: number) => Promise<void>
  onCreditsUpdated: (callback: (credits: number) => void) => () => void
  onOutOfCredits: (callback: () => void) => () => void
  openSettingsPortal: () => Promise<void>
  getPlatform: () => string
  cancelOngoingRequests: () => Promise<{ success: boolean }>
  processFollowUpQuestion: (args: { previousOptimalCode: string; previousOptimalDryRun: string; problemAnalysis: string; question: string; language: string }) => Promise<{ success: boolean; data?: { code: string; dryRun: string }; error?: string }>
  
  // New methods for OpenAI integration
  getConfig: () => Promise<{ apiKey: string; model: string; language?: string; provider?: string; opacity?: number }>
  updateConfig: (config: { apiKey?: string; model?: string; language?: string; provider?: string; opacity?: number }) => Promise<boolean>
  checkApiKey: () => Promise<boolean>
  validateApiKey: (apiKey: string) => Promise<{ valid: boolean; error?: string }>
  openLink: (url: string) => void
  onApiKeyInvalid: (callback: () => void) => () => void
  removeListener: (eventName: string, callback: (...args: any[]) => void) => void

  // NEW: View mode switching
  onSetViewMode: (callback: (mode: ViewMode) => void) => () => void;

  // New methods for two-step confirmation
  submitUserClarification: (clarification: string) => Promise<{ success: boolean; error?: string; understanding?: string }>
  triggerSolutionGeneration: () => Promise<{ success: boolean; error?: string }>
  onUnderstandingGenerated: (callback: (understanding: string) => void) => () => void

  // NEW: Behavioral Question Processing
  processBehavioralQuestion: (question: string) => Promise<{ 
    success: boolean; 
    selectedStory?: BehavioralStory; 
    reasoning?: string; 
    error?: string 
  }>;

  // NEW: Behavioral Follow-up Processing
  processBehavioralFollowUp: (args: { 
    originalQuestion: string; 
    selectedStory: BehavioralStory; 
    followUpQuestion: string; 
  }) => Promise<{ success: boolean; explanation?: string; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
    electron: {
      ipcRenderer: {
        on: (channel: string, func: (...args: any[]) => void) => void
        removeListener: (
          channel: string,
          func: (...args: any[]) => void
        ) => void
      }
    }
    __CREDITS__: number
    __LANGUAGE__: string
    __IS_INITIALIZED__: boolean
    __AUTH_TOKEN__?: string | null
  }
}
