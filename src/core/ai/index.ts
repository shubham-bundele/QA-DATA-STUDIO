// AI Engine Factory - Central entry point for all AI operations
// Automatically selects local or external AI based on configuration

import { LocalGenAI, LocalGenerateContentArgs, LocalAIResult, getAIStatus as localGetAIStatus } from './local-genai';
import { GoogleGenAI, AIResult, getAIStatus as googleGetAIStatus } from '@/lib/llm-client';
import { analyzeUserStory, generateAutomationScript, generateSchemaAnalysis, generateMockEndpoints, generatePerformanceAnalysis, healAccessibilityViolation } from './rule-engine';
import { loadAIConfig, getRuntimeConfig } from './config';

export type AIProvider = 'local' | 'google' | 'auto';

export interface AIEngineConfig {
  provider: AIProvider;
  googleApiKey?: string;
  enableFallback: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  localEnabled: boolean;
  maxOutputTokens: number;
  temperature: number;
}

export interface UnifiedGenerateContentArgs {
  model?: string;
  contents: string | Array<{ role: string; parts: Array<{ text: string }> }>;
  config?: {
    responseSchema?: any;
    responseMimeType?: string;
    temperature?: number;
    maxOutputTokens?: number;
  };
}

export interface UnifiedAIResult {
  text?: string;
  isAIFailed?: boolean;
  reason?: string;
}

export interface UnifiedAIStatus {
  healthy: boolean;
  provider: string;
  model: string;
  isLocal: boolean;
}

class AIEngineFactory {
  private static instance: AIEngineFactory;
  private config: AIEngineConfig;
  private localEngine: LocalGenAI | null = null;
  private googleEngine: GoogleGenAI | null = null;
  private currentProvider: 'local' | 'google' = 'local';
  private initPromise: Promise<void> | null = null;
  
  private constructor() {
    // Load configuration from environment
    const loadedConfig = loadAIConfig();
    this.config = {
      provider: loadedConfig.provider,
      googleApiKey: loadedConfig.googleApiKey,
      enableFallback: loadedConfig.enableFallback,
      logLevel: loadedConfig.logLevel,
      localEnabled: loadedConfig.localEnabled,
      maxOutputTokens: loadedConfig.maxOutputTokens,
      temperature: loadedConfig.temperature
    };
  }
  
  static getInstance(): AIEngineFactory {
    if (!AIEngineFactory.instance) {
      AIEngineFactory.instance = new AIEngineFactory();
    }
    return AIEngineFactory.instance;
  }
  
  // Configure the AI engine
  configure(config: Partial<AIEngineConfig>): void {
    this.config = { ...this.config, ...config };
    this.log('info', `[AIEngineFactory] Configured: ${JSON.stringify(this.config)}`);
    
    // Reset engines on config change
    this.localEngine = null;
    this.googleEngine = null;
    this.initPromise = null;
  }
  
  // Initialize the engine(s)
  async initialize(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this._initialize();
    return this.initPromise;
  }
  
  private async _initialize(): Promise<void> {
    const provider = this.resolveProvider();
    this.currentProvider = provider;
    const configProvider = this.config.provider;
    
    this.log('info', `[AIEngineFactory] Initializing with provider: ${provider}`);
    
    if (configProvider === 'local' || configProvider === 'auto') {
      try {
        this.localEngine = new LocalGenAI({});
        const status = await this.localEngine.getAIStatus();
        this.log('info', `[AIEngineFactory] Local engine ready: ${status.primaryModel}`);
      } catch (error) {
        this.log('error', `[AIEngineFactory] Local engine failed:`, error);
        if (configProvider === 'local') throw error;
      }
    }
    
    if (configProvider === 'google' || configProvider === 'auto') {
      const apiKey = this.config.googleApiKey || process.env.GEMINI_API_KEY;
      if (apiKey) {
        try {
          this.googleEngine = new GoogleGenAI({ apiKey });
          const status = await googleGetAIStatus();
          if (status.healthy) {
            this.log('info', `[AIEngineFactory] Google engine ready: ${status.primaryModel}`);
          } else {
            this.log('warn', `[AIEngineFactory] Google engine unhealthy, falling back to local`);
            this.currentProvider = 'local';
          }
        } catch (error) {
          this.log('error', `[AIEngineFactory] Google engine failed:`, error);
          if (provider === 'google') throw error;
        }
      } else {
        this.log('warn', `[AIEngineFactory] No Google API key, using local engine`);
        this.currentProvider = 'local';
      }
    }
    
    this.log('info', `[AIEngineFactory] Initialization complete. Active provider: ${this.currentProvider}`);
  }
  
  private resolveProvider(): 'local' | 'google' {
    const p = this.config.provider;
    if (p === 'local') return 'local';
    if (p === 'google') return 'google';
    
    // Auto mode: prefer local, fallback to Google if available
    const hasGoogleKey = this.config.googleApiKey || process.env.GEMINI_API_KEY;
    return hasGoogleKey ? 'google' : 'local';
  }
  
  // Main generation method
  async generateContent(args: UnifiedGenerateContentArgs): Promise<UnifiedAIResult> {
    await this.initialize();
    
    const provider = this.currentProvider;
    this.log('debug', `[AIEngineFactory] Generating with ${provider} provider`);
    
    try {
      if (provider === 'local' && this.localEngine) {
        return await this.localEngine.models.generateContent(args as LocalGenerateContentArgs);
      }
      
      if (provider === 'google' && this.googleEngine) {
        const result = await this.googleEngine.models.generateContent(args as any);
        return {
          text: result.text,
          isAIFailed: result.isAIFailed,
          reason: result.isAIFailed ? result.reason : undefined
        };
      }
      
      throw new Error('No AI engine available');
    } catch (error: any) {
      this.log('error', `[AIEngineFactory] Generation failed with ${provider}:`, error);
      
      // Fallback logic
      if (this.config.enableFallback && provider === 'google' && this.localEngine) {
        this.log('warn', `[AIEngineFactory] Falling back to local engine`);
        this.currentProvider = 'local';
        return await this.localEngine.models.generateContent(args as LocalGenerateContentArgs);
      }
      
      if (this.config.enableFallback && provider === 'local' && this.googleEngine) {
        this.log('warn', `[AIEngineFactory] Falling back to Google engine`);
        this.currentProvider = 'google';
        const result = await this.googleEngine.models.generateContent(args as any);
        return {
          text: result.text,
          isAIFailed: result.isAIFailed,
          reason: result.isAIFailed ? result.reason : undefined
        };
      }
      
      return {
        isAIFailed: true,
        reason: `All AI providers failed: ${error.message}`
      };
    }
  }
  
  // Streaming generation
  async generateContentStream(args: UnifiedGenerateContentArgs): Promise<AsyncGenerator<{ text: string }>> {
    await this.initialize();
    
    const provider = this.currentProvider;
    
    try {
      if (provider === 'local' && this.localEngine) {
        return await this.localEngine.models.generateContentStream(args as LocalGenerateContentArgs);
      }
      
      if (provider === 'google' && this.googleEngine) {
        return await this.googleEngine.models.generateContentStream(args as any);
      }
      
      throw new Error('No AI engine available');
    } catch (error: any) {
      this.log('error', `[AIEngineFactory] Streaming failed with ${provider}:`, error);
      
      // Fallback
      if (this.config.enableFallback && provider === 'google' && this.localEngine) {
        this.currentProvider = 'local';
        return await this.localEngine.models.generateContentStream(args as LocalGenerateContentArgs);
      }
      
      if (this.config.enableFallback && provider === 'local' && this.googleEngine) {
        this.currentProvider = 'google';
        return await this.googleEngine.models.generateContentStream(args as any);
      }
      
      async function* errorGenerator(): AsyncGenerator<{ text: string }> {
        yield { text: JSON.stringify({ isAIFailed: true, reason: `Streaming failed: ${error.message}` }) };
      }
      return errorGenerator();
    }
  }
  
  // Health check
  async getStatus(): Promise<UnifiedAIStatus> {
    await this.initialize();
    
    if (this.currentProvider === 'local' && this.localEngine) {
      const status = await this.localEngine.getAIStatus();
      return {
        healthy: status.healthy,
        provider: status.provider,
        model: status.primaryModel,
        isLocal: true
      };
    }
    
    if (this.currentProvider === 'google' && this.googleEngine) {
      const status = await googleGetAIStatus();
      return {
        healthy: status.healthy,
        provider: status.provider,
        model: status.primaryModel,
        isLocal: false
      };
    }
    
    return {
      healthy: false,
      provider: 'none',
      model: 'none',
      isLocal: false
    };
  }
  
  // Get current provider
  getCurrentProvider(): 'local' | 'google' {
    return this.currentProvider;
  }
  
  // Get configuration
  getConfig(): AIEngineConfig {
    return { ...this.config };
  }
  
  // Force switch provider
  async switchProvider(provider: 'local' | 'google'): Promise<boolean> {
    this.log('info', `[AIEngineFactory] Switching to ${provider} provider`);
    
    if (provider === 'local') {
      if (!this.localEngine) {
        this.localEngine = new LocalGenAI({});
      }
      const status = await this.localEngine.getAIStatus();
      if (status.healthy) {
        this.currentProvider = 'local';
        return true;
      }
      return false;
    }
    
    if (provider === 'google') {
      const apiKey = this.config.googleApiKey || process.env.GEMINI_API_KEY;
      if (!apiKey) return false;
      
      if (!this.googleEngine) {
        this.googleEngine = new GoogleGenAI({ apiKey });
      }
      const status = await googleGetAIStatus();
      if (status.healthy) {
        this.currentProvider = 'google';
        return true;
      }
      return false;
    }
    
    return false;
  }
  
  // Direct access to rule engine functions (for when you need structured output)
  getRuleEngine() {
    return {
      analyzeUserStory,
      generateAutomationScript,
      generateSchemaAnalysis,
      generateMockEndpoints,
      generatePerformanceAnalysis,
      healAccessibilityViolation
    };
  }
  
  // Logging utility
  private log(level: AIEngineConfig['logLevel'], message: string, ...args: any[]): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] >= levels[this.config.logLevel]) {
      const prefix = `[AIEngineFactory:${level.toUpperCase()}]`;
      console[level === 'debug' ? 'log' : level](prefix, message, ...args);
    }
  }
  
  // Reset factory (for testing)
  reset(): void {
    this.localEngine = null;
    this.googleEngine = null;
    this.initPromise = null;
    this.currentProvider = 'local';
  }
}

// Singleton instance
export const aiEngine = AIEngineFactory.getInstance();

// Convenience functions for direct use
export async function generateContent(args: UnifiedGenerateContentArgs): Promise<UnifiedAIResult> {
  return aiEngine.generateContent(args);
}

export async function generateContentStream(args: UnifiedGenerateContentArgs): Promise<AsyncGenerator<{ text: string }>> {
  return aiEngine.generateContentStream(args);
}

export async function getAIStatus(): Promise<UnifiedAIStatus> {
  return aiEngine.getStatus();
}

export function configureAI(config: Partial<AIEngineConfig>): void {
  aiEngine.configure(config);
}

export function reloadAIConfig(): AIEngineConfig {
  const loadedConfig = loadAIConfig();
  return aiEngine.configure(loadedConfig), loadedConfig;
}

// Export types and classes
export { AIEngineFactory, LocalGenAI };