import 'express';

declare global {
  namespace Express {
    interface Request {
      /**
       * CSRF token function added by csrf middleware
       * Returns the current CSRF token for this request
       */
      csrfToken?: () => string;
    }
  }
}
