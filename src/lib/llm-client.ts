/**
 * @file llm-client.ts
 * @description Central AI Client - Unified interface for local and external AI providers.
 * Now uses QA Data Studio's built-in Local AI Engine by default (no API keys required).
 * Falls back to Google Gemini if configured and local engine fails.
 */

// Local AI Engine (primary - no external dependencies)
import { 
  LocalGenAI, 
  LocalGenerateContentArgs, 
  LocalAIResult,
  getAIStatus as localGetAIStatus,
  MODEL_CONFIG as LOCAL_MODEL_CONFIG
} from '@/core/ai/local-genai';

// Google GenAI (fallback - requires API key)
import { GoogleGenAI as OfficialGoogleGenAI } from "@google/genai";

// ---------------------------------------------------------------------------
// Public type exports — drop-in replacements
// ---------------------------------------------------------------------------

export const Type = {
  OBJECT: "object",
  STRING: "string",
  ARRAY: "array",
  NUMBER: "number",
  INTEGER: "integer",
  BOOLEAN: "boolean",
} as const;

export type Schema = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Model configuration (readable by the orchestrator)
// ---------------------------------------------------------------------------

export const MODEL_CONFIG = {
  primaryModel: LOCAL_MODEL_CONFIG.primaryModel,
  fallbackModel: LOCAL_MODEL_CONFIG.fallbackModel,
  providerUrl: LOCAL_MODEL_CONFIG.providerUrl,
} as const;

// ---------------------------------------------------------------------------
// Structured error shape returned when all retries/fallbacks are exhausted
// ---------------------------------------------------------------------------

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

interface GenerateContentArgs {
  model?: string;
  contents: unknown;
  config?: {
    responseSchema?: Schema;
    responseMimeType?: string;
    temperature?: number;
  };
}

// ---------------------------------------------------------------------------
// Unified AI Client - Uses Local Engine by default, falls back to Google
// ---------------------------------------------------------------------------

export class GoogleGenAI {
  readonly models: {
    generateContent: (args: GenerateContentArgs) => Promise<AIResult>;
    generateContentStream: (
      args: GenerateContentArgs
    ) => Promise<AsyncGenerator<{ text: string }>>;
  };

  private localEngine: LocalGenAI;
  private googleEngine?: OfficialGoogleGenAI;
  private useGoogle = false;

  constructor(_opts?: { apiKey?: string; preferLocal?: boolean }) {
    // Initialize local engine (always available, no API key needed)
    this.localEngine = new LocalGenAI({});
    
    // Optionally initialize Google engine if API key provided
    const apiKey = _opts?.apiKey || process.env.GEMINI_API_KEY;
    if (apiKey && !(_opts?.preferLocal === false)) {
      try {
        this.googleEngine = new OfficialGoogleGenAI({ apiKey });
      } catch (e) {
        console.warn('[llm-client] Google GenAI initialization failed, using local only:', e);
      }
    }

    const generateContent = async (args: GenerateContentArgs): Promise<AIResult> => {
      // Try local first
      try {
        const result = await this.localEngine.models.generateContent(args as LocalGenerateContentArgs);
        if (!result.isAIFailed) {
          return result as AIResult;
        }
        console.warn('[llm-client] Local engine returned failure, trying fallback:', result.reason);
      } catch (localErr) {
        console.warn('[llm-client] Local engine error:', localErr);
      }

      // Fallback to Google if available
      if (this.googleEngine) {
        try {
          const doGenerate = async (modelName: string) => {
            return this.googleEngine!.models.generateContent({
              model: modelName,
              contents: args.contents as any,
              config: args.config as any,
            });
          };

          const response = await doGenerate(MODEL_CONFIG.primaryModel);
          return { text: response.text || "" };
        } catch (googleErr) {
          console.error('[llm-client] Google primary model failed:', googleErr);
        }

        try {
          const response = await this.googleEngine.models.generateContent({
            model: MODEL_CONFIG.fallbackModel,
            contents: args.contents as any,
            config: args.config as any,
          });
          return { text: response.text || "" };
        } catch (fallbackErr) {
          const reason = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
          console.error('[llm-client] Google fallback model failed:', fallbackErr);
          return {
            isAIFailed: true,
            reason: `All models exhausted. Local failed, Google failed: ${reason}`,
          };
        }
      }

      // Both failed
      return {
        isAIFailed: true,
        reason: 'Local AI engine failed and no Google fallback available',
      };
    };

    const generateContentStream = async (
      args: GenerateContentArgs
    ): Promise<AsyncGenerator<{ text: string }>> => {
      // Try local streaming first
      try {
        const stream = await this.localEngine.models.generateContentStream(args as LocalGenerateContentArgs);
        return stream;
      } catch (localErr) {
        console.warn('[llm-client] Local streaming failed:', localErr);
      }

      // Fallback to Google streaming
      if (this.googleEngine) {
        try {
          const createStream = (modelName: string) => {
            return this.googleEngine!.models.generateContentStream({
              model: modelName,
              contents: args.contents as any,
              config: args.config as any,
            });
          };

          const stream = await createStream(MODEL_CONFIG.primaryModel);
          
          async function* chunkGenerator(): AsyncGenerator<{ text: string }> {
            for await (const chunk of stream as any) {
              yield { text: chunk.text || "" };
            }
          }
          return chunkGenerator();
        } catch (googleErr) {
          console.error('[llm-client] Google streaming failed:', googleErr);
        }
      }

      // Error generator
      async function* errorGen(): AsyncGenerator<{ text: string }> {
        yield { text: JSON.stringify({ isAIFailed: true, reason: 'All streaming providers failed' }) };
      }
      return errorGen();
    };

    this.models = { generateContent, generateContentStream };
  }

  // Expose method to check which engine is being used
  getActiveEngine(): 'local' | 'google' {
    return this.useGoogle ? 'google' : 'local';
  }

  // Force use of Google (for testing)
  async enableGoogleFallback(apiKey?: string): Promise<boolean> {
    const key = apiKey || process.env.GEMINI_API_KEY;
    if (!key) return false;
    
    try {
      this.googleEngine = new OfficialGoogleGenAI({ apiKey: key });
      this.useGoogle = true;
      return true;
    } catch {
      return false;
    }
  }

  // Disable Google, use local only
  disableGoogleFallback(): void {
    this.googleEngine = undefined;
    this.useGoogle = false;
  }
}

// ---------------------------------------------------------------------------
// AI health check
// ---------------------------------------------------------------------------

export async function getAIStatus(): Promise<AIStatusResult> {
  // Check local first
  try {
    const localStatus = await localGetAIStatus();
    if (localStatus.healthy) {
      return localStatus;
    }
  } catch (e) {
    console.warn('[llm-client] Local health check failed:', e);
  }

  // Check Google if available
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const client = new OfficialGoogleGenAI({ apiKey });
      await client.models.get({ model: MODEL_CONFIG.primaryModel });
      return {
        healthy: true,
        primaryModel: MODEL_CONFIG.primaryModel,
        fallbackModel: MODEL_CONFIG.fallbackModel,
        provider: 'https://generativelanguage.googleapis.com (Google Gemini)',
      };
    } catch (err) {
      console.error('[llm-client] Google health check failed:', err);
    }
  }

  return {
    healthy: false,
    primaryModel: MODEL_CONFIG.primaryModel,
    fallbackModel: MODEL_CONFIG.fallbackModel,
    provider: LOCAL_MODEL_CONFIG.providerUrl,
  };
}

// Export LocalGenAI for direct access if needed
export { LocalGenAI, localGetAIStatus };
export type { LocalGenerateContentArgs, LocalAIResult };