// packages/backend/src/__tests__/helpers/auth.ts
import crypto from 'crypto';
import request from 'supertest';
import type { Application } from 'express';
import { prisma } from '../../lib/prisma';

const SESSION_SECRET = process.env.SESSION_SECRET as string;
if (!SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in the test environment (.env.test)');
}

/**
 * Signs a session ID the same way express-session does.
 * Cookie value format: s:<sid>.<HMAC-SHA256-base64(sid)-padding-stripped>
 */
function signSessionId(sid: string): string {
  const hash = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(sid)
    .digest('base64')
    .replace(/=+$/, '');
  return `s:${sid}.${hash}`;
}

/**
 * Creates a real Passport session in the test database and returns a
 * connect.sid cookie string to include in Supertest request Cookie headers.
 */
export async function createAuthCookie(userId: string): Promise<string> {
  const sid = crypto.randomUUID();
  const expire = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const sessData = JSON.stringify({
    cookie: {
      originalMaxAge: 604800000,
      expires: expire.toISOString(),
      httpOnly: true,
      path: '/',
    },
    passport: { user: userId },
  });

  // Insert session directly — bypasses the HTTP auth flow entirely.
  await prisma.$executeRaw`
    INSERT INTO session (sid, sess, expire)
    VALUES (${sid}, ${sessData}::json, ${expire})
    ON CONFLICT (sid) DO NOTHING
  `;

  const signedSid = signSessionId(sid);
  return `connect.sid=${encodeURIComponent(signedSid)}`;
}

/**
 * Fetches a CSRF token by calling GET /api/auth/csrf-token with the provided
 * auth cookie. Returns the token value AND the "_csrf=<value>" cookie string
 * to include in subsequent mutating requests.
 */
export async function getCsrfToken(
  app: Application,
  authCookie: string,
): Promise<{ csrfToken: string; csrfCookie: string }> {
  const res = await request(app)
    .get('/api/auth/csrf-token')
    .set('Cookie', authCookie);

  if (res.status !== 200) {
    throw new Error(`getCsrfToken failed: ${res.status} ${JSON.stringify(res.body)}`);
  }

  const csrfToken = res.body.csrfToken as string;

  const setCookieHeaders: string[] = Array.isArray(res.headers['set-cookie'])
    ? res.headers['set-cookie']
    : [String(res.headers['set-cookie'] ?? '')];

  const csrfSetCookie = setCookieHeaders.find((c) => c.startsWith('_csrf=')) ?? '';
  const csrfCookie = csrfSetCookie.split(';')[0]; // "_csrf=<value>"

  return { csrfToken, csrfCookie };
}
