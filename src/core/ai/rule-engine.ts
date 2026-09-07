import { QA_KNOWLEDGE_BASE, DOMAIN_KNOWLEDGE } from './qa-knowledge-base';

export interface GeneratedTestCase {
  id: string;
  title: string;
  category: 'positive' | 'negative' | 'boundary' | 'security';
  priority: 'high' | 'medium' | 'low';
  domain: string;
  generatorLink: string;
  dataFields: string[];
  gherkin: {
    given: string;
    when: string;
    then: string;
  };
  steps?: string[];
  expectedResult?: string;
}

export interface StoryDecomposition {
  actors: string[];
  actions: string[];
  preconditions: string[];
  outcomes: string[];
  edgeCases: string[];
}

export interface DomainDetection {
  domain: string;
  confidence: number;
  keywords: string[];
  generatorLink: string;
}

export interface AnalysisResult {
  decomposition: StoryDecomposition;
  testCases: GeneratedTestCase[];
  recommendations: string[];
  summary: {
    totalCases: number;
    byCategory: Record<string, number>;
    byDomain: Record<string, number>;
    byPriority: Record<string, number>;
  };
  detectedDomains: DomainDetection[];
  userStory?: string;
}

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  'user-profile': ['profile', 'user', 'account', 'registration', 'signup', 'sign up', 'personal', 'avatar', 'preferences', 'settings'],
  'banking': ['payment', 'pay', 'transfer', 'bank', 'transaction', 'charge', 'billing', 'deposit', 'withdrawal', 'balance', 'account'],
  'credit-card': ['credit card', 'card', 'visa', 'mastercard', 'amex', 'cvv', 'expiry', 'billing'],
  'address': ['address', 'shipping', 'billing', 'delivery', 'postal', 'zip', 'street', 'city'],
  'api': ['api', 'endpoint', 'rest', 'graphql', 'request', 'response', 'json', 'webhook', 'integration'],
  'security': ['login', 'auth', 'authentication', 'authorization', 'password', 'security', 'permission', 'role', 'access', 'token', 'session'],
  'file-upload': ['upload', 'file', 'attachment', 'import', 'document', 'image', 'csv', 'excel'],
  'search': ['search', 'find', 'query', 'filter', 'lookup', 'autocomplete'],
  'crud': ['create', 'read', 'update', 'delete', 'list', 'view', 'edit', 'remove', 'manage']
};

const DOMAIN_GENERATOR_LINKS: Record<string, string> = {
  'user-profile': '/generators/user-profile',
  'banking': '/generators/banking',
  'credit-card': '/generators/credit-card',
  'address': '/generators/address',
  'api': '/generators/json',
  'security': '/generators/json',
  'file-upload': '/generators/json',
  'search': '/generators/json',
  'crud': '/generators/json'
};

function detectDomains(story: string): DomainDetection[] {
  const lowerStory = story.toLowerCase();
  const detected: DomainDetection[] = [];
  
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const matches = keywords.filter(kw => lowerStory.includes(kw.toLowerCase()));
    if (matches.length > 0) {
      detected.push({
        domain,
        confidence: Math.min(0.9, 0.3 + matches.length * 0.15),
        keywords: matches,
        generatorLink: DOMAIN_GENERATOR_LINKS[domain] || '/generators/json'
      });
    }
  }
  
  if (detected.length === 0) {
    detected.push({
      domain: 'api',
      confidence: 0.5,
      keywords: ['generic'],
      generatorLink: '/generators/json'
    });
  }
  
  return detected.sort((a, b) => b.confidence - a.confidence);
}

function decomposeStory(story: string): StoryDecomposition {
  const lower = story.toLowerCase();
  const decomposition: StoryDecomposition = {
    actors: [],
    actions: [],
    preconditions: [],
    outcomes: [],
    edgeCases: []
  };
  
  // Extract actors
  const actorPatterns = [
    /\b(user|customer|admin|manager|operator|agent|client|buyer|seller)\b/gi,
    /\b(as a|as an)\s+(\w+)/gi
  ];
  actorPatterns.forEach(p => {
    const matches = story.match(p);
    if (matches) decomposition.actors.push(...matches.map(m => m.replace(/^(as a|as an)\s+/i, '').trim()));
  });
  if (decomposition.actors.length === 0) decomposition.actors = ['User'];
  
  // Extract actions
  const actionPatterns = [
    /\b(click|submit|enter|input|select|choose|upload|download|create|update|delete|view|search|filter|login|logout|register|pay|transfer|verify|validate)\b/gi
  ];
  actionPatterns.forEach(p => {
    const matches = story.match(p);
    if (matches) decomposition.actions.push(...matches.map(m => m.toLowerCase()));
  });
  decomposition.actions = [...new Set(decomposition.actions)];
  if (decomposition.actions.length === 0) decomposition.actions = ['perform action', 'submit'];
  
  // Extract preconditions
  const precondPatterns = [
    /\b(given|when|if|provided that|assuming|precondition|prerequisite)\s+([^.]+)/gi,
    /\b(must have|should have|requires?|needs?)\s+([^.]+)/gi
  ];
  precondPatterns.forEach(p => {
    const matches = story.match(p);
    if (matches) decomposition.preconditions.push(...matches.map(m => m.replace(/^(given|when|if|provided that|assuming|precondition|prerequisite|must have|should have|requires?|needs?)\s+/i, '').trim()));
  });
  if (decomposition.preconditions.length === 0) decomposition.preconditions = ['System is available', 'User has valid credentials'];
  
  // Extract outcomes
  const outcomePatterns = [
    /\b(then|should|must|will|expect|result|outcome)\s+([^.]+)/gi,
    /\b(success|confirmation|created|updated|deleted|saved)\b/gi
  ];
  outcomePatterns.forEach(p => {
    const matches = story.match(p);
    if (matches) decomposition.outcomes.push(...matches.map(m => m.replace(/^(then|should|must|will|expect|result|outcome)\s+/i, '').trim()));
  });
  if (decomposition.outcomes.length === 0) decomposition.outcomes = ['Operation completes successfully', 'Confirmation is displayed'];
  
  // Generate edge cases
  decomposition.edgeCases = [
    'Empty required fields',
    'Maximum length input',
    'Special characters in input',
    'Concurrent operations',
    'Network timeout',
    'Invalid data format'
  ];
  
  return decomposition;
}

function generateTestCases(
  story: string, 
  domains: DomainDetection[], 
  decomposition: StoryDecomposition
): GeneratedTestCase[] {
  const cases: GeneratedTestCase[] = [];
  let counter = 1;
  const primaryDomain = domains[0]?.domain || 'api';
  const domainKnowledge = DOMAIN_KNOWLEDGE[primaryDomain] || '';
  
  const id = (suffix: string) => `TC-${String(counter++).padStart(4, '0')}-${suffix}`;
  
  // ALWAYS: Happy Path
  cases.push({
    id: id('happy-path'),
    title: 'Happy Path - Valid Input',
    category: 'positive',
    priority: 'high',
    domain: primaryDomain,
    generatorLink: DOMAIN_GENERATOR_LINKS[primaryDomain] || '/generators/json',
    dataFields: getDomainFields(primaryDomain),
    gherkin: {
      given: decomposition.preconditions[0] || 'User is on the page',
      when: `User ${decomposition.actions[0] || 'performs the action'} with valid data`,
      then: decomposition.outcomes[0] || 'Operation completes successfully'
    }
  });
  
  // ALWAYS: Missing Required Fields
  cases.push({
    id: id('missing-required'),
    title: 'Negative - Missing Required Fields',
    category: 'negative',
    priority: 'high',
    domain: primaryDomain,
    generatorLink: DOMAIN_GENERATOR_LINKS[primaryDomain] || '/generators/json',
    dataFields: getDomainFields(primaryDomain),
    gherkin: {
      given: 'User is on the form page',
      when: 'User leaves all required fields empty and submits',
      then: 'Validation errors are shown for each required field'
    }
  });
  
  // ALWAYS: Boundary - Max Length
  cases.push({
    id: id('boundary-max'),
    title: 'Boundary - Maximum Length Input',
    category: 'boundary',
    priority: 'medium',
    domain: primaryDomain,
    generatorLink: DOMAIN_GENERATOR_LINKS[primaryDomain] || '/generators/json',
    dataFields: getDomainFields(primaryDomain),
    gherkin: {
      given: 'User is on the form page',
      when: 'User enters exactly the maximum allowed characters in each field and submits',
      then: 'System accepts the maximum length input'
    }
  });
  
  // ALWAYS: Boundary - Exceed Max Length
  cases.push({
    id: id('boundary-exceed'),
    title: 'Negative - Exceed Maximum Length',
    category: 'negative',
    priority: 'medium',
    domain: primaryDomain,
    generatorLink: DOMAIN_GENERATOR_LINKS[primaryDomain] || '/generators/json',
    dataFields: getDomainFields(primaryDomain),
    gherkin: {
      given: 'User is on the form page',
      when: 'User enters more than the maximum allowed characters and submits',
      then: 'System rejects or truncates the over-long input with validation error'
    }
  });
  
  // DOMAIN-SPECIFIC TEST CASES
  if (primaryDomain === 'security' || story.toLowerCase().includes('login') || story.toLowerCase().includes('auth')) {
    cases.push(
      {
        id: id('auth-invalid-creds'),
        title: 'Security - Invalid Credentials',
        category: 'negative',
        priority: 'high',
        domain: 'security',
        generatorLink: '/generators/json',
        dataFields: ['username', 'password'],
        gherkin: {
          given: 'User is on the login page',
          when: 'User enters invalid username and password and clicks login',
          then: 'Invalid credentials error is shown; no session is created'
        }
      },
      {
        id: id('auth-sql-injection'),
        title: 'Security - SQL Injection in Login',
        category: 'security',
        priority: 'high',
        domain: 'security',
        generatorLink: '/generators/json',
        dataFields: ['username', 'password'],
        gherkin: {
          given: 'User is on the login page',
          when: 'User enters SQL injection payload in username field and submits',
          then: 'Login is rejected; no data is exposed; input is sanitized'
        }
      },
      {
        id: id('auth-xss'),
        title: 'Security - XSS in Login Field',
        category: 'security',
        priority: 'high',
        domain: 'security',
        generatorLink: '/generators/json',
        dataFields: ['username', 'password'],
        gherkin: {
          given: 'User is on the login page',
          when: 'User enters XSS payload in username field and submits',
          then: 'Input is sanitized; script does not execute'
        }
      },
      {
        id: id('auth-brute-force'),
        title: 'Security - Brute Force Protection',
        category: 'security',
        priority: 'high',
        domain: 'security',
        generatorLink: '/generators/json',
        dataFields: ['username', 'password'],
        gherkin: {
          given: 'User is on the login page',
          when: 'User attempts wrong password 5+ times consecutively',
          then: 'Account is temporarily locked; lockout message is shown'
        }
      }
    );
  }
  
  if (primaryDomain === 'banking' || story.toLowerCase().includes('payment') || story.toLowerCase().includes('transfer')) {
    cases.push(
      {
        id: id('pay-insufficient'),
        title: 'Payment - Insufficient Funds',
        category: 'negative',
        priority: 'high',
        domain: 'banking',
        generatorLink: '/generators/banking',
        dataFields: ['amount', 'account', 'balance'],
        gherkin: {
          given: 'User has zero balance in account',
          when: 'User attempts payment of $1.00 and confirms',
          then: 'Transaction is declined; balance unchanged; error shown'
        }
      },
      {
        id: id('pay-negative'),
        title: 'Payment - Negative Amount',
        category: 'negative',
        priority: 'high',
        domain: 'banking',
        generatorLink: '/generators/banking',
        dataFields: ['amount'],
        gherkin: {
          given: 'User is on the payment page',
          when: 'User enters negative amount and submits',
          then: 'Validation error; no transaction processed'
        }
      },
      {
        id: id('pay-decimal'),
        title: 'Payment - Excessive Decimal Places',
        category: 'boundary',
        priority: 'medium',
        domain: 'banking',
        generatorLink: '/generators/banking',
        dataFields: ['amount'],
        gherkin: {
          given: 'User is on the payment page',
          when: 'User enters amount with more than 2 decimal places',
          then: 'Amount is rounded to 2dp or rejected with validation error'
        }
      }
    );
  }
  
  if (primaryDomain === 'file-upload' || story.toLowerCase().includes('upload')) {
    cases.push(
      {
        id: id('upload-large'),
        title: 'Upload - File Too Large',
        category: 'negative',
        priority: 'high',
        domain: 'file-upload',
        generatorLink: '/generators/json',
        dataFields: ['file'],
        gherkin: {
          given: 'User is on the upload page',
          when: 'User selects file exceeding maximum size and clicks upload',
          then: 'Upload is rejected with size-limit error'
        }
      },
      {
        id: id('upload-invalid-type'),
        title: 'Upload - Invalid File Type',
        category: 'negative',
        priority: 'high',
        domain: 'file-upload',
        generatorLink: '/generators/json',
        dataFields: ['file'],
        gherkin: {
          given: 'User is on the upload page',
          when: 'User selects file with disallowed extension (.exe) and clicks upload',
          then: 'Upload is rejected; file-type error shown; no file stored'
        }
      },
      {
        id: id('upload-path-traversal'),
        title: 'Security - Path Traversal in Filename',
        category: 'security',
        priority: 'high',
        domain: 'security',
        generatorLink: '/generators/json',
        dataFields: ['file'],
        gherkin: {
          given: 'User is on the upload page',
          when: 'User uploads file named "../../../etc/passwd.pdf"',
          then: 'Filename is sanitized; no path traversal occurs'
        }
      }
    );
  }
  
  if (primaryDomain === 'search' || story.toLowerCase().includes('search')) {
    cases.push(
      {
        id: id('search-empty'),
        title: 'Search - Empty Query',
        category: 'boundary',
        priority: 'medium',
        domain: 'search',
        generatorLink: '/generators/json',
        dataFields: ['query'],
        gherkin: {
          given: 'User is on the search page',
          when: 'User leaves search field empty and submits',
          then: 'Validation error or all results returned; no server error'
        }
      },
      {
        id: id('search-xss'),
        title: 'Security - XSS in Search',
        category: 'security',
        priority: 'high',
        domain: 'security',
        generatorLink: '/generators/json',
        dataFields: ['query'],
        gherkin: {
          given: 'User is on the search page',
          when: 'User enters XSS payload in search field and submits',
          then: 'Input is sanitized; no script executes'
        }
      },
      {
        id: id('search-sqli'),
        title: 'Security - SQL Injection in Search',
        category: 'security',
        priority: 'high',
        domain: 'security',
        generatorLink: '/generators/json',
        dataFields: ['query'],
        gherkin: {
          given: 'User is on the search page',
          when: 'User enters SQL injection payload in search field and submits',
          then: 'Input is sanitized; no data leaked; graceful error or empty results'
        }
      }
    );
  }
  
  if (story.toLowerCase().includes('password') || story.toLowerCase().includes('reset')) {
    cases.push(
      {
        id: id('pwd-weak'),
        title: 'Password - Weak Password Rejected',
        category: 'negative',
        priority: 'high',
        domain: 'security',
        generatorLink: '/generators/json',
        dataFields: ['password', 'confirmPassword'],
        gherkin: {
          given: 'User is on the password change page',
          when: 'User enters weak password (e.g., "123") and submits',
          then: 'Rejected with complexity requirements explanation'
        }
      },
      {
        id: id('pwd-mismatch'),
        title: 'Password - Confirmation Mismatch',
        category: 'negative',
        priority: 'high',
        domain: 'security',
        generatorLink: '/generators/json',
        dataFields: ['password', 'confirmPassword'],
        gherkin: {
          given: 'User is on the password change page',
          when: 'User enters valid password but different confirmation and submits',
          then: 'Mismatch error shown; password not updated'
        }
      }
    );
  }
  
  if (story.toLowerCase().includes('delete') || story.toLowerCase().includes('remove')) {
    cases.push(
      {
        id: id('delete-confirm'),
        title: 'Delete - Requires Confirmation',
        category: 'positive',
        priority: 'high',
        domain: primaryDomain,
        generatorLink: DOMAIN_GENERATOR_LINKS[primaryDomain] || '/generators/json',
        dataFields: ['id'],
        gherkin: {
          given: 'User has selected a resource to delete',
          when: 'User clicks delete and confirms deletion',
          then: 'Resource is deleted; no longer in list'
        }
      },
      {
        id: id('delete-cancel'),
        title: 'Delete - Cancel Preserves Resource',
        category: 'negative',
        priority: 'medium',
        domain: primaryDomain,
        generatorLink: DOMAIN_GENERATOR_LINKS[primaryDomain] || '/generators/json',
        dataFields: ['id'],
        gherkin: {
          given: 'User has selected a resource to delete',
          when: 'User clicks delete but then clicks cancel',
          then: 'Resource is NOT deleted; remains in list'
        }
      }
    );
  }
  
  // Additional edge cases
  cases.push(
    {
      id: id('whitespace'),
      title: 'Edge - Whitespace Only Input',
      category: 'boundary',
      priority: 'medium',
      domain: primaryDomain,
      generatorLink: DOMAIN_GENERATOR_LINKS[primaryDomain] || '/generators/json',
      dataFields: getDomainFields(primaryDomain),
      gherkin: {
        given: 'User is on the form page',
        when: 'User enters only whitespace in all text fields and submits',
        then: 'Whitespace is treated as empty; validation error shown'
      }
    },
    {
      id: id('special-chars'),
      title: 'Edge - Special Characters Input',
      category: 'boundary',
      priority: 'medium',
      domain: primaryDomain,
      generatorLink: DOMAIN_GENERATOR_LINKS[primaryDomain] || '/generators/json',
      dataFields: getDomainFields(primaryDomain),
      gherkin: {
        given: 'User is on the form page',
        when: 'User enters special characters (!@#$%^&*()) in text fields and submits',
        then: 'System handles special characters gracefully; no error or sanitized input'
      }
    },
    {
      id: id('unicode'),
      title: 'Edge - Unicode/Emoji Input',
      category: 'boundary',
      priority: 'low',
      domain: primaryDomain,
      generatorLink: DOMAIN_GENERATOR_LINKS[primaryDomain] || '/generators/json',
      dataFields: getDomainFields(primaryDomain),
      gherkin: {
        given: 'User is on the form page',
        when: 'User enters emoji and unicode characters (🎉 测试 ةيبرعلا) and submits',
        then: 'System handles unicode correctly; data stored and displayed properly'
      }
    }
  );
  
  return cases;
}

function getDomainFields(domain: string): string[] {
  const fields: Record<string, string[]> = {
    'user-profile': ['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'avatar'],
    'banking': ['amount', 'accountNumber', 'currency', 'description'],
    'credit-card': ['cardNumber', 'expiryDate', 'cvv', 'cardholderName'],
    'address': ['street', 'city', 'state', 'postalCode', 'country'],
    'api': ['endpoint', 'method', 'payload', 'headers'],
    'security': ['username', 'password', 'token', 'role'],
    'file-upload': ['file', 'fileName', 'fileType', 'fileSize'],
    'search': ['query', 'filters', 'sortBy'],
    'crud': ['id', 'name', 'description', 'status']
  };
  return fields[domain] || ['field1', 'field2', 'field3'];
}

function buildSummary(testCases: GeneratedTestCase[]): AnalysisResult['summary'] {
  const byCategory: Record<string, number> = { positive: 0, negative: 0, boundary: 0, security: 0 };
  const byDomain: Record<string, number> = {};
  const byPriority: Record<string, number> = { high: 0, medium: 0, low: 0 };
  
  testCases.forEach(tc => {
    byCategory[tc.category]++;
    byDomain[tc.domain] = (byDomain[tc.domain] || 0) + 1;
    byPriority[tc.priority]++;
  });
  
  return {
    totalCases: testCases.length,
    byCategory,
    byDomain,
    byPriority
  };
}

function generateRecommendations(story: string, domains: DomainDetection[], testCases: GeneratedTestCase[]): string[] {
  const recs: string[] = [
    'Consider adding automated regression tests for the happy path scenario',
    'Implement contract testing for API integrations',
    'Add visual regression testing for UI-critical flows'
  ];
  
  if (domains.some(d => d.domain === 'security')) {
    recs.push('Integrate OWASP ZAP security scanning in CI/CD pipeline');
    recs.push('Implement rate limiting and account lockout mechanisms');
  }
  
  if (domains.some(d => d.domain === 'banking' || d.domain === 'credit-card')) {
    recs.push('Add PCI DSS compliance validation tests');
    recs.push('Test idempotency for all payment operations');
  }
  
  if (domains.some(d => d.domain === 'file-upload')) {
    recs.push('Implement virus scanning for uploaded files');
    recs.push('Add file type validation using magic bytes, not just extension');
  }
  
  if (testCases.some(tc => tc.category === 'security')) {
    recs.push('Run SAST/DAST scans on every PR');
    recs.push('Implement Content Security Policy (CSP) headers');
  }
  
  return recs;
}

export function analyzeUserStory(story: string): AnalysisResult {
  if (!story || story.trim().length === 0) {
    throw new Error('Story is required');
  }
  
  const decomposition = decomposeStory(story);
  const detectedDomains = detectDomains(story);
  const testCases = generateTestCases(story, detectedDomains, decomposition);
  const summary = buildSummary(testCases);
  const recommendations = generateRecommendations(story, detectedDomains, testCases);
  
  return {
    decomposition,
    testCases,
    recommendations,
    summary,
    detectedDomains,
    userStory: story
  };
}

export function generateAutomationScript(
  testCases: GeneratedTestCase[], 
  userStory: string, 
  framework: 'playwright' | 'selenium' | 'cypress' | 'appium' = 'playwright'
): string {
  const timestamp = new Date().toISOString();
  
  switch (framework) {
    case 'playwright':
      return generatePlaywrightScript(testCases, userStory, timestamp);
    case 'selenium':
      return generateSeleniumScript(testCases, userStory, timestamp);
    case 'cypress':
      return generateCypressScript(testCases, userStory, timestamp);
    case 'appium':
      return generateAppiumScript(testCases, userStory, timestamp);
    default:
      return generatePlaywrightScript(testCases, userStory, timestamp);
  }
}

function generatePlaywrightScript(testCases: GeneratedTestCase[], userStory: string, timestamp: string): string {
  const testBlocks = testCases.slice(0, 5).map((tc, i) => `
  test('${tc.title}', async ({ page }) => {
    test.step('Navigate to application', async () => {
      await page.goto('/');
    });
    
    test.step('${tc.gherkin.when}', async () => {
      // TODO: Implement test steps based on: ${tc.gherkin.when}
      // Example: await page.getByRole('button', { name: 'Submit' }).click();
    });
    
    test.step('Verify: ${tc.gherkin.then}', async () => {
      // TODO: Add assertions based on: ${tc.gherkin.then}
      // Example: await expect(page.getByText('Success')).toBeVisible();
    });
  });`).join('\n');
  
  return `import { test, expect } from '@playwright/test';

// Auto-generated by QA Data Studio Central AI Orchestrator
// User Story: ${userStory}
// Generated: ${timestamp}
// Framework: Playwright TypeScript

test.describe('Generated Test Suite', () => {
${testBlocks}
});`;
}

function generateSeleniumScript(testCases: GeneratedTestCase[], userStory: string, timestamp: string): string {
  const testMethods = testCases.slice(0, 5).map((tc, i) => `
    @Test
    public void ${tc.title.replace(/[^a-zA-Z0-9]/g, '')}() {
        // ${tc.gherkin.given}
        // ${tc.gherkin.when}
        // ${tc.gherkin.then}
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        // TODO: Implement test steps
    }`).join('\n');
  
  return `// Auto-generated by QA Data Studio Central AI Orchestrator
// User Story: ${userStory}
// Generated: ${timestamp}
// Framework: Selenium WebDriver (Java)

import org.openqa.selenium.*;
import org.openqa.selenium.support.ui.*;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import java.time.Duration;

public class GeneratedTestSuite {
    private WebDriver driver;
    
    @BeforeEach
    public void setUp() {
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage");
        driver = new ChromeDriver(options);
    }
    
    @AfterEach
    public void tearDown() {
        if (driver != null) driver.quit();
    }
${testMethods}
}`;
}

function generateCypressScript(testCases: GeneratedTestCase[], userStory: string, timestamp: string): string {
  const testBlocks = testCases.slice(0, 5).map((tc, i) => `
  it('${tc.title}', () => {
    // ${tc.gherkin.given}
    cy.visit('/')
    
    // ${tc.gherkin.when}
    // TODO: Implement test steps
    
    // ${tc.gherkin.then}
    // TODO: Add assertions
  }`).join('\n');
  
  return `// Auto-generated by QA Data Studio Central AI Orchestrator
// User Story: ${userStory}
// Generated: ${timestamp}
// Framework: Cypress

describe('Generated Test Suite', () => {
  beforeEach(() => {
    cy.visit('/')
  })
${testBlocks}
})`;
}

function generateAppiumScript(testCases: GeneratedTestCase[], userStory: string, timestamp: string): string {
  return `// Auto-generated by QA Data Studio Central AI Orchestrator
// User Story: ${userStory}
// Generated: ${timestamp}
// Framework: Appium (JavaScript)

const wdio = require("webdriverio");

const opts = {
  path: '/wd/hub',
  port: 4723,
  capabilities: {
    platformName: "Android",
    "appium:automationName": "UiAutomator2",
    "appium:deviceName": "emulator-5554",
    "appium:app": "/path/to/app.apk"
  }
};

async function main() {
  const client = await wdio.remote(opts);
  // TODO: Implement test cases
  await client.deleteSession();
}

main();`;
}

export function generateSchemaAnalysis(schema: string): any {
  try {
    const parsed = JSON.parse(schema);
    const endpoints: any[] = [];
    
    if (parsed.paths) {
      for (const [path, methods] of Object.entries(parsed.paths)) {
        for (const [method, details] of Object.entries(methods as any)) {
          if (['get', 'post', 'put', 'patch', 'delete'].includes(method.toLowerCase())) {
            endpoints.push({
              path,
              method: method.toUpperCase(),
              testCases: [
                {
                  title: `Positive - Valid ${method.toUpperCase()} ${path}`,
                  type: 'positive',
                  payload: generateValidPayload(details as any)
                },
                {
                  title: `Negative - Invalid ${method.toUpperCase()} ${path}`,
                  type: 'negative',
                  payload: generateInvalidPayload(details as any)
                },
                {
                  title: `Security - Injection ${method.toUpperCase()} ${path}`,
                  type: 'security',
                  payload: generateSecurityPayload(details as any)
                }
              ]
            });
          }
        }
      }
    }
    
    return { endpoints: endpoints.slice(0, 10) };
  } catch {
    return { endpoints: [] };
  }
}

function generateValidPayload(details: any): any {
  if (details.requestBody?.content?.['application/json']?.schema) {
    return generateFromSchema(details.requestBody.content['application/json'].schema);
  }
  return {};
}

function generateInvalidPayload(details: any): any {
  const valid = generateValidPayload(details);
  // Remove required fields
  if (details.requestBody?.content?.['application/json']?.schema?.required) {
    const required = details.requestBody.content['application/json'].schema.required;
    if (required.length > 0) {
      const invalid = { ...valid };
      delete invalid[required[0]];
      return invalid;
    }
  }
  return { invalidField: 'test' };
}

function generateSecurityPayload(details: any): any {
  return {
    query: "' OR '1'='1",
    username: "<script>alert('xss')</script>",
    search: "'; DROP TABLE users; --"
  };
}

function generateFromSchema(schema: any): any {
  if (!schema) return {};
  if (schema.type === 'object' && schema.properties) {
    const obj: any = {};
    for (const [key, prop] of Object.entries(schema.properties as any)) {
      obj[key] = generateFromSchema(prop);
    }
    return obj;
  }
  if (schema.type === 'array') {
    return [generateFromSchema(schema.items)];
  }
  switch (schema.type) {
    case 'string': return schema.format === 'email' ? 'test@example.com' : (schema.enum?.[0] || 'test');
    case 'number': return schema.minimum || 1;
    case 'integer': return schema.minimum || 1;
    case 'boolean': return true;
    default: return 'test';
  }
}

export function generateMockEndpoints(prompt: string): any[] {
  const lower = prompt.toLowerCase();
  const mocks: any[] = [];
  
  if (lower.includes('user') || lower.includes('profile') || lower.includes('account')) {
    mocks.push(
      { path: '/users', method: 'GET', statusCode: 200, responseBody: JSON.stringify({ users: [{ id: 1, name: 'John Doe', email: 'john@example.com' }] }), delay: 100 },
      { path: '/users', method: 'POST', statusCode: 201, responseBody: JSON.stringify({ id: 2, name: 'Jane Doe', email: 'jane@example.com' }), delay: 150 },
      { path: '/users/1', method: 'GET', statusCode: 200, responseBody: JSON.stringify({ id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' }), delay: 50 },
      { path: '/users/1', method: 'PUT', statusCode: 200, responseBody: JSON.stringify({ id: 1, name: 'John Updated', email: 'john@example.com' }), delay: 100 },
      { path: '/users/1', method: 'DELETE', statusCode: 204, responseBody: JSON.stringify({}), delay: 50 }
    );
  } else if (lower.includes('product') || lower.includes('shop') || lower.includes('ecommerce')) {
    mocks.push(
      { path: '/products', method: 'GET', statusCode: 200, responseBody: JSON.stringify({ products: [{ id: 1, name: 'Widget', price: 29.99 }] }), delay: 100 },
      { path: '/products', method: 'POST', statusCode: 201, responseBody: JSON.stringify({ id: 2, name: 'Gadget', price: 49.99 }), delay: 150 },
      { path: '/cart', method: 'GET', statusCode: 200, responseBody: JSON.stringify({ items: [], total: 0 }), delay: 50 },
      { path: '/cart/items', method: 'POST', statusCode: 201, responseBody: JSON.stringify({ id: 1, productId: 1, quantity: 2 }), delay: 100 },
      { path: '/orders', method: 'POST', statusCode: 201, responseBody: JSON.stringify({ id: 1, status: 'pending', total: 59.98 }), delay: 200 }
    );
  } else {
    mocks.push(
      { path: '/api/health', method: 'GET', statusCode: 200, responseBody: JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), delay: 10 },
      { path: '/api/data', method: 'GET', statusCode: 200, responseBody: JSON.stringify({ data: [1, 2, 3, 4, 5] }), delay: 50 },
      { path: '/api/data', method: 'POST', statusCode: 201, responseBody: JSON.stringify({ id: 6, value: 'new' }), delay: 100 }
    );
  }
  
  return mocks;
}

export function generatePerformanceAnalysis(results: any): string {
  const { successRate, avgLatencyMs, p95LatencyMs, p99LatencyMs, statusCodes, requestsPerSecond } = results;
  
  let verdict = 'Healthy';
  if (successRate < 99) verdict = 'Critical';
  else if (successRate < 99.9 || p95LatencyMs > 500) verdict = 'Struggling';
  else if (p99LatencyMs > 1000) verdict = 'Struggling';
  
  let analysis = `## Executive Summary\n**Verdict: ${verdict}**\n\n`;
  analysis += `The load test completed with **${successRate}% success rate** at **${requestsPerSecond} req/s**.\n\n`;
  
  analysis += `## Bottleneck Analysis\n`;
  if (p99LatencyMs > avgLatencyMs * 3) {
    analysis += `- **High Tail Latency**: P99 (${p99LatencyMs}ms) is ${(p99LatencyMs/avgLatencyMs).toFixed(1)}x the average (${avgLatencyMs}ms), indicating sporadic slow requests or GC pauses.\n`;
  }
  if (p95LatencyMs > 500) {
    analysis += `- **P95 Exceeds SLA**: ${p95LatencyMs}ms exceeds typical 500ms SLA.\n`;
  }
  
  analysis += `\n## Error Analysis\n`;
  const errorCodes = Object.entries(statusCodes || {}).filter(([k]) => k.startsWith('4') || k.startsWith('5'));
  if (errorCodes.length > 0) {
    errorCodes.forEach(([code, count]) => {
      analysis += `- **${code}**: ${count} occurrences\n`;
    });
  } else {
    analysis += `- No HTTP errors detected.\n`;
  }
  
  analysis += `\n## Actionable Recommendations\n`;
  if (p95LatencyMs > 500) analysis += `1. **Optimize Database Queries**: Add indexes, use connection pooling, consider read replicas.\n`;
  if (successRate < 99.9) analysis += `2. **Investigate Error Root Cause**: Check logs for 5xx patterns; implement circuit breakers.\n`;
  analysis += `3. **Enable Caching**: Add Redis/Memcached for frequently accessed data.\n`;
  analysis += `4. **Horizontal Scaling**: Configure auto-scaling based on CPU/memory or request queue depth.\n`;
  
  return analysis;
}

export function healAccessibilityViolation(html: string, violationId: string, description: string): string {
  const fixes: Record<string, (html: string) => string> = {
    'image-alt': (h) => h.includes('<img') && !h.includes('alt=') 
      ? h.replace(/<img([^>]*)>/, '<img$1 alt="Descriptive text">') 
      : h,
    'button-name': (h) => h.includes('<button') && !h.includes('aria-label') && !h.includes('>') 
      ? h.replace(/<button([^>]*)>/, '<button$1 aria-label="Button description">') 
      : h,
    'link-name': (h) => h.includes('<a ') && !h.includes('aria-label') && !h.match(/>.*</) 
      ? h.replace(/<a([^>]*)>/, '<a$1 aria-label="Link description">') 
      : h,
    'label': (h) => h.includes('<input') && !h.includes('id=') 
      ? h.replace(/<input([^>]*)>/, '<input$1 id="field-' + Date.now() + '">') 
      : h,
    'color-contrast': (h) => h.replace(/style="([^"]*)"/, 'style="$1; color: #1a1a1a; background: #ffffff;"'),
    'aria-roles': (h) => h.includes('role=') ? h : h.replace(/<div/, '<div role="region"')
  };
  
  const fixer = fixes[violationId] || fixes['label'];
  let healed = fixer(html);
  
  // Generic cleanup
  healed = healed.replace(/^```html\n/, '').replace(/```$/, '').trim();
  
  return healed || `<!-- Fixed: ${violationId} - ${description} -->\n${html}`;
}