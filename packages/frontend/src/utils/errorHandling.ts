import type { UseToastOptions } from '@chakra-ui/react';

/**
 * Error Handling Utilities
 *
 * Centralized error handling logic for consistent error messaging
 * and logging across the application.
 */

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Configuration for error toast
 */
export interface ErrorToastConfig {
  /** Toast title (e.g., "Failed to create exercise") */
  title: string;
  /** Console error prefix (e.g., "Failed to create exercise:") */
  consolePrefix: string;
  /** Toast description override (defaults to error message) */
  description?: string;
  /** Toast duration in milliseconds (defaults to 5000) */
  duration?: number;
  /** Whether to rethrow the error after handling (defaults to false) */
  rethrow?: boolean;
}

/**
 * Handle errors with consistent logging and toast notifications
 *
 * @param error - The error to handle
 * @param config - Configuration for error handling
 * @param showToast - Chakra UI toast function
 *
 * @example
 * ```typescript
 * try {
 *   await createExercise(data);
 * } catch (err) {
 *   handleError(err, {
 *     title: 'Failed to create exercise',
 *     consolePrefix: 'Failed to create exercise:',
 *     rethrow: true
 *   }, toast);
 * }
 * ```
 */
export function handleError(
  error: unknown,
  config: ErrorToastConfig,
  showToast: (options: UseToastOptions) => void
): void {
  // Log detailed error to console for debugging
  console.error(config.consolePrefix, error);

  // Extract user-friendly error message
  const errorMessage = config.description ?? getErrorMessage(error);

  // Show toast notification
  showToast({
    title: config.title,
    description: errorMessage,
    status: 'error',
    duration: config.duration ?? 5000,
    isClosable: true,
  });

  // Optionally rethrow to prevent modal/form from closing
  if (config.rethrow) {
    throw error;
  }
}
