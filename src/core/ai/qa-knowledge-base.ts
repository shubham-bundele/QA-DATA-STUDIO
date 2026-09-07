export const QA_KNOWLEDGE_BASE = `
# QA DATA STUDIO - COMPREHENSIVE QA KNOWLEDGE BASE

## PLATFORM OVERVIEW
QA Data Studio is an enterprise QA automation platform providing:
- Test Case Generation from user stories
- E2E Automation Building (Playwright, Selenium, Appium, Cypress)
- Schema Analysis (OpenAPI/Swagger)
- Security Scanning (OWASP ZAP patterns)
- Performance Testing (k6/Grafana)
- Accessibility Scanning (WCAG 2.1/axe-core)
- Visual Regression Testing
- Database Seeding & Mock Server Management
- Self-Healing Tests
- CI/CD Integration

## TESTING FRAMEWORKS EXPERTISE

### Playwright (TypeScript/JavaScript/Python/Java/C#)
- Locator Priority: getByRole() > getByLabel() > getByPlaceholder() > getByText() > getByTestId() > CSS/XPath
- Auto-retrying Assertions: expect(locator).toBeVisible() | toHaveText() | toHaveValue() | toBeEnabled() | toHaveCount()
- Page Object Model: class LoginPage { constructor(page: Page) { this.submitBtn = page.getByRole('button', {name:'Login'}) } }
- Network Mocking: page.route('**/api/**', route => route.fulfill({ json: mockData }))
- Visual Regression: expect(page).toHaveScreenshot('name.png', { maxDiffPixels: 100, animations: 'disabled' })
- Config: playwright.config.ts with projects for chromium/firefox/webkit/mobile
- Test Steps: test.step('description', async () => { ... })
- Fixtures: test.extend<{ page: Page }>()

### Selenium WebDriver (Java/Python/JS/C#/Ruby)
- Explicit Waits ALWAYS: WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.visibilityOf(el))
- Never use Thread.sleep() or time.sleep()
- Locator Priority: By.id > By.name > By.cssSelector > By.linkText > By.xpath
- POM with @FindBy (Java) or @property (Python); PageFactory.initElements(driver, this)
- Headless: options.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage")
- Grid 4: RemoteWebDriver(new URL("http://localhost:4444"), options)

### Appium (iOS/Android)
- Capabilities (Appium 2.x): UiAutomator2Options / XCUITestOptions
- Locator Priority: ACCESSIBILITY_ID > ID > ANDROID_UIAUTOMATOR > IOS_PREDICATE_STRING > XPATH
- Gestures: driver.executeScript("mobile: swipeGesture", {direction:"up", percent:0.75})
- Never time.sleep(); always WebDriverWait with expected_conditions

### Cypress (JavaScript/TypeScript)
- cy.get(), cy.contains(), cy.find() with automatic retries
- Custom commands: Cypress.Commands.add('login', (user, pass) => { ... })
- Network stubbing: cy.intercept('GET', '/api/users', { fixture: 'users.json' })
- Visual: cy.compareSnapshot()

### k6 (Load/Performance Testing)
- Structure: import http from 'k6/http'; export const options = {}; export default function() {}
- Thresholds (CI gates): { http_req_duration: ['p(95)<500'], http_req_failed: ['rate<0.01'] }
- Stages: [{duration:'30s',target:20},{duration:'1m',target:20},{duration:'10s',target:0}]
- check() is informational only - thresholds are the ONLY mechanism that fails a test
- Run: k6 run --out influxdb=http://localhost:8086/k6 script.js

### Grafana + k6
- Stack: k6 -> InfluxDB/Prometheus -> Grafana dashboard (import ID 2587)
- Alerts on p95 latency thresholds and error rate via Grafana Unified Alerting

## ACCESSIBILITY TESTING (axe-core/WCAG 2.1/Lighthouse)
- WCAG Levels: A (minimum), AA (standard/legal), AAA (enhanced)
- axe-core + Playwright: new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()
- Key rules: color-contrast, image-alt, label, button-name, link-name, keyboard, aria-roles
- Lighthouse: lhci autorun; assert accessibility score >= 0.9
- Automated tools catch only 30-50% of issues; always supplement with manual keyboard testing

## OWASP ZAP (Security)
- Passive scan: safe for any env; finds missing headers, XSS, CSRF
- Active scan: STAGING ONLY - sends attack payloads
- CI: uses zaproxy/action-baseline@v0.12.0 GitHub Action
- Common rules: SQLi (40018), XSS (40012), Missing CSP (10038), Insecure cookies (10012)

## PACT (Contract Testing)
- Flow: Consumer test -> Pact file -> Broker -> Provider verification -> can-i-deploy check
- Matching: like(), eachLike(), term({generate, matcher}) - type-based not value-based
- CI gate: pact-broker can-i-deploy --pacticipant X --to-environment production

## VISUAL REGRESSION
- Playwright built-in: expect(page).toHaveScreenshot() - mask dynamic content, disable animations
- BackstopJS: backstop reference -> backstop test -> backstop approve
- Percy: PERCY_TOKEN=x npx percy exec -- npx playwright test
- Always use Docker for BackstopJS (consistent font rendering across CI)

## PERFORMANCE TEST TYPES
- Load: normal traffic -> validate SLAs (p95 < 500ms, error < 1%)
- Stress: push past capacity -> find breaking point -> verify graceful degradation
- Spike: instant massive jump -> test autoscaling response
- Soak/Endurance: 2-24h steady load -> detect memory leaks, connection pool exhaustion
- Volume: large datasets at normal load -> test throughput
- Smoke: 1-5 VUs -> quick sanity check any environment

## UNIT TESTING (Jest/Vitest)
- Vitest preferred for new projects (faster, native Vite integration)
- Mocking: vi.fn() | vi.mock('./module') | vi.spyOn(obj, 'method')
- Network: MSW (msw/node) with setupServer() in setupTests.ts
- Coverage: v8 provider, threshold branches/functions/lines >= 80%

## POSTMAN/NEWMAN (API Testing)
- Tests: pm.test('Status 200', () => pm.response.to.have.status(200))
- Chain: extract token in Tests tab -> pm.environment.set('authToken', json.token)
- CI: newman run collection.json --environment env.json --reporters cli,junit --reporter-junit-export results.xml

## SECURITY TESTING PRINCIPLES
- OWASP Top 10: Injection, Broken Auth, Sensitive Data Exposure, XXE, IDOR, Misconfig, XSS, Insecure Deserialization, Vulnerable Deps, Insufficient Logging
- Always test: SQL injection, XSS, CSRF tokens, auth bypass, rate limiting, session fixation
- Tools: OWASP ZAP, Burp Suite, SAST (SonarQube), DAST (ZAP), SCA (Snyk)

## TEST CASE GENERATION METHODOLOGY
1. DECOMPOSITION: Break user story into actors, actions, preconditions, outcomes, edge cases
2. CATEGORIZATION: Positive, Negative, Boundary, Security
3. PRIORITIZATION: High (critical path), Medium (important), Low (nice-to-have)
4. DOMAIN MAPPING: user-profile, banking, credit-card, address, api, security
5. DATA FIELDS: Identify realistic data requirements for each test case
6. GHERKIN: Given/When/Then format for BDD compatibility

## DOMAIN-SPECIFIC TEST PATTERNS

### Authentication/Login
- Happy path: valid credentials -> success
- Invalid credentials: wrong user/pass -> error
- SQL Injection: ' OR '1'='1
- XSS: <script>alert('xss')</script>
- Brute force: 5+ failed attempts -> lockout
- Rate limiting: rapid requests -> 429

### Payment/Banking
- Insufficient funds: $0 balance, attempt $1 -> declined
- Negative amount: -50 -> validation error
- Decimal precision: 10.999 -> round to 2dp or reject
- Currency conversion: test exchange rates
- Idempotency: duplicate requests -> single charge

### File Upload
- Too large: exceed max size -> reject
- Invalid type: .exe when only images allowed -> reject
- Path traversal: ../../../etc/passwd -> sanitize
- Empty file: 0 bytes -> reject or handle
- Malicious content: embedded scripts -> scan

### Search/Filter
- Empty query: validate or return all
- Special chars: !@#$%^&*() -> sanitize
- XSS: <img src=x onerror=alert(1)>
- SQLi: ' UNION SELECT * FROM users--
- Wildcard: % or * -> performance test
- Unicode: emoji, RTL, special scripts

### CRUD Operations
- Create: valid data -> 201, appears in list
- Read: existing ID -> 200, correct data
- Update: modify field -> 200, persisted
- Delete: confirm -> 204, removed from list
- Soft delete: archive vs hard delete

## EDGE CASE PATTERNS
- Boundary values: min, max, min-1, max+1
- Empty/null/undefined inputs
- Whitespace-only strings
- Very long strings (10k+ chars)
- Unicode: emoji, combining chars, RTL
- Concurrent operations
- Network failures/timeouts
- Partial data corruption
`.trim();

// Domain-specific knowledge bases
export const DOMAIN_KNOWLEDGE: Record<string, string> = {
  'user-profile': `
USER PROFILE DOMAIN KNOWLEDGE
Fields: firstName, lastName, email, phone, dateOfBirth, address, avatar, preferences, roles, status
Validation: email format, phone format, date range (13-120 years), required fields
Test Cases: profile creation, update, avatar upload, preference changes, role assignment, soft delete
Edge: duplicate email, invalid phone, future DOB, large avatar, special chars in name
  `,
  'banking': `
BANKING DOMAIN KNOWLEDGE
Fields: accountNumber, routingNumber, balance, currency, transactionType, amount, description, timestamp, status
Validation: Luhn algorithm for cards, IBAN validation, positive amounts, 2 decimal places, currency codes
Test Cases: transfer, deposit, withdrawal, balance inquiry, transaction history, scheduled payments
Edge: negative amounts, excessive decimals, insufficient funds, concurrent transfers, fraud detection
  `,
  'credit-card': `
CREDIT CARD DOMAIN KNOWLEDGE
Fields: cardNumber, expiryDate, cvv, cardholderName, billingAddress, cardType (visa/mastercard/amex)
Validation: Luhn check, expiry not past, CVV length (3-4), card type detection from prefix
Test Cases: valid charge, declined (insufficient, expired, invalid), refund, tokenization, 3D Secure
Edge: test card numbers (4242 4242 4242 4242), expired cards, invalid CVV, address mismatch
  `,
  'address': `
ADDRESS DOMAIN KNOWLEDGE
Fields: street, city, state, postalCode, country, addressType (billing/shipping), isDefault
Validation: postal code format per country, required fields, country codes (ISO 3166)
Test Cases: add address, set default, update, delete, validation per country
Edge: international formats, PO boxes, military addresses, special chars, long street names
  `,
  'api': `
API TESTING DOMAIN KNOWLEDGE
Methods: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
Status Codes: 2xx success, 4xx client error, 5xx server error
Auth: Bearer token, API key, Basic, OAuth2, JWT
Validation: schema compliance, response time, rate limiting, pagination, filtering
Test Cases: CRUD per endpoint, auth scenarios, rate limits, error handling, contract testing
Edge: malformed JSON, large payloads, concurrent requests, versioning, deprecated endpoints
  `,
  'security': `
SECURITY TESTING DOMAIN KNOWLEDGE
OWASP Top 10: Injection, Broken Auth, Sensitive Data, XXE, IDOR, Misconfig, XSS, Insecure Deserialization, Vulnerable Components, Insufficient Logging
Attacks: SQLi, XSS, CSRF, SSRF, Path Traversal, Command Injection, XXE, NoSQL Injection
Tools: OWASP ZAP, Burp Suite, SAST/DAST/IAST, SCA
Test Cases: auth bypass, privilege escalation, data exposure, injection points, session management
Edge: zero-day patterns, chained vulnerabilities, business logic flaws, race conditions
  `
};