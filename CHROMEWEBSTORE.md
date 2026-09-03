# Chrome Web Store Listing — QA Data Studio Inspector

> Last Updated: 2026-09-03

## Store Listing

**Extension Name** [REQUIRED]
QA Data Studio Inspector

**Short Description** [REQUIRED]
Instantly generate robust Playwright, Cypress, and Selenium locators with an interactive DOM inspector and auto-healing strategies.

**Detailed Description** [REQUIRED]
The QA Data Studio Inspector is an advanced, lightweight browser extension designed for QA engineers and test automation developers. It dramatically speeds up test creation by allowing you to point, click, and instantly generate robust, production-ready locators for Playwright, Cypress, and Selenium.

Features:
- Live Playground: Test your CSS and XPath selectors instantly with live DOM highlighting.
- Auto-Healing & Fragility Warnings: Automatically detects brittle locators (like long nth-child chains or dynamic hashes).
- Shadow DOM & iFrame Detection: Alerts you when elements are hidden inside Shadow DOMs or cross-origin iFrames.
- Relative Locators & Smart Fallbacks: Automatically generates anchor-based relative locators (e.g., rightOf).
- Element State Snapshots: Instantly view whether an element is visible, enabled, or hidden.
- Direct IDE Export: One-click export to send generated locators and assertions directly to your VS Code editor.

**Category** [REQUIRED]
Developer Tools

**Single Purpose** [REQUIRED]
Generates robust automation locators for web elements via an interactive DOM inspector.

**Primary Language** [REQUIRED]
English

## Graphics & Assets

You will need to create:
1. A 128x128 Icon (update `chrome-extension/icons/icon-128.png`).
2. At least one 1280x800 Screenshot showing the tool.

## Permissions Justification

| Permission | Type | Justification |
|------------|------|---------------|
| activeTab | permissions | Required to safely access the currently active web page only when the user explicitly clicks the extension icon. |
| scripting | permissions | Required to inject the interactive inspector UI (HTML/CSS/JS) into the active tab so the user can select and analyze DOM elements. |
| http://localhost:3001/* | host_permissions | Required to send generated locators locally to the user's VS Code extension (QA Data Studio Desktop App) when they click "Send to VS Code". |

## Privacy & Data Use
Does the extension collect user data? **No**
