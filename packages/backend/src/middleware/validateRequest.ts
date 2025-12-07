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
      (req as any).validatedBody = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid request data',
          details: error.issues.map((err: any) => ({
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
      (req as any).validatedQuery = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation error',
          message: 'Invalid query parameters',
          details: error.issues.map((err: any) => ({
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
