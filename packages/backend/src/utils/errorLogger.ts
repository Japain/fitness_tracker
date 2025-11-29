import { config } from '../config/env';

/**
 * Error Logger Utility
 *
 * Provides environment-aware error logging that:
 * - Logs full error details in development for debugging
 * - Sanitizes sensitive information in production
 * - Prepares for Sentry integration (noted but not implemented yet)
 *
 * Usage:
 *   import { logError } from '../utils/errorLogger';
 *   logError('Database connection failed', error, { userId: '123' });
 */

interface ErrorContext {
  [key: string]: unknown;
}

/**
 * Logs an error with environment-appropriate detail level
 *
 * @param message - Human-readable error description
 * @param error - The error object (if available)
 * @param context - Additional context (e.g., userId, requestId)
 */
export function logError(
  message: string,
  error?: Error | unknown,
  context?: ErrorContext
): void {
  if (config.isProduction) {
    // Production: Log sanitized error without sensitive details
    console.error({
      message,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      // Only include non-sensitive context fields in production
      ...(context && sanitizeContext(context)),
    });

    // TODO: Send to Sentry in production
    // if (Sentry.isInitialized()) {
    //   Sentry.captureException(error, {
    //     tags: { environment: config.nodeEnv },
    //     extra: context,
    //   });
    // }
  } else {
    // Development: Log full error details for debugging
    console.error('\n=== Error ===');
    console.error('Message:', message);
    if (error) {
      console.error('Error:', error);
      if (error instanceof Error) {
        console.error('Stack:', error.stack);
      }
    }
    if (context) {
      console.error('Context:', context);
    }
    console.error('Timestamp:', new Date().toISOString());
    console.error('=============\n');
  }
}

/**
 * Sanitizes context object to remove sensitive information
 * Removes fields that commonly contain sensitive data
 */
function sanitizeContext(context: ErrorContext): ErrorContext {
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'sessionId'];
  const sanitized: ErrorContext = {};

  for (const [key, value] of Object.entries(context)) {
    // Skip sensitive fields
    if (sensitiveFields.some((field) => key.toLowerCase().includes(field.toLowerCase()))) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Logs an informational message (non-error)
 * Useful for tracking application events
 */
export function logInfo(message: string, data?: ErrorContext): void {
  if (config.isProduction) {
    console.log({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      ...(data && sanitizeContext(data)),
    });
  } else {
    console.log(`[INFO] ${message}`, data || '');
  }
}

/**
 * Logs a warning (potential issue but not critical)
 */
export function logWarning(message: string, data?: ErrorContext): void {
  if (config.isProduction) {
    console.warn({
      level: 'warning',
      message,
      timestamp: new Date().toISOString(),
      ...(data && sanitizeContext(data)),
    });
  } else {
    console.warn(`[WARNING] ${message}`, data || '');
  }
}
