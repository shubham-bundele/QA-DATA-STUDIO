# QA Data Studio AI - Chrome Web Store Metadata

This document contains all the necessary metadata, descriptions, and justifications required for publishing the QA Data Studio AI extension to the Google Chrome Web Store.

## 1. Store Listing Details

**Item Name:** QA Data Studio AI
**Short Description (max 132 chars):** 
AI-powered test recorder, smart form filler, visual bug reporter, and locator inspector for QA Data Studio.

**Detailed Description:**
Supercharge your software testing workflow with the QA Data Studio AI Chrome Extension. This extension seamlessly connects your browser to the QA Data Studio platform, enabling intelligent, AI-driven automation directly on the websites you test.

Key Features:
- **Smart Form Filler:** Instantly generate and inject highly realistic, varied test data (names, emails, boundary values, etc.) into any web form using AI. No more manual typing.
- **Locator Inspector:** Hover over any element to automatically generate robust Playwright, Cypress, CSS, and XPath locators. Click to copy them directly into your scripts.
- **AI Test Recorder:** Record your clicks and typing actions in plain English. Generate ready-to-run Playwright or Cypress scripts instantly on the QA Data Studio dashboard.
- **In-Browser Accessibility (a11y) Scanner:** Extract the DOM of any page (even localhost or behind auth) and send it to our AI Orchestrator to identify missing ARIA labels, contrast issues, and structural defects.
- **Visual Bug Reporter:** Draw a box over a UI bug, and let our Vision AI instantly draft a professional bug report (including Expected vs Actual behavior) based on the screenshot.

*Note: This extension requires an active connection to QA Data Studio (running locally or in the cloud).*

**Category:** Developer Tools
**Language:** English

## 2. Privacy Policy & Permissions

**Privacy Practices:**
- The extension DOES NOT collect or sell user data.
- The extension DOES NOT track browsing history.
- The extension ONLY captures screenshots or DOM data when explicitly triggered by the user via the extension popup.

**Permission Justifications (Manifest V3):**

| Permission | Justification |
| :--- | :--- |
| `activeTab` | Required to inject content scripts (Inspector, Recorder, Filler, Scanner, Bug Reporter) into the currently visible tab only when the user clicks the extension action. |
| `scripting` | Required to dynamically inject CSS highlights and JavaScript logic into the active tab for element inspection, recording, and form filling. |
| `storage` | Required to temporarily store accessibility scan results so they can be securely passed to the QA Data Studio dashboard. |
| `host_permissions` (`<all_urls>`) | Required so the extension can generate test data, inspect locators, and record scripts on *any* web application the QA engineer is testing, regardless of the domain. |

## 3. Reviewer Instructions

**Instructions for Chrome Web Store Reviewers:**
1. Open any webpage with a standard HTML form (e.g., a login or registration page).
2. Click the QA Data Studio extension icon in the toolbar.
3. Click "Fill Now". The extension will use our backend API to generate mock data and populate the form fields.
4. Click "Start Locator Inspector" and hover over elements on the page to see the blue highlight. Click an element to view the generated automation locators.
5. All external API calls are made securely to the QA Data Studio API. The extension does not perform background tracking.

## 4. Graphics Assets Required (For Publishing)

Before publishing, ensure the following assets are generated and placed in the `icons/` folder:
- **Store Icon:** `128x128` pixels (PNG).
- **Promo Tile (Small):** `440x280` pixels (PNG/JPEG).
- **Screenshots:** At least 1 (up to 5) `1280x800` or `640x400` pixels screenshots demonstrating the extension UI and the Locator Inspector in action.

