// LocalGenAI - Drop-in replacement for GoogleGenAI that uses local rule-based AI
// No external API keys required - fully self-contained

import { analyzeUserStory, generateAutomationScript, generateSchemaAnalysis, generateMockEndpoints, generatePerformanceAnalysis, healAccessibilityViolation, GeneratedTestCase } from './rule-engine';
import { QA_SYSTEM_CONTEXT } from '@/core/engines/ai-orchestrator';

// Type definitions (self-contained, no external dependencies)
export type Schema = Record<string, unknown>;

export interface GenerateContentArgs {
  model?: string;
  contents: unknown;
  config?: {
    responseSchema?: Schema;
    responseMimeType?: string;
    temperature?: number;
  };
}

export interface AIFailedResult {
  isAIFailed: true;
  reason: string;
  text?: never;
}

export interface AISuccessResult {
  isAIFailed?: false;
  text: string;
}

export type AIResult = AISuccessResult | AIFailedResult;

export interface AIStatusResult {
  healthy: boolean;
  primaryModel: string;
  fallbackModel: string;
  provider: string;
}

// Type definitions matching GoogleGenAI interface
export interface LocalGenerateContentArgs extends GenerateContentArgs {
  model?: string;
  contents: string | Array<{ role: string; parts: Array<{ text: string }> }>;
  config?: {
    responseSchema?: Schema;
    responseMimeType?: string;
    temperature?: number;
    maxOutputTokens?: number;
  };
}

export type LocalAIResult = AIResult & {
  text?: string;
  isAIFailed?: boolean;
  reason?: string;
};

interface StructuredOutput {
  [key: string]: any;
}

// Model configurations for local models
const LOCAL_MODEL_CONFIG = {
  primaryModel: 'qa-studio-rule-engine-v1',
  fallbackModel: 'qa-studio-fallback-v1',
  providerUrl: 'local://qa-data-studio/ai-engine'
} as const;

// System prompts for different tasks
const SYSTEM_PROMPTS: Record<string, string> = {
  'analyze-story': 'You are an expert QA Automation Architect. Analyze the user story and generate structured test cases with decomposition, test cases, recommendations, and domain detection.',
  'build-automation': 'You are a Senior QA Automation Engineer. Generate production-ready E2E automation scripts.',
  'generate-playwright': 'You are an expert SDET. Write Playwright test scripts in TypeScript.',
  'analyze-schema': 'You are an expert Security and QA Engineer. Analyze OpenAPI/Swagger schemas and generate test cases.',
  'generate-mocks': 'You are an API Design Expert. Generate realistic mock API endpoints with dummy data.',
  'analyze-performance': 'You are an expert Performance Engineer. Diagnose load test results and provide recommendations.',
  'heal-a11y': 'You are an expert Accessibility Engineer. Fix HTML accessibility violations.'
};

export class LocalGenAI {
  readonly models: {
    generateContent: (args: LocalGenerateContentArgs) => Promise<LocalAIResult>;
    generateContentStream: (args: LocalGenerateContentArgs) => Promise<AsyncGenerator<{ text: string }>>;
  };

  private initialized = false;
  private requestCount = 0;

  constructor(_opts?: { apiKey?: string; preferLocal?: boolean }) {
    // apiKey is ignored - we're fully local!
    console.log('[LocalGenAI] Initialized - No API key required, fully local AI engine');

    const generateContent = async (args: LocalGenerateContentArgs): Promise<LocalAIResult> => {
      this.requestCount++;
      const startTime = Date.now();

      try {
        const prompt = this.extractPrompt(args.contents);
        const taskType = this.detectTaskType(prompt, args.config?.responseSchema);

        console.log('[LocalGenAI] Request #' + this.requestCount + ' - Task: ' + taskType);

        let result: LocalAIResult;

        switch (taskType) {
          case 'analyze-story':
            result = await this.handleAnalyzeStory(prompt, args.config?.responseSchema);
            break;
          case 'build-automation':
            result = await this.handleBuildAutomation(prompt);
            break;
          case 'generate-playwright':
            result = await this.handleGeneratePlaywright(prompt);
            break;
          case 'analyze-schema':
            result = await this.handleAnalyzeSchema(prompt, args.config?.responseSchema);
            break;
          case 'generate-mocks':
            result = await this.handleGenerateMocks(prompt, args.config?.responseSchema);
            break;
          case 'analyze-performance':
            result = await this.handleAnalyzePerformance(prompt);
            break;
          case 'heal-a11y':
            result = await this.handleHealA11y(prompt);
            break;
          default:
            result = await this.handleGeneric(prompt, args.config?.responseSchema);
        }

        const duration = Date.now() - startTime;
        console.log('[LocalGenAI] Request #' + this.requestCount + ' completed in ' + duration + 'ms');

        return result;
      } catch (error: any) {
        console.error('[LocalGenAI] Error:', error);
        return {
          isAIFailed: true,
          reason: 'Local AI error: ' + error.message
        };
      }
    };

    const generateContentStream = async (args: LocalGenerateContentArgs): Promise<AsyncGenerator<{ text: string }>> => {
      const result = await generateContent(args);

      async function* streamGenerator(): AsyncGenerator<{ text: string }> {
        if (result.isAIFailed) {
          yield { text: JSON.stringify({ isAIFailed: true, reason: result.reason }) };
          return;
        }

        // Simulate streaming by chunking the response
        const text = result.text || '';
        const chunkSize = 50;
        for (let i = 0; i < text.length; i += chunkSize) {
          yield { text: text.slice(i, i + chunkSize) };
          // Small delay to simulate streaming
          await new Promise(r => setTimeout(r, 10));
        }
      }

      return streamGenerator();
    };

    this.models = { generateContent, generateContentStream };
    this.initialized = true;
  }

  private extractPrompt(contents: LocalGenerateContentArgs['contents']): string {
    if (typeof contents === 'string') {
      return contents;
    }
    if (Array.isArray(contents)) {
      return contents.map(c => c.parts?.map(p => p.text).join('') || '').join('\n');
    }
    return '';
  }

  private detectTaskType(prompt: string, responseSchema?: Schema): string {
    const lower = prompt.toLowerCase();

    if (lower.includes('analyze the following user story') || lower.includes('qa automation architect')) {
      return 'analyze-story';
    }
    if (lower.includes('senior qa automation engineer') || lower.includes('e2e automation script')) {
      return 'build-automation';
    }
    if (lower.includes('expert sdet') || lower.includes('playwright test script')) {
      return 'generate-playwright';
    }
    if (lower.includes('security and qa engineer') || lower.includes('openapi') || lower.includes('swagger')) {
      return 'analyze-schema';
    }
    if (lower.includes('api design expert') || lower.includes('mock api endpoints')) {
      return 'generate-mocks';
    }
    if (lower.includes('performance engineer') || lower.includes('load test')) {
      return 'analyze-performance';
    }
    if (lower.includes('accessibility engineer') || lower.includes('axe-core') || lower.includes('violation')) {
      return 'heal-a11y';
    }

    // Check response schema for clues
    if (responseSchema) {
      const schemaStr = JSON.stringify(responseSchema).toLowerCase();
      if (schemaStr.includes('decomposition') && schemaStr.includes('testcases')) {
        return 'analyze-story';
      }
      if (schemaStr.includes('endpoint') && schemaStr.includes('testcases')) {
        return 'analyze-schema';
      }
      if (schemaStr.includes('path') && schemaStr.includes('method') && schemaStr.includes('responsebody')) {
        return 'generate-mocks';
      }
    }

    return 'generic';
  }

  private async handleAnalyzeStory(prompt: string, responseSchema?: Schema): Promise<LocalAIResult> {
    // Extract user story from prompt
    const storyMatch = prompt.match(/User Story:\s*([\s\S]+)$/i) ||
                       prompt.match(/user story[:\s]+([\s\S]+)$/i) ||
                       prompt.match(/story[:\s]+([\s\S]+)$/i);

    const story = storyMatch ? storyMatch[1].trim() : prompt;

    try {
      const analysis = analyzeUserStory(story);

      // Format response to match expected schema
      const response = {
        decomposition: analysis.decomposition,
        testCases: analysis.testCases.map(tc => ({
          id: tc.id,
          title: tc.title,
          category: tc.category,
          priority: tc.priority,
          domain: tc.domain,
          generatorLink: tc.generatorLink,
          dataFields: tc.dataFields,
          gherkin: tc.gherkin
        })),
        recommendations: analysis.recommendations,
        summary: analysis.summary,
        detectedDomains: analysis.detectedDomains,
        userStory: story
      };

      return {
        text: JSON.stringify(response, null, 2),
        isAIFailed: false
      };
    } catch (error: any) {
      return {
        isAIFailed: true,
        reason: 'Story analysis failed: ' + error.message
      };
    }
  }

  private async handleBuildAutomation(prompt: string): Promise<LocalAIResult> {
    // Extract requirements and framework from prompt
    const frameworkMatch = prompt.match(/framework[:\s]+(\w+)/i);
    const framework = (frameworkMatch?.[1] || 'playwright').toLowerCase() as 'playwright' | 'selenium' | 'cypress' | 'appium';

    // Use a simple story extraction
    const storyMatch = prompt.match(/(?:journey|requirements?|story)[:\s]+([\s\S]+)$/i);
    const story = storyMatch ? storyMatch[1].trim() : 'Automate user login and dashboard navigation';

    // Generate test cases first, then automation
    const analysis = analyzeUserStory(story);
    const script = generateAutomationScript(analysis.testCases, story, framework);

    return {
      text: script,
      isAIFailed: false
    };
  }

  private async handleGeneratePlaywright(prompt: string): Promise<LocalAIResult> {
    // Extract test cases and user story
    const testCasesMatch = prompt.match(/Test Cases JSON:\s*([\s\S]+)$/i);
    const userStoryMatch = prompt.match(/User Story:\s*([\s\S]+?)(?:\n\n|$)/i);

    let testCases: GeneratedTestCase[] = [];
    let userStory = 'Generated test suite';

    if (testCasesMatch) {
      try {
        const parsed = JSON.parse(testCasesMatch[1]);
        if (Array.isArray(parsed)) {
          testCases = parsed.map((tc: any, i: number) => ({
            id: tc.id || 'TC-' + i,
            title: tc.title || 'Test Case ' + (i + 1),
            category: tc.category || 'positive',
            priority: tc.priority || 'medium',
            domain: tc.domain || 'api',
            generatorLink: tc.generatorLink || '/generators/json',
            dataFields: tc.dataFields || [],
            gherkin: tc.gherkin || { given: '', when: '', then: '' }
          }));
        }
      } catch {}
    }

    if (userStoryMatch) {
      userStory = userStoryMatch[1].trim();
    }

    if (testCases.length === 0) {
      const analysis = analyzeUserStory(userStory);
      testCases = analysis.testCases;
    }

    const script = generateAutomationScript(testCases, userStory, 'playwright');

    return {
      text: script,
      isAIFailed: false
    };
  }

  private async handleAnalyzeSchema(prompt: string, responseSchema?: Schema): Promise<LocalAIResult> {
    // Extract schema from prompt
    const schemaMatch = prompt.match(/Schema:\s*([\s\S]+)$/i) || prompt.match(/\{[\s\S]+\}/);
    const schema = schemaMatch ? schemaMatch[1].trim() : '{}';

    try {
      const analysis = generateSchemaAnalysis(schema);

      return {
        text: JSON.stringify(analysis, null, 2),
        isAIFailed: false
      };
    } catch (error: any) {
      return {
        isAIFailed: true,
        reason: 'Schema analysis failed: ' + error.message
      };
    }
  }

  private async handleGenerateMocks(prompt: string, responseSchema?: Schema): Promise<LocalAIResult> {
    // Extract prompt description
    const descMatch = prompt.match(/description[:\s]+["']?([^"']+)["']?/i) ||
                      prompt.match(/for the following domain[:\s]+([\s\S]+)$/i);
    const description = descMatch ? descMatch[1].trim() : prompt;

    try {
      const mocks = generateMockEndpoints(description);

      return {
        text: JSON.stringify(mocks, null, 2),
        isAIFailed: false
      };
    } catch (error: any) {
      return {
        isAIFailed: true,
        reason: 'Mock generation failed: ' + error.message
      };
    }
  }

  private async handleAnalyzePerformance(prompt: string): Promise<LocalAIResult> {
    // Extract results from prompt
    const resultsMatch = prompt.match(/Load Test Results:\s*([\s\S]+?)(?:\n\n|$)/i);
    const configMatch = prompt.match(/Test Configuration:\s*([\s\S]+?)(?:\n\n|$)/i);

    let results: any = {};
    let config: any = {};

    if (resultsMatch) {
      try {
        // Try to parse key metrics
        const text = resultsMatch[1];
        results.successRate = parseFloat(text.match(/Success Rate:\s*([\d.]+)/)?.[1] || '100');
        results.avgLatencyMs = parseFloat(text.match(/Avg Latency:\s*([\d.]+)/)?.[1] || '100');
        results.p95LatencyMs = parseFloat(text.match(/P95 Latency:\s*([\d.]+)/)?.[1] || '200');
        results.p99LatencyMs = parseFloat(text.match(/P99 Latency:\s*([\d.]+)/)?.[1] || '500');
        results.requestsPerSecond = parseFloat(text.match(/Throughput:\s*([\d.]+)/)?.[1] || '100');
        results.statusCodes = { '200': 1000 };
      } catch {}
    }

    if (configMatch) {
      try {
        const text = configMatch[1];
        config.vus = parseInt(text.match(/Virtual Users[:\s]+(\d+)/)?.[1] || '10', 10);
        config.duration = parseInt(text.match(/Duration:\s*(\d+)/)?.[1] || '60', 10);
      } catch {}
    }

    const analysis = generatePerformanceAnalysis(results);

    return {
      text: analysis,
      isAIFailed: false
    };
  }

  private async handleHealA11y(prompt: string): Promise<LocalAIResult> {
    const htmlMatch = prompt.match(/Failing HTML Node:\s*```html\s*([\s\S]+?)\s*```/i) ||
                      prompt.match(/```html\s*([\s\S]+?)\s*```/i);
    const violationMatch = prompt.match(/Violation Rule ID:\s*(\w+)/i);
    const descMatch = prompt.match(/Description:\s*([^\n]+)/i);

    const html = htmlMatch ? htmlMatch[1].trim() : '<div>Element</div>';
    const violationId = violationMatch ? violationMatch[1] : 'label';
    const description = descMatch ? descMatch[1].trim() : 'Accessibility violation';

    const healedHtml = healAccessibilityViolation(html, violationId, description);

    return {
      text: healedHtml,
      isAIFailed: false
    };
  }

  private async handleGeneric(prompt: string, responseSchema?: Schema): Promise<LocalAIResult> {
    // Generic response for unrecognized tasks
    if (responseSchema) {
      // Generate a valid JSON matching the schema
      const sample = this.generateSchemaSample(responseSchema);
      return {
        text: JSON.stringify(sample, null, 2),
        isAIFailed: false
      };
    }

    return {
      text: 'Local AI Response: I have analyzed your request. This is the QA Data Studio Central AI Engine running locally without external API dependencies.\n\nFor QA-specific tasks, please use the dedicated endpoints:\n- /api/analyze-story - Test case generation from user stories\n- /api/build-automation - E2E automation script generation\n- /api/analyze-schema - OpenAPI schema analysis\n- /api/generate-mocks - Mock API endpoint generation\n- /api/analyze-performance - Load test result analysis\n- /api/heal-a11y - Accessibility violation fixes\n\nHow can I help you with your QA automation needs today?',
      isAIFailed: false
    };
  }

  private generateSchemaSample(schema: Schema): any {
    if (!schema || !schema.type) return {};

    switch (schema.type) {
      case 'object':
        const obj: any = {};
        if (schema.properties) {
          for (const [key, prop] of Object.entries(schema.properties as Record<string, Schema>)) {
            obj[key] = this.generateSchemaSample(prop);
          }
        }
        if (schema.required && Array.isArray(schema.required)) {
          schema.required.forEach((key: string) => {
            if (!(key in obj) && schema.properties) {
              const prop = (schema.properties as Record<string, Schema>)[key];
              if (prop) obj[key] = this.generateSchemaSample(prop);
            }
          });
        }
        return obj;

      case 'array':
        return [this.generateSchemaSample(schema.items as Schema)];

      case 'string':
        if (schema.enum && Array.isArray(schema.enum) && schema.enum.length > 0) return schema.enum[0];
        if (schema.format === 'email') return 'test@example.com';
        if (schema.format === 'date-time') return new Date().toISOString();
        if (schema.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
        return 'sample string';

      case 'number':
      case 'integer':
        return schema.minimum ?? 42;

      case 'boolean':
        return true;

      default:
        return null;
    }
  }

  // Health check method
  async getAIStatus(): Promise<AIStatusResult> {
    return {
      healthy: true,
      primaryModel: LOCAL_MODEL_CONFIG.primaryModel,
      fallbackModel: LOCAL_MODEL_CONFIG.fallbackModel,
      provider: LOCAL_MODEL_CONFIG.providerUrl
    };
  }

  // Get request statistics
  getStats(): { requests: number; uptime: number } {
    return {
      requests: this.requestCount,
      uptime: process.uptime ? Math.floor(process.uptime()) : 0
    };
  }
}

// Local model configuration
export const MODEL_CONFIG = {
  primaryModel: LOCAL_MODEL_CONFIG.primaryModel,
  fallbackModel: LOCAL_MODEL_CONFIG.fallbackModel,
  providerUrl: LOCAL_MODEL_CONFIG.providerUrl,
} as const;

// Standalone getAIStatus function for compatibility
export async function getAIStatus(): Promise<AIStatusResult> {
  return {
    healthy: true,
    primaryModel: LOCAL_MODEL_CONFIG.primaryModel,
    fallbackModel: LOCAL_MODEL_CONFIG.fallbackModel,
    provider: LOCAL_MODEL_CONFIG.providerUrl
  };
}

export type LocalSchema = Schema;

export const Type = {
  OBJECT: "object",
  STRING: "string",
  ARRAY: "array",
  NUMBER: "number",
  INTEGER: "integer",
  BOOLEAN: "boolean",
} as const;

// Default export for easy migration
export default LocalGenAI;