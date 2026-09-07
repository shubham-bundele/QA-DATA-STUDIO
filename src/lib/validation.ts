// Zod validation schemas for all API endpoints
import { z } from 'zod';

// ============================================
// Base schemas
// ============================================

export const storySchema = z.object({
  story: z.string().min(10, 'Story must be at least 10 characters').max(10000),
  context: z.string().max(5000).optional(),
  projectId: z.string().uuid().optional()
});

export const frameworkSchema = z.enum(['playwright', 'selenium', 'cypress', 'appium', 'k6']);

export const testCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['positive', 'negative', 'boundary', 'security']),
  priority: z.enum(['high', 'medium', 'low']),
  domain: z.string(),
  generatorLink: z.string().url().optional(),
  dataFields: z.array(z.string()).optional(),
  gherkin: z.object({
    given: z.string(),
    when: z.string(),
    then: z.string()
  }).optional()
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// ============================================
// API Request Schemas
// ============================================

// POST /api/analyze-story
export const analyzeStoryRequestSchema = z.object({
  story: z.string().min(10).max(10000),
  options: z.object({
    includeDomains: z.array(z.string()).optional(),
    maxTestCases: z.number().int().positive().max(50).default(20),
    includeSecurity: z.boolean().default(true),
    includePerformance: z.boolean().default(false),
    includeAccessibility: z.boolean().default(false)
  }).optional()
});

// POST /api/build-automation
export const buildAutomationRequestSchema = z.object({
  prompt: z.string().min(20).max(20000),
  framework: frameworkSchema,
  options: z.object({
    language: z.enum(['typescript', 'javascript', 'python', 'java', 'csharp']).default('typescript'),
    pageObjectModel: z.boolean().default(true),
    includeFixtures: z.boolean().default(false),
    includeVisualRegression: z.boolean().default(false),
    baseUrl: z.string().url().optional()
  }).optional()
});

// POST /api/generate-playwright
export const generatePlaywrightRequestSchema = z.object({
  testCases: z.array(testCaseSchema).min(1).max(50),
  userStory: z.string().min(10).max(5000),
  options: z.object({
    baseUrl: z.string().url().optional(),
    includeSetup: z.boolean().default(true),
    includeTeardown: z.boolean().default(true)
  }).optional()
});

// POST /api/analyze-schema
export const analyzeSchemaRequestSchema = z.object({
  schema: z.string().min(50).max(100000), // OpenAPI JSON
  options: z.object({
    testTypes: z.array(z.enum(['positive', 'negative', 'security', 'contract'])).default(['positive', 'negative', 'security']),
    maxEndpoints: z.number().int().positive().max(50).default(20),
    includeMockData: z.boolean().default(true)
  }).optional()
});

// POST /api/generate-mocks
export const generateMocksRequestSchema = z.object({
  prompt: z.string().min(5).max(2000),
  options: z.object({
    count: z.number().int().positive().max(20).default(5),
    includeDelay: z.boolean().default(true),
    realism: z.enum(['low', 'medium', 'high']).default('high')
  }).optional()
});

// POST /api/analyze-performance
export const analyzePerformanceRequestSchema = z.object({
  results: z.object({
    totalRequests: z.number().int().positive(),
    successRate: z.number().min(0).max(100),
    failedRequests: z.number().int().nonnegative(),
    requestsPerSecond: z.number().positive(),
    minLatencyMs: z.number().nonnegative(),
    avgLatencyMs: z.number().positive(),
    p95LatencyMs: z.number().positive(),
    p99LatencyMs: z.number().positive(),
    maxLatencyMs: z.number().positive(),
    statusCodes: z.record(z.number().int().nonnegative())
  }),
  scenarioSteps: z.array(z.object({
    name: z.string(),
    method: z.string(),
    url: z.string().url(),
    duration: z.number().positive()
  })).optional(),
  config: z.object({
    vus: z.number().int().positive(),
    duration: z.number().int().positive(),
    thresholds: z.record(z.string()).optional()
  }).optional()
});

// POST /api/heal-a11y
export const healA11yRequestSchema = z.object({
  html: z.string().min(5).max(10000),
  violationId: z.string().min(1),
  description: z.string().min(5).max(1000),
  context: z.object({
    url: z.string().url().optional(),
    selector: z.string().optional()
  }).optional()
});

// POST /api/generate-alt-text
export const generateAltTextRequestSchema = z.object({
  imageUrl: z.string().url(),
  context: z.string().max(500).optional()
});

// POST /api/seed-database
export const seedDatabaseRequestSchema = z.object({
  schema: z.string().min(10).max(50000),
  count: z.number().int().positive().max(10000).default(100),
  options: z.object({
    locale: z.string().default('en'),
    seed: z.number().int().optional(),
    relationships: z.boolean().default(true)
  }).optional()
});

// POST /api/run-security-scan
export const runSecurityScanRequestSchema = z.object({
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET'),
  options: z.object({
    scanTypes: z.array(z.enum(['sqli', 'xss', 'csrf', 'lfi', 'rce', 'ssrf', 'headers'])).default(['sqli', 'xss', 'headers']),
    depth: z.enum(['quick', 'standard', 'deep']).default('standard'),
    customHeaders: z.record(z.string()).optional()
  }).optional()
});

// POST /api/run-a11y-scan
export const runA11yScanRequestSchema = z.object({
  url: z.string().url(),
  options: z.object({
    standards: z.array(z.enum(['wcag2a', 'wcag2aa', 'wcag21aa', 'section508', 'best-practice'])).default(['wcag2aa']),
    includeWarnings: z.boolean().default(true),
    device: z.enum(['desktop', 'mobile', 'tablet']).default('desktop')
  }).optional()
});

// POST /api/mock-manager
export const mockManagerRequestSchema = z.object({
  action: z.enum(['create', 'read', 'update', 'delete', 'list']),
  mock: z.object({
    id: z.string().optional(),
    path: z.string().min(1),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']),
    statusCode: z.number().int().min(100).max(599).default(200),
    responseBody: z.any(),
    delay: z.number().int().nonnegative().default(0),
    headers: z.record(z.string()).optional()
  }).optional()
});

// ============================================
// Response Schemas
// ============================================

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional()
    }).optional(),
    meta: z.object({
      requestId: z.string().optional(),
      timestamp: z.string().datetime().optional(),
      duration: z.number().optional()
    }).optional()
  });

export const analyzeStoryResponseSchema = apiResponseSchema(z.object({
  decomposition: z.object({
    actors: z.array(z.string()),
    actions: z.array(z.string()),
    preconditions: z.array(z.string()),
    outcomes: z.array(z.string()),
    edgeCases: z.array(z.string())
  }),
  testCases: z.array(testCaseSchema),
  recommendations: z.array(z.string()),
  summary: z.object({
    totalCases: z.number().int().nonnegative(),
    byCategory: z.object({
      positive: z.number().int().nonnegative(),
      negative: z.number().int().nonnegative(),
      boundary: z.number().int().nonnegative(),
      security: z.number().int().nonnegative()
    }),
    byDomain: z.record(z.number().int().nonnegative()),
    byPriority: z.object({
      high: z.number().int().nonnegative(),
      medium: z.number().int().nonnegative(),
      low: z.number().int().nonnegative()
    })
  }),
  detectedDomains: z.array(z.object({
    domain: z.string(),
    confidence: z.number().min(0).max(1),
    keywords: z.array(z.string()),
    generatorLink: z.string()
  })),
  userStory: z.string()
}));

// ============================================
// Validation middleware
// ============================================

export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): { success: true; data: T } | { success: false; error: z.ZodError } => {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.error };
  };
}

// Pre-compiled validators for performance
export const validators = {
  analyzeStory: validateRequest(analyzeStoryRequestSchema),
  buildAutomation: validateRequest(buildAutomationRequestSchema),
  generatePlaywright: validateRequest(generatePlaywrightRequestSchema),
  analyzeSchema: validateRequest(analyzeSchemaRequestSchema),
  generateMocks: validateRequest(generateMocksRequestSchema),
  analyzePerformance: validateRequest(analyzePerformanceRequestSchema),
  healA11y: validateRequest(healA11yRequestSchema),
  generateAltText: validateRequest(generateAltTextRequestSchema),
  seedDatabase: validateRequest(seedDatabaseRequestSchema),
  runSecurityScan: validateRequest(runSecurityScanRequestSchema),
  runA11yScan: validateRequest(runA11yScanRequestSchema),
  mockManager: validateRequest(mockManagerRequestSchema)
};

// Type inference helpers
export type AnalyzeStoryRequest = z.infer<typeof analyzeStoryRequestSchema>;
export type BuildAutomationRequest = z.infer<typeof buildAutomationRequestSchema>;
export type GeneratePlaywrightRequest = z.infer<typeof generatePlaywrightRequestSchema>;
export type AnalyzeSchemaRequest = z.infer<typeof analyzeSchemaRequestSchema>;
export type GenerateMocksRequest = z.infer<typeof generateMocksRequestSchema>;
export type AnalyzePerformanceRequest = z.infer<typeof analyzePerformanceRequestSchema>;
export type HealA11yRequest = z.infer<typeof healA11yRequestSchema>;
export type GenerateAltTextRequest = z.infer<typeof generateAltTextRequestSchema>;
export type SeedDatabaseRequest = z.infer<typeof seedDatabaseRequestSchema>;
export type RunSecurityScanRequest = z.infer<typeof runSecurityScanRequestSchema>;
export type RunA11yScanRequest = z.infer<typeof runA11yScanRequestSchema>;
export type MockManagerRequest = z.infer<typeof mockManagerRequestSchema>;