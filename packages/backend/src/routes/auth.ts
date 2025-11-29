import { Router } from 'express';
import passport from '../middleware/auth';
import { setCsrfToken } from '../middleware/csrf';
import type { User } from '@fitness-tracker/shared';

const router = Router();

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
  (req, res) => {
    // Successful authentication
    // Redirect to frontend dashboard
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/`);
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

  res.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    profilePictureUrl: user.profilePictureUrl,
    preferredWeightUnit: user.preferredWeightUnit,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
});

/**
 * POST /api/auth/logout
 * End user session and log out
 */
router.post('/logout', (req, res) => {
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
      }

      // Clear session cookie
      res.clearCookie('connect.sid');
      res.clearCookie('_csrf');

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
  const token = (req as any).csrfToken();

  res.json({
    csrfToken: token,
  });
});

export default router;
