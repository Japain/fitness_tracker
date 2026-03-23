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
    data: { googleId: 'exercise-test-u1', email: 'exercise-u1@test.invalid', displayName: 'Exercise User 1' },
  });
  const user2 = await prisma.user.create({
    data: { googleId: 'exercise-test-u2', email: 'exercise-u2@test.invalid', displayName: 'Exercise User 2' },
  });
  user1Id = user1.id;
  user2Id = user2.id;
  authCookie1 = await createAuthCookie(user1Id);
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [user1Id, user2Id] } } });
});

beforeEach(async () => {
  await prisma.exercise.deleteMany({
    where: { isCustom: true, userId: { in: [user1Id, user2Id] } },
  });
});

// ─── GET /api/exercises ───────────────────────────────────────────────────
describe('GET /api/exercises', () => {
  it('returns library exercises for authenticated user', async () => {
    const res = await request(app)
      .get('/api/exercises')
      .set('Cookie', authCookie1)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const libraryExercises = res.body.filter((e: { isCustom: boolean }) => !e.isCustom);
    expect(libraryExercises.length).toBeGreaterThan(0);
  });

  it('returns 401 without auth', async () => {
    await request(app).get('/api/exercises').expect(401);
  });

  it('does not include another user custom exercises', async () => {
    const user2Exercise = await prisma.exercise.create({
      data: {
        name: 'User2 Secret Exercise',
        category: 'Push',
        type: 'strength',
        isCustom: true,
        userId: user2Id,
      },
    });

    const res = await request(app)
      .get('/api/exercises')
      .set('Cookie', authCookie1)
      .expect(200);

    const found = res.body.find((e: { id: string }) => e.id === user2Exercise.id);
    expect(found).toBeUndefined();
  });
});

// ─── POST /api/exercises ──────────────────────────────────────────────────
describe('POST /api/exercises', () => {
  it('creates a custom exercise for the authenticated user', async () => {
    const { csrfToken, csrfCookie } = await getCsrfToken(app, authCookie1);

    const res = await request(app)
      .post('/api/exercises')
      .set('Cookie', `${authCookie1}; ${csrfCookie}`)
      .set('x-csrf-token', csrfToken)
      .send({ name: 'My Custom Lift', category: 'Push', type: 'strength' })
      .expect(201);

    expect(res.body.name).toBe('My Custom Lift');
    expect(res.body.isCustom).toBe(true);
    expect(res.body.userId).toBe(user1Id);
  });

  it('returns 400 for invalid category', async () => {
    const { csrfToken, csrfCookie } = await getCsrfToken(app, authCookie1);

    await request(app)
      .post('/api/exercises')
      .set('Cookie', `${authCookie1}; ${csrfCookie}`)
      .set('x-csrf-token', csrfToken)
      .send({ name: 'Bad Exercise', category: 'InvalidCategory', type: 'strength' })
      .expect(400);
  });
});

// ─── P0: Ownership enforcement ────────────────────────────────────────────
describe('P0: Exercise ownership enforcement', () => {
  it('PATCH returns 403 when user tries to update a library exercise', async () => {
    const libraryExercise = await prisma.exercise.findFirst({ where: { isCustom: false } });
    if (!libraryExercise) throw new Error('No library exercises found — run: DATABASE_URL=... npx prisma db seed');

    const { csrfToken, csrfCookie } = await getCsrfToken(app, authCookie1);

    await request(app)
      .patch(`/api/exercises/${libraryExercise.id}`)
      .set('Cookie', `${authCookie1}; ${csrfCookie}`)
      .set('x-csrf-token', csrfToken)
      .send({ name: 'Hacked Library Exercise' })
      .expect(403);
  });

  it('DELETE returns 403 when user tries to delete a library exercise', async () => {
    const libraryExercise = await prisma.exercise.findFirst({ where: { isCustom: false } });
    if (!libraryExercise) throw new Error('No library exercises found — run: DATABASE_URL=... npx prisma db seed');

    const { csrfToken, csrfCookie } = await getCsrfToken(app, authCookie1);

    await request(app)
      .delete(`/api/exercises/${libraryExercise.id}`)
      .set('Cookie', `${authCookie1}; ${csrfCookie}`)
      .set('x-csrf-token', csrfToken)
      .expect(403);

    const stillExists = await prisma.exercise.findUnique({ where: { id: libraryExercise.id } });
    expect(stillExists).toBeTruthy();
  });

  it('PATCH returns 403 when user tries to update another user custom exercise', async () => {
    const user2Exercise = await prisma.exercise.create({
      data: { name: 'User2 Custom Exercise', category: 'Pull', type: 'strength', isCustom: true, userId: user2Id },
    });

    const { csrfToken, csrfCookie } = await getCsrfToken(app, authCookie1);

    await request(app)
      .patch(`/api/exercises/${user2Exercise.id}`)
      .set('Cookie', `${authCookie1}; ${csrfCookie}`)
      .set('x-csrf-token', csrfToken)
      .send({ name: 'Stolen Exercise Name' })
      .expect(403);

    const unchanged = await prisma.exercise.findUnique({ where: { id: user2Exercise.id } });
    expect(unchanged?.name).toBe('User2 Custom Exercise');
  });

  it('DELETE returns 403 when user tries to delete another user custom exercise', async () => {
    const user2Exercise = await prisma.exercise.create({
      data: { name: 'User2 Delete Target', category: 'Legs', type: 'strength', isCustom: true, userId: user2Id },
    });

    const { csrfToken, csrfCookie } = await getCsrfToken(app, authCookie1);

    await request(app)
      .delete(`/api/exercises/${user2Exercise.id}`)
      .set('Cookie', `${authCookie1}; ${csrfCookie}`)
      .set('x-csrf-token', csrfToken)
      .expect(403);

    const stillExists = await prisma.exercise.findUnique({ where: { id: user2Exercise.id } });
    expect(stillExists).toBeTruthy();
  });

  it('user CAN update their own custom exercise', async () => {
    const { csrfToken: csrfToken1, csrfCookie: csrfCookie1 } = await getCsrfToken(app, authCookie1);

    const createRes = await request(app)
      .post('/api/exercises')
      .set('Cookie', `${authCookie1}; ${csrfCookie1}`)
      .set('x-csrf-token', csrfToken1)
      .send({ name: 'My Original Name', category: 'Core', type: 'strength' })
      .expect(201);

    const { csrfToken: csrfToken2, csrfCookie: csrfCookie2 } = await getCsrfToken(app, authCookie1);

    const updateRes = await request(app)
      .patch(`/api/exercises/${createRes.body.id}`)
      .set('Cookie', `${authCookie1}; ${csrfCookie2}`)
      .set('x-csrf-token', csrfToken2)
      .send({ name: 'My Updated Name' })
      .expect(200);

    expect(updateRes.body.name).toBe('My Updated Name');
  });
});
