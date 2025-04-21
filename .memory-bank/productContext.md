# Product Context: CodeInterviewAssist

**Target Audience:** Students, recent graduates, and job seekers preparing for technical coding interviews, especially those facing verbally presented problems or lacking access to expensive commercial preparation tools.

**Key Features/Functionality:**

* **Core AI Assistance:**
  * Screenshot Capture: Smart capture of problem text and code.
  * **AI Problem Clarification:** Initial analysis of captured problem for ambiguity, responding with clarifying questions and assumptions if needed before proceeding to solution.
  * AI Problem Analysis: Extraction and understanding of requirements via Vision models (GPT-4o, potentially Gemini and others).
  * Solution Generation: Detailed solutions with explanations (Problem Understanding, Brute Force, Optimal Pseudocode, Optimal Analysis+Code), complexity analysis, and inline code comments.
  * Real-time Debugging: AI-assisted identification and correction of code errors based on screenshots.
* **User Experience:**
  * Invisibility: Undetectable window to bypass screen capture during interviews (with compatibility notes).
  * Window Management: Move, resize, opacity control, zoom.
  * Global Keyboard Shortcuts: Undetectable commands for core actions (visibility, capture, process, etc.).
  * Model Selection: Choice between different AI models (e.g., GPT-4o, GPT-4o-mini) for different tasks.
  * Language Selection: Support for multiple programming languages, easily switchable and persistent.
* **Principles:**
  * Privacy: Local processing, API key stored locally, no data sent except to the chosen AI API.
  * Free & Open Source: AGPL-3.0 licensed, community-driven.
  * Extensibility: Designed for adding new AI models and languages.
