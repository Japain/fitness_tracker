/**
 * Request validation middleware using Zod schemas
 * Provides consistent error handling for validation failures
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validates request body against a Zod schema
 * On success: attaches validated data to req.validatedBody and calls next()
 * On failure: returns 400 with detailed error messages
 */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.body);
      // Attach validated data to request for type-safe access in route handlers
      req.validatedBody = validated;
      next();
    } catch (error) {
      // Check for ZodError by name or instanceof to handle CJS/ESM module boundary differences.
      // When the shared validators package (compiled CJS) throws a ZodError and validateRequest.ts
      // (loaded as ESM by Vitest) does instanceof ZodError, they may be different module instances.
      // Checking .name and .issues provides a robust alternative.
      const isZodError = error instanceof ZodError ||
        (error !== null && typeof error === 'object' && (error as any).name === 'ZodError' && Array.isArray((error as any).issues));
      if (isZodError) {
        const zodError = error as ZodError;
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid request data',
          details: zodError.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      // Unexpected error during validation
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to validate request',
      });
    }
  };
}

/**
 * Validates request query parameters against a Zod schema
 * On success: attaches validated data to req.validatedQuery and calls next()
 * On failure: returns 400 with detailed error messages
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = schema.parse(req.query);
      // Attach validated data to request for type-safe access in route handlers
      req.validatedQuery = validated;
      next();
    } catch (error) {
      // Check for ZodError by name or instanceof — see validateBody comment above.
      const isZodError = error instanceof ZodError ||
        (error !== null && typeof error === 'object' && (error as any).name === 'ZodError' && Array.isArray((error as any).issues));
      if (isZodError) {
        const zodError = error as ZodError;
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid query parameters',
          details: zodError.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      // Unexpected error during validation
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Failed to validate query parameters',
      });
    }
  };
}

/**
 * Type augmentation for Express Request to include validated data
 * This allows TypeScript to recognize req.validatedBody and req.validatedQuery
 */
declare global {
  namespace Express {
    interface Request {
      validatedBody?: any;
      validatedQuery?: any;
    }
  }
}
