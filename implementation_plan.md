# Goal Description
Build an Interactive Playwright Generator with DOM Context Awareness and a VS Code Extension.

## Open Questions
- None right now, the requirements are clear. We will build a chat-like interactive wizard for automation building and a companion VS Code Extension to natively integrate script generation.

## Proposed Changes

### 1. Interactive Automation Builder (Next.js)
We will revamp the \utomation-builder\ to be an interactive chat-based wizard.
- **[MODIFY]** \src/app/(app)/automation-builder/page.tsx\: Transform from a single-prompt UI to an interactive conversation (like a chat) where the AI can ask the user to paste HTML snippets for specific elements. Add options for Framework Styles (e.g., Playwright POM, Playwright Cucumber BDD, Cypress).
- **[NEW]** \src/app/api/build-automation-interactive/route.ts\: A new chat-based API route that maintains history. It will evaluate the user's provided HTML snippets and decide if it has enough DOM context to write reliable locators. If yes, it generates the full multi-file script output (e.g., POM classes + specs).

### 2. VS Code Extension (Native Integration)
To answer the user's question ("are there any other way we can directly include this app in vscode"), we will build a lightweight VS Code Extension that connects to the QA Data Studio backend.
- **[NEW]** \scode-extension/package.json\ & \scode-extension/extension.js\: A fully functional VS Code extension.
  - **Feature**: Right-click on any HTML file in VS Code -> "QA Studio: Generate Playwright Script from HTML".
  - **Feature**: It sends the HTML DOM to your local QA Data Studio backend, which generates the robust script (POM or BDD) and automatically creates the \.spec.ts\ files right in your VS Code workspace.

## Verification Plan
- Start the Next.js dev server and verify the new chat-like Automation Builder.
- Verify the API prompts the user for more HTML if the locators are ambiguous.
- Package the VS Code extension and provide instructions on how to load it as an "Unpacked Extension" to test the native integration.
