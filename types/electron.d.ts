// ... existing code ...
    decrementCredits: () => Promise<void>;
    processFollowUpQuestion: (args: any) => Promise<{ success: boolean; data?: any; error?: string }>; // Adjust 'any' as needed
    submitUserClarification: (args: any) => Promise<any>; // Adjust 'any' as needed
    triggerSolutionGeneration: (args: any) => Promise<any>; // Adjust 'any' as needed
    processBehavioralQuestion: (question: string) => Promise<any>; // Adjust 'any' later
    processBehavioralFollowUp: (args: { originalQuestion: string; selectedStory: any; followUpQuestion: string }) => Promise<{ success: boolean; explanation?: string; error?: string }>; // Adjust 'any' later
    generateAnticipatedFollowUps: (args: { originalQuestion: string; selectedStory: any }) => Promise<{ success: boolean; followUps?: Array<{ question: string; answer: string }>; error?: string }>; // Adjust 'any' later

    // Listeners
    on: (channel: string, func: (...args: any[]) => void) => void;
// ... existing code ... 