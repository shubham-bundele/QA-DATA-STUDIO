import { GoogleGenAI, getAIStatus } from "@/lib/llm-client";

// --- EXISTING CODE FROM ai-orchestrator.ts (simplified to just export the needed interfaces and fallbacks) ---
export interface FallbackTestCase {
  id: string;
  title: string;
  type: string;
  priority: string;
  steps: string[];
  expectedResult: string;
  generatedBy: string;
}

export function generateFallbackTestCases(userStory: string): FallbackTestCase[] {
  const s = userStory.toLowerCase();
  const cases: FallbackTestCase[] = [];
  let n = 1;
  const id = (name: string) => `RULE-${String(n++).padStart(3,"0")}-${name}`;

  // Always-present baseline tests
  cases.push(
    { id: id("happy-path"), title: "Happy Path - Valid Input", type: "positive", priority: "high",
      steps: ["Navigate to the feature","Enter all required fields with valid data","Submit"],
      expectedResult: "System accepts input and shows success confirmation", generatedBy: "rule-engine" },
    { id: id("missing-required"), title: "Negative - Missing Required Fields", type: "negative", priority: "high",
      steps: ["Leave all required fields empty","Attempt to submit"],
      expectedResult: "Validation errors shown for each required field", generatedBy: "rule-engine" },
    { id: id("empty-whitespace"), title: "Edge - Whitespace-Only Input", type: "edge", priority: "medium",
      steps: ["Enter only spaces in all text fields","Attempt to submit"],
      expectedResult: "Whitespace treated as empty; validation error shown", generatedBy: "rule-engine" }
  );

  return cases;
}

// --- NEW FALLBACKS FOR AUTOMATION BUILDER ---

export function generateFallbackClarifications(): string[] {
  return [
    "What is the target URL or environment for this test?",
    "Are there specific user credentials or roles required to execute this?",
    "Which browsers or devices should this test script target?"
  ];
}

export function extractFallbackLocators(html: string): any[] {
  // Very basic regex-based fallback locator extraction
  const locators = [];
  
  // Extract data-testid
  const testIdRegex = /data-testid=["']([^"']+)["']/g;
  let match;
  while ((match = testIdRegex.exec(html)) !== null) {
    locators.push({
      name: `Element_${match[1]}`,
      primary: `[data-testid="${match[1]}"]`,
      fallback: `//*[@data-testid="${match[1]}"]`,
      score: 95,
      reason: "Extracted via local fallback orchestrator (data-testid)"
    });
  }

  // Extract id
  const idRegex = /id=["']([^"']+)["']/g;
  while ((match = idRegex.exec(html)) !== null) {
    if (!locators.find(l => l.primary.includes(match[1]))) {
      locators.push({
        name: `Element_${match[1]}`,
        primary: `#${match[1]}`,
        fallback: `//*[@id="${match[1]}"]`,
        score: 80,
        reason: "Extracted via local fallback orchestrator (id)"
      });
    }
  }

  // If none found, provide a dummy
  if (locators.length === 0) {
    locators.push({
      name: 'Body',
      primary: 'body',
      fallback: 'html',
      score: 10,
      reason: "No standard locators found by fallback orchestrator"
    });
  }

  return locators;
}

export function generateFallbackAutomationCode(story: string, locators: any[], framework: string): any {
  const files: any[] = [];
  const fw = framework.toLowerCase();

  const readmeContent = [
    '# QA Data Studio Generated Suite',
    '',
    '**Framework**: ' + framework,
    '**User Story**: ' + story.slice(0, 100) + '...',
    '',
    '## How to use these files',
    "Please place these files in your project directory according to your framework's standard folder structure.",
    'Remember to install dependencies for ' + framework + ' using your package manager.',
    '',
    '## QA Data Studio VS Code Extension',
    'For an advanced developer experience, please install our VS Code extension!',
    '1. Download the `.vsix` file.',
    '2. In VS Code, open the Extensions View (Ctrl+Shift+X).',
    '3. Click the "..." menu at the top right and select "Install from VSIX...".',
    '4. Select the downloaded extension to enable AI-powered Locator auto-completion right in your IDE!'
  ].join('\\n');

  files.push({ name: 'README.md', language: 'markdown', content: readmeContent });

  // Helper to safely format class/variable names
  const safeName = (name: string) => name.replace(/[^a-zA-Z0-9]/g, '') || 'Element';
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const storyFirstLine = story.split('\n')[0].replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 40).trim() || 'Feature';
  const safeFilename = storyFirstLine.replace(/\s+/g, '_').toLowerCase();

  if (fw.includes("bdd") || fw.includes("cucumber")) {
    const featureContent = `Feature: ${storyFirstLine}
  
  Background:
    Given I navigate to the base URL

  Scenario: Validate core functionality of the user story
    When I interact with the following elements:
${locators.map(l => `      | ${safeName(l.name)} |`).join('\n')}
    Then the action is completed successfully`;

    const stepDefsContent = `import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { PageObject } from './PageObject';

Given('I navigate to the base URL', async function() {
  await this.page.goto('/');
});

When('I interact with the following elements:', async function(dataTable) {
  const pageObject = new PageObject(this.page);
  const elements = dataTable.rawTable.flat();
  for (const el of elements) {
    // Boilerplate step: click or fill each extracted locator
    console.log('Interacting with ' + el);
  }
});

Then('the action is completed successfully', async function() {
  await expect(this.page.locator('body')).toBeVisible();
});`;

    const pomContent = `import { Page, Locator } from '@playwright/test';

export class PageObject {
  readonly page: Page;
${locators.map(l => `  readonly ${safeName(l.name)}: Locator;`).join('\n')}

  constructor(page: Page) {
    this.page = page;
${locators.map(l => `    this.${safeName(l.name)} = page.locator('${l.primary}');`).join('\n')}
  }
}`;

    files.push({ name: `${safeFilename}.feature`, language: 'gherkin', content: featureContent });
    files.push({ name: 'step_definitions.ts', language: 'typescript', content: stepDefsContent });
    files.push({ name: 'PageObject.ts', language: 'typescript', content: pomContent });
    files.push({ name: 'cucumber.js', language: 'javascript', content: `module.exports = { default: '--publish-quiet' };` });

  } else if (fw.includes("playwright") && fw.includes("python")) {
    files.push({
      name: 'page_object.py', language: 'python',
      content: `class GeneratedPage:
    def __init__(self, page):
        self.page = page
${locators.map(l => `        self.${safeName(l.name).toLowerCase()} = page.locator('${l.primary}')`).join('\n')}
`
    });
    files.push({
      name: 'test_spec.py', language: 'python',
      content: `import re
from playwright.sync_api import Page, expect
from page_object import GeneratedPage

def test_generated_scenario(page: Page):
    # Story: ${story.slice(0, 60)}...
    page_obj = GeneratedPage(page)
    page.goto("/")
    # Auto-generated interactions
${locators.map(l => `    expect(page_obj.${safeName(l.name).toLowerCase()}).to_be_visible()`).join('\n')}
`
    });

  } else if (fw.includes("playwright")) {
    // Default Playwright TypeScript/JavaScript
    files.push({
      name: 'PageObject.ts', language: 'typescript',
      content: `import { Page, Locator } from '@playwright/test';\n\nexport class GeneratedPage {\n  readonly page: Page;\n${locators.map(l => `  readonly ${safeName(l.name)}: Locator;`).join('\n')}\n\n  constructor(page: Page) {\n    this.page = page;\n${locators.map(l => `    this.${safeName(l.name)} = page.locator('${l.primary}');`).join('\n')}\n  }\n}`
    });
    files.push({
      name: 'test.spec.ts', language: 'typescript',
      content: `import { test, expect } from '@playwright/test';\nimport { GeneratedPage } from './PageObject';\n\n// Story: ${story.slice(0, 80).replace(/\n/g, ' ')}\ntest('Generated test scenario', async ({ page }) => {\n  const generatedPage = new GeneratedPage(page);\n  await page.goto('/');\n\n  // Assertions for extracted locators\n${locators.map(l => `  await expect(generatedPage.${safeName(l.name)}).toBeVisible();`).join('\n')}\n});`
    });

  } else if (fw.includes("cypress")) {
    files.push({
      name: 'pageObject.cy.js', language: 'javascript',
      content: `export class GeneratedPage {\n${locators.map(l => `  get${cap(safeName(l.name))}() { return cy.get('${l.primary}'); }`).join('\n')}\n}`
    });
    files.push({
      name: 'test.cy.js', language: 'javascript',
      content: `import { GeneratedPage } from './pageObject.cy.js';\n\ndescribe('Generated Test Suite', () => {\n  it('Executes scenario for: ${story.slice(0, 40)}...', () => {\n    const page = new GeneratedPage();\n    cy.visit('/');\n${locators.map(l => `    page.get${cap(safeName(l.name))}().should('be.visible');`).join('\n')}\n  });\n});`
    });

  } else if (fw.includes("selenium") && fw.includes("python")) {
    files.push({
      name: 'page_object.py', language: 'python',
      content: `from selenium.webdriver.common.by import By\n\nclass GeneratedPage:\n    def __init__(self, driver):\n        self.driver = driver\n${locators.map(l => `        self.${safeName(l.name).toLowerCase()} = (By.CSS_SELECTOR, '${l.primary}')`).join('\n')}\n`
    });
    files.push({
      name: 'test_spec.py', language: 'python',
      content: `import pytest\nfrom page_object import GeneratedPage\n\ndef test_scenario(driver):\n    page = GeneratedPage(driver)\n    driver.get("http://localhost")\n    # Implement interactions using WebDriverWait\n`
    });

  } else if (fw.includes("selenium") && fw.includes("c#")) {
    files.push({
      name: 'PageObject.cs', language: 'csharp',
      content: `using OpenQA.Selenium;\n\npublic class GeneratedPage {\n    private IWebDriver _driver;\n    public GeneratedPage(IWebDriver driver) { _driver = driver; }\n\n${locators.map(l => `    public IWebElement ${cap(safeName(l.name))} => _driver.FindElement(By.CssSelector("${l.primary}"));`).join('\n')}\n}`
    });
    files.push({
      name: 'TestSpec.cs', language: 'csharp',
      content: `using NUnit.Framework;\n\n[TestFixture]\npublic class GeneratedTests {\n    [Test]\n    public void TestScenario() {\n        // Setup driver and use GeneratedPage\n    }\n}`
    });

  } else if (fw.includes("selenium")) {
    // Default to Java
    files.push({
      name: 'PageObject.java', language: 'java',
      content: `import org.openqa.selenium.By;\nimport org.openqa.selenium.WebDriver;\nimport org.openqa.selenium.WebElement;\n\npublic class GeneratedPage {\n    private WebDriver driver;\n${locators.map(l => `    private By ${safeName(l.name)} = By.cssSelector("${l.primary}");`).join('\n')}\n\n    public GeneratedPage(WebDriver driver) {\n        this.driver = driver;\n    }\n\n${locators.map(l => `    public WebElement get${cap(safeName(l.name))}() {\n        return driver.findElement(${safeName(l.name)});\n    }`).join('\n')}\n}`
    });
    files.push({
      name: 'TestSpec.java', language: 'java',
      content: `import org.junit.jupiter.api.Test;\n\npublic class TestSpec {\n  @Test\n  public void testScenario() {\n    // Story: ${story.slice(0, 50).replace(/\n/g, ' ')}\n    // Add Selenium Java JUnit/TestNG logic here\n  }\n}`
    });

  } else if (fw.includes("appium")) {
    files.push({
      name: 'MobilePageObject.java', language: 'java',
      content: `import io.appium.java_client.pagefactory.AndroidFindBy;\nimport io.appium.java_client.pagefactory.iOSXCUITFindBy;\nimport org.openqa.selenium.WebElement;\n\npublic class MobilePage {\n${locators.map(l => `    @AndroidFindBy(accessibility = "${l.primary}")\n    @iOSXCUITFindBy(accessibility = "${l.primary}")\n    private WebElement ${safeName(l.name)};`).join('\n')}\n}`
    });
    files.push({
      name: 'MobileTestSpec.java', language: 'java',
      content: `public class MobileTestSpec {\n  // Setup AppiumDriver and DesiredCapabilities\n}`
    });

  } else if (fw.includes("webdriverio")) {
    files.push({
      name: 'pageObject.js', language: 'javascript',
      content: `class GeneratedPage {\n${locators.map(l => `    get ${safeName(l.name)}() { return $('${l.primary}'); }`).join('\n')}\n}\n\nmodule.exports = new GeneratedPage();`
    });
    files.push({
      name: 'test.spec.js', language: 'javascript',
      content: `const Page = require('./pageObject');\n\ndescribe('Generated Suite', () => {\n    it('should run scenario', async () => {\n        await browser.url('/');\n${locators.map(l => `        await expect(Page.${safeName(l.name)}).toBeDisplayed();`).join('\n')}\n    });\n});`
    });

  } else {
    files.push({
      name: 'page_object.txt', language: 'plaintext',
      content: `// Boilerplate for ${framework}\n// Target Locators:\n${locators.map(l => `// - ${l.name}: ${l.primary}`).join('\n')}`
    });
    files.push({
      name: 'test_script.txt', language: 'plaintext',
      content: `// Generated test script for: ${story.slice(0, 50)}...`
    });
  }

  return { files };
}

