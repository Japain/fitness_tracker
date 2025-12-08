import { Router } from 'express';
import passport from '../middleware/auth';
import { setCsrfToken, verifyCsrfToken } from '../middleware/csrf';
import { config } from '../config/env';
import { logError } from '../utils/errorLogger';
import type { User } from '@fitness-tracker/shared';

const router = Router();

/**
 * Cookie clearing options
 * Used when logging out to ensure cookies are properly removed
 * Must match session cookie configuration
 */
const COOKIE_CLEAR_OPTIONS: {
  httpOnly: boolean;
  secure: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  path: string;
} = {
  httpOnly: true,
  secure: config.isProduction,
  path: '/',
};

// Only set sameSite in production (matches session cookie config)
if (config.isProduction) {
  COOKIE_CLEAR_OPTIONS.sameSite = 'lax';
}

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback handler
 * Redirects to frontend after successful authentication
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${config.cors.origin}/login?error=auth_failed`,
  }),
  setCsrfToken,
  (req, res) => {
    // Diagnostic logging
    console.log('=== OAuth Callback Success ===');
    console.log('Session ID:', req.sessionID);
    console.log('Is authenticated:', req.isAuthenticated());
    console.log('User:', req.user);
    console.log('Session cookie domain:', req.session.cookie.domain);
    console.log('Session cookie path:', req.session.cookie.path);
    console.log('Session cookie sameSite:', req.session.cookie.sameSite);
    console.log('Redirecting to:', `${config.cors.origin}/`);
    console.log('==============================');

    // Successful authentication
    // Redirect to frontend dashboard
    res.redirect(`${config.cors.origin}/`);
  }
);

/**
 * GET /api/auth/me
 * Get current authenticated user
 * Returns user data if authenticated, 401 if not
 */
router.get('/me', (req, res) => {
  // Diagnostic logging to understand session state
  console.log('=== /api/auth/me DEBUG ===');
  console.log('Session ID:', req.sessionID);
  console.log('Is authenticated:', req.isAuthenticated());
  console.log('Session data:', JSON.stringify(req.session, null, 2));
  console.log('Cookie header:', req.headers.cookie);
  console.log('User agent:', req.headers['user-agent']);
  console.log('Origin:', req.headers.origin);
  console.log('Referer:', req.headers.referer);
  console.log('========================');

  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'User is not logged in',
    });
  }

  const user = req.user as User;

  // Exclude googleId from response for security (internal identifier only)
  const { googleId, ...userResponse } = user;

  res.json(userResponse);
});

/**
 * POST /api/auth/logout
 * End user session and log out
 */
router.post('/logout', verifyCsrfToken, (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: 'Not authenticated',
      message: 'User is not logged in',
    });
  }

  // Use Passport's logout method (req.logout is added by Passport)
  req.logout((err) => {
    if (err) {
      logError('Error during logout', err);
      return res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred while logging out',
      });
    }

    // Destroy session
    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        logError('Error destroying session', sessionErr);
        // Return error if session destruction fails
        // This ensures the client knows the logout may not be complete
        return res.status(500).json({
          error: 'Session destruction failed',
          message: 'Logout succeeded but session cleanup failed. Please try again.',
        });
      }

      // Clear session cookie and CSRF cookie
      res.clearCookie('connect.sid', COOKIE_CLEAR_OPTIONS);
      res.clearCookie('_csrf', COOKIE_CLEAR_OPTIONS);

      res.json({
        success: true,
        message: 'Successfully logged out',
      });
    });
  });
});

/**
 * GET /api/auth/csrf-token
 * Get CSRF token for client-side use
 * The token is also set as a httpOnly cookie
 */
router.get('/csrf-token', setCsrfToken, (req, res) => {
  const token = req.csrfToken?.() || '';

  res.json({
    csrfToken: token,
  });
});

export default router;
