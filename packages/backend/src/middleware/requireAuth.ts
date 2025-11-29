import { Request, Response, NextFunction } from 'express';
import type { User } from '@fitness-tracker/shared';

/**
 * Middleware to require authentication for protected routes
 *
 * This middleware checks if a user is authenticated via Passport session.
 * If not authenticated, it returns a 401 Unauthorized response.
 * If authenticated, it allows the request to proceed.
 *
 * Usage:
 * ```typescript
 * import { requireAuth } from './middleware/requireAuth';
 *
 * // Protect a single route
 * app.get('/api/workouts', requireAuth, (req, res) => {
 *   const userId = req.user.id; // User is guaranteed to be present
 *   // ... handle request
 * });
 *
 * // Protect all routes in a router
 * const workoutRouter = Router();
 * workoutRouter.use(requireAuth);
 * ```
 *
 * After this middleware runs successfully:
 * - req.user is guaranteed to be defined and typed as User
 * - req.user.id can be used to filter database queries by userId
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.isAuthenticated()) {
    res.status(401).json({
      error: 'Authentication required',
      message: 'You must be logged in to access this resource',
    });
    return;
  }

  // User is authenticated, ensure type safety
  const user = req.user as User;

  if (!user || !user.id) {
    // Edge case: session exists but user data is malformed
    console.error('Authenticated request has invalid user data:', req.user);
    res.status(401).json({
      error: 'Invalid session',
      message: 'Your session is invalid. Please log in again.',
    });
    return;
  }

  // Continue to next middleware/route handler
  next();
}

/**
 * Type guard to check if user is authenticated
 * Useful for conditional logic outside of middleware
 *
 * Usage:
 * ```typescript
 * if (isAuthenticated(req)) {
 *   const userId = req.user.id;
 * }
 * ```
 */
export function isAuthenticated(req: Request): req is Request & { user: User } {
  return req.isAuthenticated() && !!req.user;
}
