import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { config } from '../config/env';

/**
 * CSRF Protection Middleware using Double Submit Cookie pattern
 *
 * This implementation replaces the deprecated 'csurf' package while maintaining
 * the same security guarantees. It works by:
 *
 * 1. Generating a random CSRF token
 * 2. Storing it in a cookie (httpOnly for defense in depth)
 * 3. Requiring the client to obtain the token from the API and send it back in a header
 * 4. Verifying that the cookie value matches the header value
 *
 * Since cookies are automatically sent by the browser but headers must be
 * explicitly set by JavaScript, this prevents CSRF attacks where a malicious
 * site tries to make requests on behalf of the user.
 */

const CSRF_COOKIE_NAME = '_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generates a cryptographically secure random token
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Cookie parser middleware (required for CSRF to work)
 * Export this to be applied before CSRF middleware
 */
export const csrfCookieParser = cookieParser();

/**
 * Middleware to generate and set CSRF token cookie
 * This should be applied to routes that need CSRF protection
 */
export function setCsrfToken(req: Request, res: Response, next: NextFunction): void {
  // Check if CSRF cookie already exists
  let token = req.cookies?.[CSRF_COOKIE_NAME];

  if (!token) {
    // Generate new token
    token = generateToken();

    // Set cookie
    res.cookie(CSRF_COOKIE_NAME, token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (match session duration)
    });
  }

  // Attach token to request for use in getCsrfToken endpoint
  req.csrfToken = () => token;

  next();
}

/**
 * Middleware to verify CSRF token on state-changing requests
 * Apply this to POST, PATCH, PUT, DELETE routes
 */
export function verifyCsrfToken(req: Request, res: Response, next: NextFunction): void {
  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;

  // If user is authenticated, CSRF token is required for security
  if (req.isAuthenticated && req.isAuthenticated()) {
    if (!cookieToken || !headerToken) {
      res.status(403).json({
        error: 'Invalid CSRF token',
        message: 'CSRF token is required for authenticated requests',
      });
      return;
    }

    // Use constant-time comparison to prevent timing attacks
    const cookieBuffer = Buffer.from(cookieToken);
    const headerBuffer = Buffer.from(headerToken);

    if (
      cookieBuffer.length !== headerBuffer.length ||
      !crypto.timingSafeEqual(cookieBuffer, headerBuffer)
    ) {
      res.status(403).json({
        error: 'Invalid CSRF token',
        message: 'CSRF token is required for authenticated requests',
      });
      return;
    }
  }

  next();
}

/**
 * Combined middleware that both sets and verifies CSRF token
 * Use this for convenience on routes that need both behaviors
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  setCsrfToken(req, res, (err) => {
    if (err) return next(err);

    // Only verify on state-changing methods
    const method = req.method.toUpperCase();
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      verifyCsrfToken(req, res, next);
    } else {
      next();
    }
  });
}
