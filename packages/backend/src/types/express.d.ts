import 'express';
import type { User } from '@fitness-tracker/shared';

declare global {
  namespace Express {
    interface Request {
      /**
       * CSRF token function added by csrf middleware
       * Returns the current CSRF token for this request
       */
      csrfToken?: () => string;
    }

    /**
     * User type added by Passport.js authentication
     * Available on req.user after successful authentication
     */
    interface User extends import('@fitness-tracker/shared').User {}
  }
}
