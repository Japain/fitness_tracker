import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { prisma } from '../lib/prisma';
import { createAuthCookie, getCsrfToken } from './helpers/auth';

const app = createApp();

let user1Id: string;
let user2Id: string;
let authCookie1: string;

beforeAll(async () => {
  const user1 = await prisma.user.create({
    data: { googleId: 'workout-test-u1', email: 'workout-u1@test.invalid', displayName: 'Workout User 1' },
  });
  const user2 = await prisma.user.create({
    data: { googleId: 'workout-test-u2', email: 'workout-u2@test.invalid', displayName: 'Workout User 2' },
  });
  user1Id = user1.id;
  user2Id = user2.id;
  authCookie1 = await createAuthCookie(user1Id);
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { id: { in: [user1Id, user2Id] } },
  });
});

beforeEach(async () => {
  await prisma.workoutSession.deleteMany({ where: { userId: { in: [user1Id, user2Id] } } });
});

// ─── POST /api/workouts ───────────────────────────────────────────────────
describe('POST /api/workouts', () => {
  it('creates a new workout and returns 201', async () => {
    const { csrfToken, csrfCookie } = await getCsrfToken(app, authCookie1);

    const res = await request(app)
      .post('/api/workouts')
      .set('Cookie', `${authCookie1}; ${csrfCookie}`)
      .set('x-csrf-token', csrfToken)
      .expect(201);

    expect(res.body.id).toBeTruthy();
    expect(res.body.userId).toBe(user1Id);
    expect(res.body.endTime).toBeNull();
  });

  it('returns 401 when not authenticated', async () => {
    await request(app).post('/api/workouts').expect(401);
  });

  it('returns 403 when CSRF token is missing', async () => {
    await request(app)
      .post('/api/workouts')
      .set('Cookie', authCookie1)
      .expect(403);
  });

  it('returns 409 when an active workout already exists', async () => {
    const { csrfToken, csrfCookie } = await getCsrfToken(app, authCookie1);
    const cookies = `${authCookie1}; ${csrfCookie}`;

    await request(app)
      .post('/api/workouts')
      .set('Cookie', cookies)
      .set('x-csrf-token', csrfToken)
      .expect(201);

    await request(app)
      .post('/api/workouts')
      .set('Cookie', cookies)
      .set('x-csrf-token', csrfToken)
      .expect(409);
  });
});

// ─── GET /api/workouts/active ──────────────────────────────────────────────
describe('GET /api/workouts/active', () => {
  it('returns 204 when no active workout exists', async () => {
    await request(app)
      .get('/api/workouts/active')
      .set('Cookie', authCookie1)
      .expect(204);
  });

  it('returns the active workout when one exists', async () => {
    const workout = await prisma.workoutSession.create({
      data: { userId: user1Id, startTime: new Date() },
    });

    const res = await request(app)
      .get('/api/workouts/active')
      .set('Cookie', authCookie1)
      .expect(200);

    expect(res.body.id).toBe(workout.id);
    expect(res.body.endTime).toBeNull();
  });
});

// ─── PATCH /api/workouts/:id ──────────────────────────────────────────────
describe('PATCH /api/workouts/:id', () => {
  it('finishes a workout by setting endTime', async () => {
    const workout = await prisma.workoutSession.create({
      data: { userId: user1Id, startTime: new Date() },
    });

    const { csrfToken, csrfCookie } = await getCsrfToken(app, authCookie1);
    const endTime = new Date().toISOString();

    const res = await request(app)
      .patch(`/api/workouts/${workout.id}`)
      .set('Cookie', `${authCookie1}; ${csrfCookie}`)
      .set('x-csrf-token', csrfToken)
      .send({ endTime })
      .expect(200);

    expect(res.body.endTime).toBeTruthy();
  });
});

// ─── workoutStatus computed field ─────────────────────────────────────────
describe('GET /api/workouts — workoutStatus field', () => {
  it('returns "active" for a workout started less than 24 hours ago', async () => {
    await prisma.workoutSession.create({
      data: { userId: user1Id, startTime: new Date() },
    });

    const res = await request(app)
      .get('/api/workouts')
      .set('Cookie', authCookie1)
      .expect(200);

    expect(res.body.workouts[0].workoutStatus).toBe('active');
  });

  it('returns "incomplete" for a workout started more than 24 hours ago with no endTime', async () => {
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await prisma.workoutSession.create({
      data: { userId: user1Id, startTime: twentyFiveHoursAgo },
    });

    const res = await request(app)
      .get('/api/workouts')
      .set('Cookie', authCookie1)
      .expect(200);

    expect(res.body.workouts[0].workoutStatus).toBe('incomplete');
  });

  it('returns "completed" for a workout with an endTime set', async () => {
    await prisma.workoutSession.create({
      data: {
        userId: user1Id,
        startTime: new Date(Date.now() - 60 * 60 * 1000),
        endTime: new Date(),
      },
    });

    const res = await request(app)
      .get('/api/workouts')
      .set('Cookie', authCookie1)
      .expect(200);

    expect(res.body.workouts[0].workoutStatus).toBe('completed');
  });
});

// ─── P0: USER DATA SEGREGATION ────────────────────────────────────────────
describe('P0: User data segregation', () => {
  it('GET /api/workouts only returns the authenticated user own workouts', async () => {
    await prisma.workoutSession.create({ data: { userId: user1Id, startTime: new Date() } });
    await prisma.workoutSession.create({ data: { userId: user2Id, startTime: new Date() } });

    const res = await request(app)
      .get('/api/workouts')
      .set('Cookie', authCookie1)
      .expect(200);

    const wrongUser = res.body.workouts.find((w: { userId: string }) => w.userId !== user1Id);
    expect(wrongUser).toBeUndefined();
  });

  it('GET /api/workouts/active does not return another user active workout', async () => {
    await prisma.workoutSession.create({ data: { userId: user2Id, startTime: new Date() } });

    await request(app)
      .get('/api/workouts/active')
      .set('Cookie', authCookie1)
      .expect(204);
  });

  it('PATCH /api/workouts/:id returns 404 when finishing another user workout', async () => {
    const workout = await prisma.workoutSession.create({
      data: { userId: user2Id, startTime: new Date() },
    });

    const { csrfToken, csrfCookie } = await getCsrfToken(app, authCookie1);

    await request(app)
      .patch(`/api/workouts/${workout.id}`)
      .set('Cookie', `${authCookie1}; ${csrfCookie}`)
      .set('x-csrf-token', csrfToken)
      .send({ endTime: new Date().toISOString() })
      .expect(404);
  });
});
