// Structured logging with Pino - works on Vercel Edge and Node.js
import pino from 'pino';

export interface LogContext {
  requestId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  endpoint?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  [key: string]: any;
}

export interface LogEntry {
  level: number;
  time: number;
  msg: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  duration?: number;
  statusCode?: number;
}

// Pretty printer for development
const prettyTransport = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'HH:MM:ss Z',
    ignore: 'pid,hostname',
    singleLine: false
  }
};

// Create logger instance
let logger: pino.Logger;

// For edge runtime (Vercel)
if (typeof window === 'undefined' && process.env.NEXT_RUNTIME === 'edge') {
  // Edge-compatible minimal logger
  logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label) => ({ level: label }),
      bindings: () => ({ runtime: 'edge' })
    },
    timestamp: () => `,"time":"${new Date().toISOString()}"`
  });
} else if (process.env.NODE_ENV === 'development') {
  // Development with pretty printing
  logger = pino({
    level: process.env.LOG_LEVEL || 'debug',
    transport: prettyTransport as any,
    formatters: {
      level: (label) => ({ level: label })
    }
  });
} else {
  // Production (Vercel Node.js)
  logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    formatters: {
      level: (label) => ({ level: label }),
      bindings: () => ({ 
        runtime: 'node',
        env: process.env.NODE_ENV,
        region: process.env.VERCEL_REGION
      })
    }
  });
}

// Child logger with context
export function createLogger(context: LogContext): pino.Logger {
  return logger.child(context);
}

// Standard log levels
export const LogLevel = {
  fatal: 60,
  error: 50,
  warn: 30,
  info: 20,
  debug: 10,
  trace: 0
} as const;

// Structured logging helpers
export function logRequest(req: Request, context: LogContext = {}) {
  const requestLogger = createLogger({
    ...context,
    method: req.method,
    url: req.url,
    userAgent: (req.headers.get('user-agent') || undefined) as string | undefined,
    ip: (req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || undefined) as string | undefined
  });
  
  requestLogger.info({ req: { method: req.method, url: req.url } }, 'Incoming request');
  return requestLogger;
}

export function logResponse(logger: pino.Logger, response: Response, duration: number) {
  logger.info({ 
    res: { 
      statusCode: response.status,
      statusText: response.statusText 
    },
    duration 
  }, 'Request completed');
}

export function logError(logger: pino.Logger, error: Error | unknown, context: LogContext = {}) {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error({ 
    err: {
      name: err.name,
      message: err.message,
      stack: err.stack,
      code: (err as any).code
    },
    ...context
  }, 'Error occurred');
}

export function logAIRequest(logger: pino.Logger, task: string, provider: string, duration: number, success: boolean, tokens?: number) {
  logger.info({
    ai: {
      task,
      provider,
      duration,
      success,
      tokens
    }
  }, `AI ${task} ${success ? 'succeeded' : 'failed'}`);
}

export function logCache(logger: pino.Logger, operation: 'hit' | 'miss' | 'set' | 'delete', key: string, ttl?: number) {
  logger.debug({ cache: { operation, key, ttl } }, `Cache ${operation}`);
}

export function logRateLimit(logger: pino.Logger, identifier: string, remaining: number, limited: boolean) {
  logger.warn({ rateLimit: { identifier, remaining, limited } }, limited ? 'Rate limited' : 'Rate limit check');
}

export function logBusinessEvent(logger: pino.Logger, event: string, data: Record<string, any>) {
  logger.info({ event, ...data }, `Business event: ${event}`);
}

// Performance timing helper
export function createTimer() {
  const start = process.hrtime.bigint();
  return {
    stop: (): number => {
      const end = process.hrtime.bigint();
      return Number(end - start) / 1_000_000; // milliseconds
    },
    stopMs: (): number => {
      const end = process.hrtime.bigint();
      return Number(end - start) / 1_000_000;
    }
  };
}

// Async wrapper with logging
export async function withLogging<T>(
  logger: pino.Logger,
  operation: string,
  fn: () => Promise<T>,
  context: LogContext = {}
): Promise<T> {
  const timer = createTimer();
  logger.debug({ ...context, operation }, `Starting ${operation}`);
  
  try {
    const result = await fn();
    const duration = timer.stop();
    logger.info({ ...context, operation, duration, success: true }, `Completed ${operation}`);
    return result;
  } catch (error) {
    const duration = timer.stop();
    logError(logger, error, { ...context, operation, duration, success: false });
    throw error;
  }
}

// Export the main logger
export { logger as defaultLogger };
export default logger;