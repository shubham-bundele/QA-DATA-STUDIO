// AI Engine Configuration Loader
// Reads configuration from environment variables and .env.ai file

export interface AIEngineConfig {
  provider: 'local' | 'google' | 'auto';
  googleApiKey?: string;
  enableFallback: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  localEnabled: boolean;
  maxOutputTokens: number;
  temperature: number;
}

function parseEnvFile(): Record<string, string | undefined> {
  // In Node.js/Next.js, we can read from process.env
  // For edge runtime, we rely on process.env being populated by Next.js
  return process.env;
}

function getEnv(key: string, defaultValue: string = ''): string {
  const env = parseEnvFile();
  return env[key] ?? defaultValue;
}

function getEnvBool(key: string, defaultValue: boolean = false): boolean {
  const value = getEnv(key);
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

export function loadAIConfig(): AIEngineConfig {
  const provider = getEnv('AI_PROVIDER', 'local') as 'local' | 'google' | 'auto';
  const googleApiKey = getEnv('GEMINI_API_KEY') || getEnv('GOOGLE_API_KEY');
  
  return {
    provider,
    googleApiKey: googleApiKey || undefined,
    enableFallback: getEnvBool('AI_ENABLE_FALLBACK', true),
    logLevel: getEnv('AI_LOG_LEVEL', 'info') as 'debug' | 'info' | 'warn' | 'error',
    localEnabled: getEnvBool('LOCAL_AI_ENABLED', true),
    maxOutputTokens: parseInt(getEnv('MAX_OUTPUT_TOKENS', '2048'), 10),
    temperature: parseFloat(getEnv('AI_TEMPERATURE', '0.2'))
  };
}

export function createAIConfigOverrides(overrides: Partial<AIEngineConfig>): AIEngineConfig {
  const base = loadAIConfig();
  return { ...base, ...overrides };
}

// Runtime configuration (can be updated without restart)
let runtimeConfig: AIEngineConfig | null = null;

export function getRuntimeConfig(): AIEngineConfig {
  if (!runtimeConfig) {
    runtimeConfig = loadAIConfig();
  }
  return runtimeConfig;
}

export function updateRuntimeConfig(updates: Partial<AIEngineConfig>): AIEngineConfig {
  const current = getRuntimeConfig();
  runtimeConfig = { ...current, ...updates };
  return runtimeConfig;
}

export function resetRuntimeConfig(): void {
  runtimeConfig = null;
}