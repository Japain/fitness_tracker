import { Router } from 'express';
import passport from '../middleware/auth';
import { setCsrfToken, verifyCsrfToken } from '../middleware/csrf';
import { config } from '../config/env';
import type { User } from '@fitness-tracker/shared';

const router = Router();

/**
 * Cookie clearing options
 * Used when logging out to ensure cookies are properly removed
 */
const COOKIE_CLEAR_OPTIONS = {
  httpOnly: true,
  secure: config.isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

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
    failureRedirect: '/login?error=auth_failed',
  }),
  setCsrfToken,
  (req, res) => {
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
      console.error('Error during logout:', err);
      return res.status(500).json({
        error: 'Logout failed',
        message: 'An error occurred while logging out',
      });
    }

    // Destroy session
    req.session.destroy((sessionErr) => {
      if (sessionErr) {
        console.error('Error destroying session:', sessionErr);
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
