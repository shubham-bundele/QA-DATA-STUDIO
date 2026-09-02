/**
 * @file llm-client.ts
 * @description Resilient AI client that wraps the official @google/genai SDK
 * maintaining the application's fallback and error handling logic.
 */

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
  primaryModel: "gemini-3.7-flash",
  fallbackModel: "gemini-3.6-flash",
  providerUrl: "https://generativelanguage.googleapis.com",
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
// Helpers
// ---------------------------------------------------------------------------

function isRetryable(status: number): boolean {
  return [408, 500, 502, 503, 504].includes(status);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  const delays = [200, 400, 800];
  let lastError: unknown;

  for (let attempt = 0; attempt <= delays.length; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const status = err?.status;
      if (status != null && isRetryable(status) && attempt < delays.length) {
        console.warn(
          `[llm-client] ${label} attempt ${attempt + 1} failed with status ${status}. Retrying...`
        );
        await delay(delays[attempt]);
        continue;
      }
      break;
    }
  }

  throw lastError;
}

// ---------------------------------------------------------------------------
// GoogleGenAI class wrapper
// ---------------------------------------------------------------------------

export class GoogleGenAI {
  readonly models: {
    generateContent: (args: GenerateContentArgs) => Promise<AIResult>;
    generateContentStream: (
      args: GenerateContentArgs
    ) => Promise<AsyncGenerator<{ text: string }>>;
  };

  private readonly client: OfficialGoogleGenAI;

  constructor(_opts?: unknown) {
    this.client = new OfficialGoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const generateContent = async (
      args: GenerateContentArgs
    ): Promise<AIResult> => {
      
      const doGenerate = async (modelName: string) => {
        return this.client.models.generateContent({
          model: modelName,
          contents: args.contents as any,
          config: args.config as any,
        });
      };

      try {
        const response = await withRetry(
          () => doGenerate(MODEL_CONFIG.primaryModel),
          `generateContent[${MODEL_CONFIG.primaryModel}]`
        );
        return { text: response.text || "" };
      } catch (primaryErr) {
        console.error(`[llm-client] Primary model failed:`, primaryErr);
      }

      try {
        const response = await withRetry(
          () => doGenerate(MODEL_CONFIG.fallbackModel),
          `generateContent[${MODEL_CONFIG.fallbackModel}]`
        );
        return { text: response.text || "" };
      } catch (fallbackErr) {
        const reason = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
        console.error(`[llm-client] Fallback model failed:`, fallbackErr);
        return {
          isAIFailed: true,
          reason: `All models exhausted. Last error: ${reason}`,
        };
      }
    };

    const generateContentStream = async (
      args: GenerateContentArgs
    ): Promise<AsyncGenerator<{ text: string }>> => {
      
      const createStream = (modelName: string) => {
        return this.client.models.generateContentStream({
          model: modelName,
          contents: args.contents as any,
          config: args.config as any,
        });
      };

      let stream: AsyncGenerator | null = null;
      try {
        stream = await withRetry(
          () => Promise.resolve(createStream(MODEL_CONFIG.primaryModel)),
          `generateContentStream[${MODEL_CONFIG.primaryModel}]`
        );
      } catch {
        try {
          stream = await withRetry(
            () => Promise.resolve(createStream(MODEL_CONFIG.fallbackModel)),
            `generateContentStream[${MODEL_CONFIG.fallbackModel}]`
          );
        } catch (err) {
          const reason = err instanceof Error ? err.message : String(err);
          async function* errorGen() {
            yield { text: JSON.stringify({ isAIFailed: true, reason }) };
          }
          return errorGen();
        }
      }

      async function* chunkGenerator(): AsyncGenerator<{ text: string }> {
        if (!stream) return;
        for await (const chunk of stream as any) {
          yield { text: chunk.text || "" };
        }
      }

      return chunkGenerator();
    };

    this.models = { generateContent, generateContentStream };
  }
}

// ---------------------------------------------------------------------------
// AI health check
// ---------------------------------------------------------------------------

export interface AIStatusResult {
  healthy: boolean;
  primaryModel: string;
  fallbackModel: string;
  provider: string;
}

export async function getAIStatus(): Promise<AIStatusResult> {
  const base: Omit<AIStatusResult, "healthy"> = {
    primaryModel: MODEL_CONFIG.primaryModel,
    fallbackModel: MODEL_CONFIG.fallbackModel,
    provider: MODEL_CONFIG.providerUrl,
  };

  try {
    const client = new OfficialGoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    // Minimal check: try to fetch a model info
    await client.models.get({ model: MODEL_CONFIG.primaryModel });
    return { healthy: true, ...base };
  } catch (err) {
    console.error("[llm-client] getAIStatus failed:", err);
    return { healthy: false, ...base };
  }
}
