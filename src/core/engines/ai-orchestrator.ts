import { GoogleGenAI, getAIStatus } from "@/lib/llm-client";

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// QA SYSTEM CONTEXT Ã¢â‚¬â€ Comprehensive knowledge base injected into every AI call
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export const QA_SYSTEM_CONTEXT = `
You are the Gemini Multimodal AI QA Orchestrator for QA Data Studio Ã¢â‚¬â€ an enterprise QA automation platform.

## Platform Capabilities
Test Case Generation, Automation Building, Schema Analysis, API Contract Testing,
Security Scanning (OWASP), Performance Testing (k6/Grafana), Accessibility Scanning (WCAG 2.1/axe-core),
Visual Regression, Database Seeding, Mock Server Management, Self-Healing Tests, CI/CD Integration.

## Testing Tool Knowledge Base

### Playwright (JS/TS/Python/Java/C#)
- Locators (priority): getByRole() > getByLabel() > getByPlaceholder() > getByText() > getByTestId() > locator(css)
- Assertions (auto-retrying): expect(locator).toBeVisible() | toHaveText() | toHaveValue() | toBeEnabled()
- POM: class LoginPage { constructor(page: Page) { this.submitBtn = page.getByRole('button', {name:'Login'}) } }
- Network mock: page.route('**/api/**', route => route.fulfill({ json: mockData }))
- Visual: expect(page).toHaveScreenshot('name.png', { maxDiffPixels: 100, animations: 'disabled' })
- Config: playwright.config.ts with projects for chromium/firefox/webkit/mobile

### Selenium WebDriver (Java/Python/JS/C#/Ruby)
- Explicit waits ALWAYS: WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.visibilityOf(el))
- Never use Thread.sleep() or time.sleep()
- Locator priority: By.id > By.name > By.cssSelector > By.linkText > By.xpath
- POM with @FindBy (Java) or @property (Python); PageFactory.initElements(driver, this)
- Headless: options.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage")
- Grid 4: RemoteWebDriver(new URL("http://localhost:4444"), options)

### Appium (iOS/Android)
- Capabilities (Appium 2.x): UiAutomator2Options / XCUITestOptions Ã¢â‚¬â€ all non-W3C prefixed with appium:
- Locator priority: ACCESSIBILITY_ID > ID > ANDROID_UIAUTOMATOR > IOS_PREDICATE_STRING > XPATH
- Gestures: driver.executeScript("mobile: swipeGesture", {direction:"up", percent:0.75})
- Never time.sleep(); always WebDriverWait with expected_conditions

### k6 (Load/Performance Testing)
- Structure: import http from 'k6/http'; export const options = {}; export default function() {}
- Thresholds (CI gates): { http_req_duration: ['p(95)<500'], http_req_failed: ['rate<0.01'] }
- Stages: [{duration:'30s',target:20},{duration:'1m',target:20},{duration:'10s',target:0}]
- KEY: check() is informational only Ã¢â‚¬â€ thresholds are the ONLY mechanism that fails a test
- Run: k6 run --out influxdb=http://localhost:8086/k6 script.js

### Grafana + k6
- Stack: k6 Ã¢â€ â€™ InfluxDB/Prometheus Ã¢â€ â€™ Grafana dashboard (import ID 2587 for k6 + InfluxDB)
- Alerts on p95 latency thresholds and error rate via Grafana Unified Alerting

### Accessibility Testing (axe-core/WCAG 2.1/Lighthouse)
- WCAG Levels: A (minimum), AA (standard/legal), AAA (enhanced)
- axe-core + Playwright: new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
- Key rules: color-contrast, image-alt, label, button-name, link-name, keyboard, aria-roles
- Lighthouse: lhci autorun; assert accessibility score >= 0.9
- Automated tools catch only 30-50% of issues; always supplement with manual keyboard testing

### OWASP ZAP (Security)
- Passive scan: safe for any env; finds missing headers, XSS, CSRF
- Active scan: STAGING ONLY Ã¢â‚¬â€ sends attack payloads
- CI: uses zaproxy/action-baseline@v0.12.0 GitHub Action
- Common rules: SQLi (40018), XSS (40012), Missing CSP (10038), Insecure cookies (10012)

### Pact (Contract Testing)
- Flow: Consumer test Ã¢â€ â€™ Pact file Ã¢â€ â€™ Broker Ã¢â€ â€™ Provider verification Ã¢â€ â€™ can-i-deploy check
- Matching: like(), eachLike(), term({generate, matcher}) Ã¢â‚¬â€ type-based not value-based
- CI gate: pact-broker can-i-deploy --pacticipant X --to-environment production

### Visual Regression
- Playwright built-in: expect(page).toHaveScreenshot() Ã¢â‚¬â€ mask dynamic content, disable animations
- BackstopJS: backstop reference Ã¢â€ â€™ backstop test Ã¢â€ â€™ backstop approve
- Percy: PERCY_TOKEN=x npx percy exec -- npx playwright test
- Always use Docker for BackstopJS (consistent font rendering across CI)

### Performance Test Types
- Load: normal traffic Ã¢â€ â€™ validate SLAs (p95 < 500ms, error < 1%)
- Stress: push past capacity Ã¢â€ â€™ find breaking point Ã¢â€ â€™ verify graceful degradation
- Spike: instant massive jump Ã¢â€ â€™ test autoscaling response
- Soak/Endurance: 2-24h steady load Ã¢â€ â€™ detect memory leaks, connection pool exhaustion
- Volume: large datasets at normal load Ã¢â€ â€™ test throughput
- Smoke: 1-5 VUs Ã¢â€ â€™ quick sanity check any environment

### Jest/Vitest (Unit Testing)
- Vitest preferred for new projects (faster, native Vite integration)
- Mocking: vi.fn() | vi.mock('./module') | vi.spyOn(obj, 'method')
- Network: MSW (msw/node) with setupServer() in setupTests.ts
- Coverage: v8 provider, threshold branches/functions/lines >= 80%

### Postman/Newman (API Testing)
- Tests: pm.test('Status 200', () => pm.response.to.have.status(200))
- Chain: extract token in Tests tab Ã¢â€ â€™ pm.environment.set('authToken', json.token)
- CI: newman run collection.json --environment env.json --reporters cli,junit --reporter-junit-export results.xml

### Security Testing Principles
- OWASP Top 10: Injection, Broken Auth, Sensitive Data Exposure, XXE, IDOR, Misconfig, XSS, Insecure Deserialization, Vulnerable Deps, Insufficient Logging
- Always test: SQL injection, XSS, CSRF tokens, auth bypass, rate limiting, session fixation
- Tools: OWASP ZAP, Burp Suite, SAST (SonarQube), DAST (ZAP), SCA (Snyk)
`.trim();

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Types
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export interface FallbackTestCase {
  id: string;
  title: string;
  type: "positive" | "negative" | "edge";
  priority: "high" | "medium" | "low";
  steps: string[];
  expectedResult: string;
  generatedBy: "rule-engine";
}

export interface QACheck {
  name: string;
  endpoint: string;
  status: "PASS" | "FAIL" | "SKIP";
  durationMs: number;
  details: string;
}

export interface OrchestratorReport {
  runId: string;
  timestamp: string;
  triggeredBy: string;
  overallStatus: "PASS" | "FAIL" | "PARTIAL" | "AI_FAILED";
  aiStatus: {
    healthy: boolean;
    primaryModel: string;
    fallbackModel: string;
    provider: string;
  };
  checks: QACheck[];
  escalationRequired: boolean;
  escalationReason: string | null;
  summary: string;
  durationMs: number;
  fallbackTestCases?: FallbackTestCase[];
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Rule-Based Fallback Test Case Generator (fires when AI is unavailable)
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export function generateFallbackTestCases(userStory: string): FallbackTestCase[] {
  const s = userStory.toLowerCase();
  const cases: FallbackTestCase[] = [];
  let n = 1;
  const id = (name: string) => `RULE-${String(n++).padStart(3,"0")}-${name}`;

  // Ã¢â€â‚¬Ã¢â€â‚¬ Always-present baseline tests Ã¢â€â‚¬Ã¢â€â‚¬
  cases.push(
    { id: id("happy-path"), title: "Happy Path Ã¢â‚¬â€ Valid Input", type: "positive", priority: "high",
      steps: ["Navigate to the feature","Enter all required fields with valid data","Submit"],
      expectedResult: "System accepts input and shows success confirmation", generatedBy: "rule-engine" },
    { id: id("missing-required"), title: "Negative Ã¢â‚¬â€ Missing Required Fields", type: "negative", priority: "high",
      steps: ["Leave all required fields empty","Attempt to submit"],
      expectedResult: "Validation errors shown for each required field", generatedBy: "rule-engine" },
    { id: id("empty-whitespace"), title: "Edge Ã¢â‚¬â€ Whitespace-Only Input", type: "edge", priority: "medium",
      steps: ["Enter only spaces in all text fields","Attempt to submit"],
      expectedResult: "Whitespace treated as empty; validation error shown", generatedBy: "rule-engine" },
    { id: id("boundary-max"), title: "Edge Ã¢â‚¬â€ Maximum Length Boundary", type: "edge", priority: "medium",
      steps: ["Enter exactly the maximum allowed characters in each field","Submit"],
      expectedResult: "System accepts maximum length input", generatedBy: "rule-engine" },
    { id: id("boundary-exceed"), title: "Edge Ã¢â‚¬â€ Exceed Maximum Length", type: "negative", priority: "medium",
      steps: ["Enter one character more than the maximum allowed","Submit"],
      expectedResult: "System rejects or truncates the over-long input", generatedBy: "rule-engine" }
  );

  // Ã¢â€â‚¬Ã¢â€â‚¬ Auth / Login Ã¢â€â‚¬Ã¢â€â‚¬
  if (/\b(login|log in|signin|sign in|auth|authenticate)\b/.test(s)) {
    cases.push(
      { id: id("auth-invalid-creds"), title: "Auth Ã¢â‚¬â€ Invalid Credentials", type: "negative", priority: "high",
        steps: ["Enter wrong username and password","Click Login"],
        expectedResult: "Invalid credentials error; no session created", generatedBy: "rule-engine" },
      { id: id("auth-sql-injection"), title: "Security Ã¢â‚¬â€ SQL Injection in Login", type: "negative", priority: "high",
        steps: ["Enter `' OR '1'='1` in username field","Any password","Click Login"],
        expectedResult: "Login rejected; no data exposed; input sanitised", generatedBy: "rule-engine" },
      { id: id("auth-brute-force"), title: "Auth Ã¢â‚¬â€ Account Lockout after Brute Force", type: "edge", priority: "high",
        steps: ["Attempt wrong password 5+ times consecutively"],
        expectedResult: "Account temporarily locked; lockout message shown", generatedBy: "rule-engine" },
      { id: id("auth-xss"), title: "Security Ã¢â‚¬â€ XSS in Login Field", type: "negative", priority: "high",
        steps: ["Enter <script>alert('xss')</script> in username","Submit"],
        expectedResult: "Input sanitised; script does not execute", generatedBy: "rule-engine" }
    );
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Payment / Banking Ã¢â€â‚¬Ã¢â€â‚¬
  if (/\b(payment|pay|transfer|bank|transaction|charge|billing)\b/.test(s)) {
    cases.push(
      { id: id("pay-insufficient-funds"), title: "Payment Ã¢â‚¬â€ Insufficient Funds", type: "negative", priority: "high",
        steps: ["Set balance to $0","Attempt payment of $1.00","Confirm"],
        expectedResult: "Transaction declined; balance unchanged; error shown", generatedBy: "rule-engine" },
      { id: id("pay-negative-amount"), title: "Payment Ã¢â‚¬â€ Negative Amount", type: "negative", priority: "high",
        steps: ["Enter -50 as payment amount","Submit"],
        expectedResult: "Validation error; no transaction processed", generatedBy: "rule-engine" },
      { id: id("pay-decimal-precision"), title: "Payment Ã¢â‚¬â€ Excessive Decimal Places", type: "edge", priority: "medium",
        steps: ["Enter 10.999 as amount","Submit"],
        expectedResult: "Amount rounded to 2dp or rejected with validation error", generatedBy: "rule-engine" }
    );
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Upload / File Ã¢â€â‚¬Ã¢â€â‚¬
  if (/\b(upload|file|attachment|import|document)\b/.test(s)) {
    cases.push(
      { id: id("upload-too-large"), title: "Upload Ã¢â‚¬â€ File Too Large", type: "negative", priority: "high",
        steps: ["Select file exceeding maximum size","Click Upload"],
        expectedResult: "Upload rejected with size-limit error", generatedBy: "rule-engine" },
      { id: id("upload-invalid-type"), title: "Upload Ã¢â‚¬â€ Invalid File Type (.exe)", type: "negative", priority: "high",
        steps: ["Select file with disallowed extension (.exe)","Click Upload"],
        expectedResult: "Upload rejected; file-type error shown; no file stored", generatedBy: "rule-engine" },
      { id: id("upload-path-traversal"), title: "Security Ã¢â‚¬â€ Path Traversal in Filename", type: "negative", priority: "high",
        steps: ["Upload file named '../../../etc/passwd.pdf'"],
        expectedResult: "Filename sanitised; no path traversal occurs", generatedBy: "rule-engine" }
    );
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Search Ã¢â€â‚¬Ã¢â€â‚¬
  if (/\b(search|find|query|filter|lookup)\b/.test(s)) {
    cases.push(
      { id: id("search-empty"), title: "Search Ã¢â‚¬â€ Empty Query", type: "edge", priority: "medium",
        steps: ["Leave search field empty","Submit"],
        expectedResult: "Validation error or all results returned; no server error", generatedBy: "rule-engine" },
      { id: id("search-special-chars"), title: "Search Ã¢â‚¬â€ Special Characters", type: "edge", priority: "medium",
        steps: ["Enter !@#$%^&*() in search field","Submit"],
        expectedResult: "No error; graceful empty results or sanitised results", generatedBy: "rule-engine" },
      { id: id("search-xss"), title: "Security Ã¢â‚¬â€ XSS in Search", type: "negative", priority: "high",
        steps: ["Enter <img src=x onerror=alert(1)> in search","Submit"],
        expectedResult: "Input sanitised; no script executes", generatedBy: "rule-engine" },
      { id: id("search-sqli"), title: "Security Ã¢â‚¬â€ SQL Injection in Search", type: "negative", priority: "high",
        steps: ["Enter ' UNION SELECT * FROM users-- in search","Submit"],
        expectedResult: "Input sanitised; no data leaked; graceful error or empty results", generatedBy: "rule-engine" }
    );
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Password Ã¢â€â‚¬Ã¢â€â‚¬
  if (/\b(password|passphrase|credential|pin|reset|forgot)\b/.test(s)) {
    cases.push(
      { id: id("pwd-weak"), title: "Password Ã¢â‚¬â€ Weak Password Rejected", type: "negative", priority: "high",
        steps: ["Enter '123' as new password","Submit"],
        expectedResult: "Rejected with complexity requirements explanation", generatedBy: "rule-engine" },
      { id: id("pwd-mismatch"), title: "Password Ã¢â‚¬â€ Confirmation Mismatch", type: "negative", priority: "high",
        steps: ["Enter valid password","Enter different text in confirm field","Submit"],
        expectedResult: "Mismatch error shown; password not updated", generatedBy: "rule-engine" }
    );
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Delete Ã¢â€â‚¬Ã¢â€â‚¬
  if (/\b(delete|remove|destroy|purge|trash)\b/.test(s)) {
    cases.push(
      { id: id("delete-confirm"), title: "Delete Ã¢â‚¬â€ Requires Confirmation", type: "positive", priority: "high",
        steps: ["Select resource","Click Delete","Confirm deletion"],
        expectedResult: "Resource deleted; no longer in list", generatedBy: "rule-engine" },
      { id: id("delete-cancel"), title: "Delete Ã¢â‚¬â€ Cancel Preserves Resource", type: "negative", priority: "medium",
        steps: ["Select resource","Click Delete","Click Cancel"],
        expectedResult: "Resource NOT deleted; remains in list", generatedBy: "rule-engine" }
    );
  }

  // Ã¢â€â‚¬Ã¢â€â‚¬ Generic CRUD (fallback when no keywords match) Ã¢â€â‚¬Ã¢â€â‚¬
  const hasKeyword = [
    /login|auth|signin/,/payment|transfer|bank/,/upload|file/,
    /search|filter/,/password|forgot/,/delete|remove/
  ].some(r => r.test(s));

  if (!hasKeyword) {
    cases.push(
      { id: id("crud-create"), title: "CRUD Ã¢â‚¬â€ Create New Resource", type: "positive", priority: "high",
        steps: ["Navigate to create page","Fill valid data","Submit"],
        expectedResult: "Resource created; appears in list", generatedBy: "rule-engine" },
      { id: id("crud-read"), title: "CRUD Ã¢â‚¬â€ Read/View Resource", type: "positive", priority: "medium",
        steps: ["Navigate to list","Click an existing resource"],
        expectedResult: "Detail page loads with correct data", generatedBy: "rule-engine" },
      { id: id("crud-update"), title: "CRUD Ã¢â‚¬â€ Update Resource", type: "positive", priority: "medium",
        steps: ["Navigate to resource","Click Edit","Modify a field","Save"],
        expectedResult: "Changes persisted; updated values visible", generatedBy: "rule-engine" },
      { id: id("crud-delete"), title: "CRUD Ã¢â‚¬â€ Delete Resource", type: "positive", priority: "medium",
        steps: ["Navigate to resource","Click Delete and confirm"],
        expectedResult: "Resource removed from list", generatedBy: "rule-engine" }
    );
  }

  return cases;
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Endpoint health check helper
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
async function checkEndpoint(name: string, url: string, payload: unknown): Promise<QACheck> {
  const start = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const durationMs = Date.now() - start;
    // 200 = success, 400 = endpoint alive but invalid payload Ã¢â‚¬â€ both mean reachable
    const status: "PASS" | "FAIL" = res.status < 500 ? "PASS" : "FAIL";
    return { name, endpoint: url, status, durationMs, details: `HTTP ${res.status}` };
  } catch (err: unknown) {
    const durationMs = Date.now() - start;
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return {
      name, endpoint: url, status: "FAIL", durationMs,
      details: isTimeout ? "Timed out after 10s" : `Error: ${err instanceof Error ? err.message : String(err)}`
    };
  } finally {
    clearTimeout(timeout);
  }
}

// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
// Main orchestration entry point
// Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬
export async function runFullOrchestration(
  triggeredBy: string,
  baseUrl: string
): Promise<OrchestratorReport> {
  const runId = crypto.randomUUID();
  const timestamp = new Date().toISOString();
  const wallStart = Date.now();

  console.log(`[orchestrator] Run ${runId} started by "${triggeredBy}" against ${baseUrl}`);

  // 1. Check AI health
  const aiStatus = await getAIStatus();

  // 2. Endpoint health checks (parallel)
  const endpointSpecs = [
    { name: "Story Analyzer", path: "/api/analyze-story", payload: { userStory: "ping" } },
    { name: "Automation Builder", path: "/api/build-automation", payload: { requirements: "ping", framework: "playwright" } },
    { name: "Security Scanner", path: "/api/run-security-scan", payload: { url: "https://example.com" } },
    { name: "Schema Analyzer", path: "/api/analyze-schema", payload: { schema: null } },
    { name: "A11y Scanner", path: "/api/run-a11y-scan", payload: { url: "https://example.com" } },
    { name: "Mock Generator", path: "/api/generate-mocks", payload: { prompt: null } },
  ];

  const endpointChecks = await Promise.all(
    endpointSpecs.map(s => checkEndpoint(s.name, `${baseUrl}${s.path}`, s.payload))
  );

  // 3. AI self-validation
  let aiCheck: QACheck;
  if (aiStatus.healthy) {
    const start = Date.now();
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const result = await ai.models.generateContent({
        contents: `Self-check: respond ONLY with valid JSON: {"status":"ok","module":"QA Orchestrator"}`,
        config: { responseMimeType: "application/json" }
      });
      const durationMs = Date.now() - start;
      let parsed: Record<string, unknown> = {};
      if (result.isAIFailed) { throw new Error(result.reason); }
      try { parsed = JSON.parse(result.text || "\{}"); } catch { /* ignore */ }
      const ok = parsed.status === "ok";
      aiCheck = {
        name: "AI Self-Validation", endpoint: aiStatus.provider,
        status: ok ? "PASS" : "FAIL", durationMs,
        details: ok ? `AI healthy Ã¢â‚¬â€ model: ${aiStatus.primaryModel}` : `Invalid AI response: ${result.text?.slice(0,200)}`
      };
    } catch (err: unknown) {
      aiCheck = {
        name: "AI Self-Validation", endpoint: aiStatus.provider,
        status: "FAIL", durationMs: Date.now() - start,
        details: `AI self-validation threw: ${err instanceof Error ? err.message : String(err)}`
      };
    }
  } else {
    aiCheck = {
      name: "AI Self-Validation", endpoint: aiStatus.provider,
      status: "SKIP", durationMs: 0,
      details: "Skipped Ã¢â‚¬â€ AI layer is unhealthy. Rule-based fallback test cases generated."
    };
  }

  const checks: QACheck[] = [...endpointChecks, aiCheck];

  // 4. Determine overall status
  const failedCount = endpointChecks.filter(c => c.status === "FAIL").length;
  const total = endpointChecks.length;
  let overallStatus: OrchestratorReport["overallStatus"];

  if (!aiStatus.healthy) overallStatus = "AI_FAILED";
  else if (failedCount === 0 && aiCheck.status === "PASS") overallStatus = "PASS";
  else if (failedCount > total / 2) overallStatus = "FAIL";
  else overallStatus = "PARTIAL";

  const escalationRequired = overallStatus === "FAIL" || overallStatus === "AI_FAILED";
  const escalationReason = escalationRequired
    ? overallStatus === "AI_FAILED"
      ? `AI model (${aiStatus.primaryModel}) unavailable. Check GEMINI_API_KEY. Rule-based fallback test cases generated.`
      : `${failedCount}/${total} endpoint checks failed. Manual investigation required.`
    : null;

  const passed = checks.filter(c => c.status === "PASS").length;
  const failed = checks.filter(c => c.status === "FAIL").length;
  const summary = `Run ${runId}: ${overallStatus}. ${passed}/${checks.length} checks passed, ${failed} failed. AI healthy: ${aiStatus.healthy}.${escalationReason ? ` Ã¢Å¡Â Ã¯Â¸Â ${escalationReason}` : " Ã¢Å“â€¦ No escalation needed."}`;

  const fallbackTestCases = !aiStatus.healthy
    ? generateFallbackTestCases("Generic QA validation for all application modules including login payment search upload")
    : undefined;

  const report: OrchestratorReport = {
    runId, timestamp, triggeredBy, overallStatus, aiStatus, checks,
    escalationRequired, escalationReason, summary,
    durationMs: Date.now() - wallStart,
    ...(fallbackTestCases ? { fallbackTestCases } : {})
  };

  console.log(`[orchestrator] Run ${runId} complete in ${report.durationMs}ms Ã¢â‚¬â€ ${overallStatus}`);
  return report;
}





