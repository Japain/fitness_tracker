import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { createAuthCookie, getCsrfToken } from './helpers/auth';

const app = createApp();

describe('Smoke tests', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
  });

  it('GET /api/workouts returns 401 without auth', async () => {
    await request(app).get('/api/workouts').expect(401);
  });

  it('auth cookie allows authenticated requests', async () => {
    const user = await prisma.user.create({
      data: {
        googleId: 'smoke-test-google-id',
        email: 'smoke@test.invalid',
        displayName: 'Smoke Test User',
      },
    });

    const authCookie = await createAuthCookie(user.id);
    const res = await request(app)
      .get('/api/workouts')
      .set('Cookie', authCookie)
      .expect(200);

    // GET /api/workouts returns { workouts: [...], pagination: {...} }
    expect(Array.isArray(res.body.workouts)).toBe(true);
  });

  it('getCsrfToken returns token and cookie', async () => {
    const user = await prisma.user.create({
      data: {
        googleId: 'csrf-smoke-google-id',
        email: 'csrf-smoke@test.invalid',
        displayName: 'CSRF Smoke User',
      },
    });

    const authCookie = await createAuthCookie(user.id);
    const { csrfToken, csrfCookie } = await getCsrfToken(app, authCookie);

    expect(csrfToken).toBeTruthy();
    expect(csrfToken.length).toBeGreaterThan(20);
    expect(csrfCookie).toMatch(/^_csrf=/);
  });
});
