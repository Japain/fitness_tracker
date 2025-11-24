# Architecture Decisions

**Version:** 1.0
**Date:** 2025-11-24
**Author:** Technical Architect Agent
**Status:** Approved for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Authentication & Session Management](#1-authentication--session-management)
3. [Active Workout State Management](#2-active-workout-state-management)
4. [Data Model Decisions](#3-data-model-decisions)
5. [Infrastructure](#4-infrastructure)
6. [Frontend Architecture](#5-frontend-architecture)
7. [Offline Support Strategy](#6-offline-support-strategy)
8. [Analytics Implementation](#7-analytics-implementation)
9. [Security & Performance](#8-security--performance)
10. [Implementation Roadmap](#9-implementation-roadmap)

---

## Executive Summary

This document provides technical architecture decisions for all open questions in PROJECT_REQUIREMENTS.md. Decisions prioritize:

- **Simplicity**: Target <1000 users, avoid premature optimization
- **Developer Velocity**: Choose proven tools with good TypeScript support
- **Scalability Potential**: Architecture can grow to 10,000 users without rewrite
- **Maintainability**: Clear patterns, minimal dependencies

### Key Technology Decisions

| Category | Decision | Rationale |
|----------|----------|-----------|
| **Database** | PostgreSQL | Production-ready, ACID compliance, JSON support for flexibility |
| **ORM** | Prisma | Best TypeScript support, type-safe queries, excellent DX |
| **Auth Library** | Passport.js | Industry standard, Google OAuth support, Express integration |
| **Session Storage** | PostgreSQL (via connect-pg-simple) | Simple deployment, ACID guarantees, no Redis required |
| **Frontend State** | Zustand | Lightweight (3KB), simpler than Redux, better than Context for complex state |
| **CSS Framework** | Chakra UI | 47KB bundle, built-in accessibility, mobile-first utilities |
| **Offline Support** | Optimistic UI + Request Queue | Balance complexity vs. reliability, no Service Workers initially |
| **Rate Limiting** | express-rate-limit | Simple, in-memory for <1000 users |

---

## 1. Authentication & Session Management

### 1.1 OAuth Library Selection

**Decision:** Passport.js with passport-google-oauth20

**Rationale:**
- **Industry Standard**: Most widely used Node.js authentication middleware (23k+ GitHub stars)
- **Express Integration**: Designed specifically for Express, minimal boilerplate
- **Strategy Pattern**: Easy to add additional OAuth providers (GitHub, Auth0) later
- **TypeScript Support**: @types/passport provides full type definitions
- **Battle-Tested**: Used by millions of applications, well-documented edge cases

**Implementation:**

```typescript
// packages/backend/src/middleware/auth.ts
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: "/api/auth/google/callback"
  },
  async (accessToken, refreshToken, profile, done) => {
    // Find or create user in database
    const user = await prisma.user.upsert({
      where: { email: profile.emails[0].value },
      update: {
        displayName: profile.displayName,
        profilePictureUrl: profile.photos[0]?.value
      },
      create: {
        email: profile.emails[0].value,
        displayName: profile.displayName,
        profilePictureUrl: profile.photos[0]?.value
      }
    });
    return done(null, user);
  }
));

// Serialize user ID to session
passport.serializeUser((user: User, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  const user = await prisma.user.findUnique({ where: { id } });
  done(null, user);
});
```

**Alternative Considered:** next-auth / Auth.js
- **Pros**: Modern, built-in TypeScript, supports many providers
- **Cons**: Designed for Next.js, less documentation for Express, introduces unnecessary complexity

---

### 1.2 Token Refresh Strategy

**Decision:** Session-based authentication with 7-day expiration (no JWT refresh tokens)

**Rationale:**
- **Simplicity**: Session cookies automatically handled by browser
- **Security**: httpOnly cookies prevent XSS attacks, server-side session invalidation
- **User Experience**: Users stay logged in for 7 days (configurable)
- **No Token Management**: Avoid complexity of JWT refresh token rotation
- **Revocation**: Can immediately invalidate sessions server-side

**Implementation:**

```typescript
// packages/backend/src/index.ts
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

const PgSession = connectPgSimple(session);

app.use(session({
  store: new PgSession({
    conString: process.env.DATABASE_URL,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in prod
    httpOnly: true, // Prevent XSS access
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'lax' // CSRF protection
  }
}));
```

**Alternative Considered:** JWT with refresh tokens
- **Pros**: Stateless, works for mobile apps
- **Cons**: Complex refresh logic, can't immediately revoke, larger payload
- **Verdict**: Overkill for web-only app with <1000 users

---

### 1.3 CSRF Protection Implementation

**Decision:** Express CSURF middleware with Double Submit Cookie pattern

**Rationale:**
- **Standard Protection**: Prevents cross-site request forgery attacks
- **Cookie SameSite**: Modern browsers honor sameSite='lax', provides baseline protection
- **Defense in Depth**: CSRF tokens add additional layer for older browsers
- **Minimal Frontend Work**: Token automatically sent via cookie, frontend reads and includes in header

**Implementation:**

```typescript
// packages/backend/src/middleware/csrf.ts
import csrf from 'csurf';

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: 'strict'
  }
});

// Apply to all state-changing routes
app.post('/api/*', csrfProtection);
app.patch('/api/*', csrfProtection);
app.delete('/api/*', csrfProtection);

// Endpoint to get CSRF token
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

```typescript
// packages/frontend/src/api/client.ts
// Fetch CSRF token on app load, include in all requests
let csrfToken: string;

async function initCsrfToken() {
  const response = await fetch('/api/csrf-token');
  const data = await response.json();
  csrfToken = data.csrfToken;
}

export async function apiPost(url: string, body: any) {
  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CSRF-Token': csrfToken
    },
    body: JSON.stringify(body),
    credentials: 'include' // Send cookies
  });
}
```

**Alternative Considered:** SameSite cookies only
- **Pros**: No extra token management
- **Cons**: Not supported by older browsers, defense in depth is prudent
- **Verdict**: CSRF tokens provide better protection with minimal overhead

---

### 1.4 Session Storage Mechanism

**Decision:** PostgreSQL-backed sessions via connect-pg-simple

**Rationale:**
- **Simplicity**: No additional infrastructure (Redis) required
- **ACID Guarantees**: Session data survives server restarts
- **Automatic Cleanup**: connect-pg-simple handles expired session deletion
- **Sufficient Performance**: <1000 users = <1000 active sessions, easily handled by PostgreSQL
- **Single Database**: User data + sessions in same database simplifies backups/deployment

**Performance Analysis:**
- **Session Reads**: 1 query per authenticated request (~100-200ms including network)
- **Bottleneck Threshold**: PostgreSQL can handle 10,000+ concurrent connections
- **Optimization Path**: If needed, add Redis later without API changes

**Schema:**

```sql
-- Automatically created by connect-pg-simple
CREATE TABLE "user_sessions" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
) WITH (OIDS=FALSE);
ALTER TABLE "user_sessions" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");
CREATE INDEX "IDX_session_expire" ON "user_sessions" ("expire");
```

**Alternative Considered:** Redis session store
- **Pros**: Faster read/write (in-memory), designed for sessions
- **Cons**: Additional infrastructure, complexity, persistence configuration
- **Verdict**: Premature optimization for <1000 users, adds deployment complexity

**Alternative Considered:** In-memory sessions (MemoryStore)
- **Pros**: Fastest, zero setup
- **Cons**: Lost on server restart, doesn't scale to multiple servers
- **Verdict**: Not production-ready, fails persistence requirements

---

### 1.5 OAuth Callback URL Configuration

**Decision:** Environment-based configuration with separate development/production URLs

**Rationale:**
- **Local Development**: http://localhost:3000/api/auth/google/callback
- **Production**: https://yourdomain.com/api/auth/google/callback
- **Google OAuth Console**: Configure both URLs as authorized redirect URIs
- **Single Codebase**: Environment variable determines which URL to use

**Implementation:**

```typescript
// packages/backend/.env.example
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

// Production .env
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/auth/google/callback
```

```typescript
// packages/backend/src/config/auth.ts
export const authConfig = {
  google: {
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: process.env.GOOGLE_CALLBACK_URL!
  }
};
```

**Deployment Checklist:**
1. Register OAuth app in Google Cloud Console
2. Add both localhost:3000 and production domain to authorized redirect URIs
3. Set environment variables in production (Vercel/Heroku/AWS)
4. Ensure HTTPS in production (required by Google OAuth)

---

## 2. Active Workout State Management

### 2.1 Multi-Device Workout Sessions

**Decision:** Single active workout per user (enforced by database constraint), last-write-wins on conflict

**Rationale:**
- **Simplicity**: One user, one active workout at a time (natural constraint)
- **User Expectation**: Most users won't start workout on phone and desktop simultaneously
- **Conflict Resolution**: If user opens app on second device, show prompt: "You have an active workout on another device. Continue here?"
- **Backend Enforcement**: Database query checks for existing active workout before creating new one

**Implementation:**

```typescript
// packages/backend/src/services/workoutService.ts
export async function createWorkoutSession(userId: string) {
  // Check for existing active workout
  const activeWorkout = await prisma.workoutSession.findFirst({
    where: {
      userId,
      endTime: null // Active workout has no endTime
    }
  });

  if (activeWorkout) {
    throw new ConflictError({
      message: 'You already have an active workout',
      activeWorkoutId: activeWorkout.id
    });
  }

  // Create new workout
  return prisma.workoutSession.create({
    data: {
      userId,
      startTime: new Date()
    }
  });
}
```

```typescript
// packages/frontend/src/hooks/useActiveWorkout.ts
export function useActiveWorkout() {
  const { data: activeWorkout, error } = useSWR('/api/workouts/active');

  if (error?.status === 409) {
    // Show modal: "Resume active workout on this device?"
    return {
      hasConflict: true,
      workoutId: error.activeWorkoutId
    };
  }

  return { activeWorkout };
}
```

**User Flow:**
1. User starts workout on mobile
2. User opens app on desktop → API returns 409 Conflict
3. Frontend shows modal: "You have an active workout. Continue here?"
4. If yes → Load existing workout, allow edits
5. If no → Return to dashboard

**Alternative Considered:** Device-specific workouts
- **Pros**: No conflicts, users can work out on multiple devices
- **Cons**: Data fragmentation, confusing UX, merging complexity
- **Verdict**: Doesn't match real-world usage (users finish workout on one device)

**Alternative Considered:** Automatic sync across devices
- **Pros**: Real-time collaboration
- **Cons**: WebSocket infrastructure, complex conflict resolution, overkill for fitness app
- **Verdict**: Complexity not justified for target user base

---

### 2.2 Active Workout Detection on App Load

**Decision:** Backend endpoint `/api/workouts/active` returns in-progress workout (if any)

**Rationale:**
- **Server as Source of Truth**: Backend has definitive active workout state
- **Automatic Resume**: Frontend calls `/api/workouts/active` on mount, automatically resumes if found
- **Performance**: Single lightweight query (JOIN with exercises), <100ms response
- **Cache Strategy**: Frontend caches result, revalidates on focus

**Implementation:**

```typescript
// packages/backend/src/routes/workouts.ts
app.get('/api/workouts/active', requireAuth, async (req, res) => {
  const activeWorkout = await prisma.workoutSession.findFirst({
    where: {
      userId: req.user.id,
      endTime: null
    },
    include: {
      exercises: {
        include: {
          exercise: true
        },
        orderBy: {
          orderIndex: 'asc'
        }
      }
    }
  });

  if (!activeWorkout) {
    return res.status(204).end(); // No active workout
  }

  res.json(activeWorkout);
});
```

```typescript
// packages/frontend/src/App.tsx
function App() {
  const { activeWorkout, isLoading } = useActiveWorkout();

  useEffect(() => {
    if (activeWorkout) {
      // Redirect to active workout screen
      navigate(`/workout/${activeWorkout.id}`);
    }
  }, [activeWorkout]);

  // ... rest of app
}
```

**Performance Optimization:**
- Use SWR for client-side caching: `useSWR('/api/workouts/active', { revalidateOnFocus: true })`
- Backend adds database index: `CREATE INDEX idx_active_workouts ON workout_sessions(user_id, end_time) WHERE end_time IS NULL;`

---

### 2.3 Abandoned Workout Cleanup

**Decision:** Keep all workouts indefinitely, flag as "incomplete" in UI if endTime is null and startTime > 24 hours ago

**Rationale:**
- **Data Preservation**: Users may want to complete workout later or use data for logging
- **No Data Loss**: Deleting abandoned workouts risks losing user data
- **UI Indication**: Show "Resume incomplete workout?" prompt on dashboard
- **Manual Cleanup**: Users can delete or complete incomplete workouts manually

**Implementation:**

```typescript
// packages/backend/src/routes/workouts.ts
app.get('/api/workouts', requireAuth, async (req, res) => {
  const workouts = await prisma.workoutSession.findMany({
    where: { userId: req.user.id },
    orderBy: { startTime: 'desc' }
  });

  const categorized = {
    active: workouts.filter(w => !w.endTime && isRecent(w.startTime)), // < 24h
    incomplete: workouts.filter(w => !w.endTime && !isRecent(w.startTime)), // > 24h
    completed: workouts.filter(w => w.endTime)
  };

  res.json(categorized);
});

function isRecent(date: Date): boolean {
  const hoursSince = (Date.now() - date.getTime()) / (1000 * 60 * 60);
  return hoursSince < 24;
}
```

**UI Treatment:**
- Dashboard shows: "You have an incomplete workout from 2 days ago. [Complete] [Delete]"
- Workout history shows incomplete workouts with orange "Incomplete" badge
- User can click to complete or delete

**Alternative Considered:** Auto-delete after 7 days
- **Pros**: Keeps database clean
- **Cons**: Risk of data loss, users may want to complete later
- **Verdict**: Preservation preferred, storage is cheap

---

## 3. Data Model Decisions

### 3.1 Sets/Reps Storage Strategy

**Decision:** Store each set as a separate WorkoutSet record (not aggregated in WorkoutExercise)

**Rationale:**
- **Granular Data**: Track individual set performance (progressive overload tracking)
- **REST Timer**: Can add restTime between sets in future
- **Progressive Disclosure**: Users add sets one at a time during workout
- **Query Simplicity**: Easier to query "best set" or "total volume"
- **Flexibility**: Supports advanced features (drop sets, supersets) in future

**Schema:**

```prisma
// packages/backend/prisma/schema.prisma
model WorkoutExercise {
  id               String       @id @default(uuid())
  workoutSessionId String
  exerciseId       String
  orderIndex       Int
  notes            String?
  createdAt        DateTime     @default(now())

  workoutSession   WorkoutSession @relation(fields: [workoutSessionId], references: [id], onDelete: Cascade)
  exercise         Exercise       @relation(fields: [exerciseId], references: [id])
  sets             WorkoutSet[]   // One-to-many relationship
}

model WorkoutSet {
  id                String   @id @default(uuid())
  workoutExerciseId String
  setNumber         Int      // 1, 2, 3, ...
  reps              Int?
  weight            Float?
  weightUnit        String?  // "lbs" | "kg" | "bodyweight"
  duration          Int?     // seconds (for cardio)
  distance          Float?   // miles/km (for cardio)
  distanceUnit      String?  // "miles" | "km"
  completed         Boolean  @default(false)
  createdAt         DateTime @default(now())

  workoutExercise   WorkoutExercise @relation(fields: [workoutExerciseId], references: [id], onDelete: Cascade)

  @@index([workoutExerciseId, setNumber])
}
```

**API Design:**

```typescript
// Add exercise with initial set
POST /api/workouts/:workoutId/exercises
{
  "exerciseId": "uuid",
  "sets": [
    { "setNumber": 1, "reps": 10, "weight": 135, "weightUnit": "lbs" }
  ]
}

// Add another set to existing exercise
POST /api/workouts/:workoutId/exercises/:exerciseId/sets
{
  "setNumber": 2,
  "reps": 10,
  "weight": 135,
  "weightUnit": "lbs"
}

// Update specific set (mark complete, adjust weight)
PATCH /api/workouts/:workoutId/exercises/:exerciseId/sets/:setId
{
  "completed": true,
  "weight": 140
}
```

**Query Examples:**

```typescript
// Get all sets for workout
const workoutWithSets = await prisma.workoutSession.findUnique({
  where: { id: workoutId },
  include: {
    exercises: {
      include: {
        sets: {
          orderBy: { setNumber: 'asc' }
        },
        exercise: true
      },
      orderBy: { orderIndex: 'asc' }
    }
  }
});

// Find personal record (max weight for exercise)
const pr = await prisma.workoutSet.findFirst({
  where: {
    workoutExercise: {
      exerciseId: exerciseId,
      workoutSession: {
        userId: userId,
        endTime: { not: null } // Only completed workouts
      }
    },
    weight: { not: null }
  },
  orderBy: { weight: 'desc' }
});
```

**Alternative Considered:** Aggregate sets in WorkoutExercise as JSON
- **Example**: `sets: [{ reps: 10, weight: 135 }, { reps: 10, weight: 135 }]`
- **Pros**: Fewer database rows, simpler queries
- **Cons**: Can't query individual sets (e.g., "best set"), loses relational benefits, harder to add set-level metadata
- **Verdict**: Relational model provides more flexibility for future features

---

### 3.2 Mixed Exercise Types (Strength + Cardio)

**Decision:** Single WorkoutExercise/WorkoutSet model with nullable fields (reps/weight for strength, duration/distance for cardio)

**Rationale:**
- **Simplicity**: One model handles both types, avoids polymorphic relationships
- **Common Fields**: Most fields shared (workout, exercise, order, notes)
- **Type Safety**: Exercise.type field ('strength' | 'cardio') indicates which fields are populated
- **Validation**: Backend validates correct fields present based on exercise type

**Schema:**

```prisma
model Exercise {
  id          String   @id @default(uuid())
  name        String
  category    String?  // "Push", "Pull", "Legs", "Cardio", "Core"
  type        String   // "strength" | "cardio"
  isCustom    Boolean  @default(false)
  userId      String?  // Set if custom exercise
  createdAt   DateTime @default(now())

  @@index([userId, isCustom])
}

model WorkoutSet {
  // Strength exercise fields
  reps       Int?
  weight     Float?
  weightUnit String? // "lbs" | "kg" | "bodyweight"

  // Cardio exercise fields
  duration     Int?    // seconds
  distance     Float?
  distanceUnit String? // "miles" | "km"

  // Common fields
  setNumber         Int
  completed         Boolean
  workoutExerciseId String
  // ... other fields
}
```

**Validation:**

```typescript
// packages/backend/src/validators/workoutSet.ts
export function validateWorkoutSet(set: WorkoutSetInput, exerciseType: string) {
  if (exerciseType === 'strength') {
    if (set.reps == null) throw new ValidationError('Reps required for strength exercise');
    // weight is optional (bodyweight exercises)
    if (set.duration != null || set.distance != null) {
      throw new ValidationError('Strength exercises cannot have duration/distance');
    }
  } else if (exerciseType === 'cardio') {
    if (set.duration == null && set.distance == null) {
      throw new ValidationError('Cardio exercises require duration or distance');
    }
    if (set.reps != null || set.weight != null) {
      throw new ValidationError('Cardio exercises cannot have reps/weight');
    }
  }
}
```

**Frontend Type Guards:**

```typescript
// packages/shared/types/index.ts
export type StrengthSet = {
  reps: number;
  weight?: number;
  weightUnit?: 'lbs' | 'kg' | 'bodyweight';
  duration?: never;
  distance?: never;
};

export type CardioSet = {
  duration?: number; // seconds
  distance?: number;
  distanceUnit?: 'miles' | 'km';
  reps?: never;
  weight?: never;
};

export type WorkoutSet = (StrengthSet | CardioSet) & {
  id: string;
  setNumber: number;
  completed: boolean;
  workoutExerciseId: string;
  createdAt: Date;
};
```

**Alternative Considered:** Separate StrengthSet and CardioSet tables
- **Pros**: Enforced field requirements, cleaner schema
- **Cons**: Complex polymorphic queries, code duplication, API complexity
- **Verdict**: Single table with nullables is simpler for <1000 users

---

### 3.3 Unit Conversion Strategy

**Decision:** Store user's preferred unit, display in that unit, allow conversion on-demand (backend utility)

**Rationale:**
- **User Preference**: Most users consistently use lbs OR kg (not mixed)
- **No Automatic Conversion**: Avoid confusion, store exactly what user entered
- **Display Conversion**: Show "135 lbs (61 kg)" in UI if user enables
- **Backend Utility**: Provide conversion functions for analytics/comparisons

**Implementation:**

```prisma
model User {
  id                 String   @id @default(uuid())
  email              String   @unique
  displayName        String
  preferredWeightUnit String  @default("lbs") // "lbs" | "kg"
  createdAt          DateTime @default(now())
}
```

```typescript
// packages/shared/utils/unitConversion.ts
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10; // Round to 1 decimal
}

export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function convertWeight(
  weight: number,
  fromUnit: 'lbs' | 'kg',
  toUnit: 'lbs' | 'kg'
): number {
  if (fromUnit === toUnit) return weight;
  return fromUnit === 'lbs' ? lbsToKg(weight) : kgToLbs(weight);
}

// Distance conversion
export function milesToKm(miles: number): number {
  return Math.round(miles * 1.60934 * 100) / 100;
}

export function kmToMiles(km: number): number {
  return Math.round(km * 0.621371 * 100) / 100;
}
```

**Frontend Display:**

```typescript
// packages/frontend/src/components/WeightDisplay.tsx
export function WeightDisplay({ weight, unit }: { weight: number; unit: string }) {
  const user = useUser();
  const showConversion = user.preferredWeightUnit !== unit;

  return (
    <span>
      {weight} {unit}
      {showConversion && (
        <span className="text-neutral-600 text-sm ml-2">
          ({convertWeight(weight, unit, user.preferredWeightUnit)} {user.preferredWeightUnit})
        </span>
      )}
    </span>
  );
}
```

**Settings Page:**
- User can change preferred unit
- Apply to all NEW sets going forward
- Historical sets remain in original unit (data integrity)

**Alternative Considered:** Always store in kg (metric standard)
- **Pros**: Single unit for analytics, easier comparisons
- **Cons**: US users expect lbs, lossy conversion, UX friction
- **Verdict**: Store user's input unit, preserve data fidelity

---

### 3.4 Exercise Categorization

**Decision:** Use single `category` string field with predefined taxonomy (not separate Category table)

**Rationale:**
- **Simplicity**: 5 primary categories (Push, Pull, Legs, Core, Cardio) fit in string field
- **Query Performance**: Simple WHERE category = 'Push' query (indexed)
- **No Joins**: Faster reads, simpler API responses
- **Future Flexibility**: Can migrate to separate table if >20 categories needed

**Taxonomy:**

```typescript
// packages/shared/types/exercise.ts
export const EXERCISE_CATEGORIES = {
  PUSH: 'Push',        // Chest, Shoulders, Triceps
  PULL: 'Pull',        // Back, Biceps
  LEGS: 'Legs',        // Quads, Hamstrings, Glutes, Calves
  CORE: 'Core',        // Abs, Obliques
  CARDIO: 'Cardio'     // Running, Cycling, etc.
} as const;

export type ExerciseCategory = typeof EXERCISE_CATEGORIES[keyof typeof EXERCISE_CATEGORIES];
```

**Database Constraint:**

```sql
ALTER TABLE exercises
ADD CONSTRAINT check_category
CHECK (category IN ('Push', 'Pull', 'Legs', 'Core', 'Cardio'));
```

**Search/Filter:**

```typescript
// Backend API
app.get('/api/exercises', requireAuth, async (req, res) => {
  const { category, search } = req.query;

  const exercises = await prisma.exercise.findMany({
    where: {
      OR: [
        { isCustom: false }, // Library exercises
        { userId: req.user.id, isCustom: true } // User's custom exercises
      ],
      ...(category && { category: category as string }),
      ...(search && {
        name: {
          contains: search as string,
          mode: 'insensitive'
        }
      })
    },
    orderBy: { name: 'asc' }
  });

  res.json(exercises);
});
```

**Alternative Considered:** Many-to-many with Category table
- **Pros**: Exercises can have multiple categories (e.g., "Push + Core")
- **Cons**: JOIN overhead, unnecessary complexity for 60 exercises
- **Verdict**: Single category sufficient for initial 60 exercises

---

## 4. Infrastructure

### 4.1 Database Selection

**Decision:** PostgreSQL 15+ (production) with Prisma ORM

**Rationale:**

**PostgreSQL Advantages:**
- **Production-Ready**: ACID compliance, proven reliability at scale
- **JSON Support**: Can store flexible data (future workout templates) in JSONB columns
- **Full-Text Search**: Built-in search for exercise names (vs. SQLite requires extensions)
- **Concurrent Writes**: Better performance for multiple users logging simultaneously
- **Deployment**: Supported by all major platforms (Heroku, Railway, Supabase, AWS RDS)
- **Type Safety**: Prisma generates TypeScript types from schema

**Performance at Target Scale:**
- **1,000 users**: ~500 concurrent sessions, PostgreSQL handles easily
- **10,000 users**: Still well within PostgreSQL capacity (millions of rows)
- **Query Optimization**: Indexes on userId, startTime, exerciseId ensure <100ms queries

**Prisma ORM Benefits:**
- **Best-in-Class TypeScript Support**: Auto-generated types, compile-time query validation
- **Developer Experience**: Intuitive query API, excellent documentation
- **Migrations**: Built-in migration system (prisma migrate)
- **Introspection**: Can generate schema from existing database
- **Schema-First**: Single source of truth in schema.prisma file

**Setup:**

```prisma
// packages/backend/prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

model User {
  id                 String           @id @default(uuid())
  email              String           @unique
  displayName        String
  profilePictureUrl  String?
  preferredWeightUnit String          @default("lbs")
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt

  workoutSessions    WorkoutSession[]
  customExercises    Exercise[]

  @@index([email])
}

model Exercise {
  id          String   @id @default(uuid())
  name        String
  category    String?
  type        String   // "strength" | "cardio"
  isCustom    Boolean  @default(false)
  userId      String?
  createdAt   DateTime @default(now())

  user               User?              @relation(fields: [userId], references: [id], onDelete: Cascade)
  workoutExercises   WorkoutExercise[]

  @@index([userId, isCustom])
  @@index([name]) // For search
}

model WorkoutSession {
  id        String   @id @default(uuid())
  userId    String
  startTime DateTime @default(now())
  endTime   DateTime?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  exercises WorkoutExercise[]

  @@index([userId, startTime])
  @@index([userId, endTime]) // For active workout queries
}

model WorkoutExercise {
  id               String   @id @default(uuid())
  workoutSessionId String
  exerciseId       String
  orderIndex       Int
  notes            String?
  createdAt        DateTime @default(now())

  workoutSession   WorkoutSession @relation(fields: [workoutSessionId], references: [id], onDelete: Cascade)
  exercise         Exercise       @relation(fields: [exerciseId], references: [id])
  sets             WorkoutSet[]

  @@index([workoutSessionId, orderIndex])
}

model WorkoutSet {
  id                String   @id @default(uuid())
  workoutExerciseId String
  setNumber         Int
  reps              Int?
  weight            Float?
  weightUnit        String?
  duration          Int?     // seconds
  distance          Float?
  distanceUnit      String?
  completed         Boolean  @default(false)
  createdAt         DateTime @default(now())

  workoutExercise   WorkoutExercise @relation(fields: [workoutExerciseId], references: [id], onDelete: Cascade)

  @@index([workoutExerciseId, setNumber])
}
```

**Database Indexes Strategy:**
- **Primary Indexes**: userId + startTime (workout history queries)
- **Active Workout Index**: userId + endTime WHERE endTime IS NULL (partial index)
- **Search Index**: Exercise name (BTREE index for ILIKE queries)
- **Foreign Keys**: All relationships indexed automatically by Prisma

**Development vs. Production:**
- **Development**: Local PostgreSQL via Docker or PostgreSQL.app
- **Production**: Managed PostgreSQL (Railway, Supabase, or AWS RDS)

**Alternative Considered:** SQLite
- **Pros**: Zero setup, file-based, simpler deployment
- **Cons**: No concurrent writes, limited full-text search, not production-ready at scale
- **Verdict**: PostgreSQL provides better production guarantees with manageable complexity

**Alternative Considered:** MongoDB
- **Pros**: Flexible schema, JSON-native
- **Cons**: No ACID transactions, less mature TypeScript support, poor fit for relational workout data
- **Verdict**: PostgreSQL's relational model better matches data structure

---

### 4.2 Rate Limiting Strategy

**Decision:** express-rate-limit with in-memory store (upgrade to Redis if needed)

**Rationale:**
- **Abuse Prevention**: Prevent brute-force attacks on authentication, API flooding
- **Simple Setup**: express-rate-limit is battle-tested, zero configuration
- **Sufficient for <1000 users**: In-memory store handles target scale
- **Granular Limits**: Different limits per endpoint (strict for auth, lenient for workout logging)

**Implementation:**

```typescript
// packages/backend/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

// Strict limit for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate limit for API endpoints
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

// Lenient limit for workout logging (users add sets rapidly)
export const workoutLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200, // 200 requests per minute (very lenient)
  keyGenerator: (req) => req.user?.id || req.ip, // Per user, not IP
});
```

```typescript
// Apply to routes
app.use('/api/auth', authLimiter);
app.use('/api/*', apiLimiter);
app.use('/api/workouts/:id/exercises', workoutLimiter); // Override for workout logging
```

**Rate Limit Thresholds:**

| Endpoint | Window | Limit | Rationale |
|----------|--------|-------|-----------|
| `/api/auth/*` | 15 min | 5 | Prevent brute-force attacks |
| `/api/workouts` (read) | 1 min | 100 | Typical usage: 1-2 requests/sec max |
| `/api/workouts/:id/exercises` (write) | 1 min | 200 | Rapid set logging during workout |
| `/api/exercises` (read) | 1 min | 100 | Exercise library queries |

**Upgrade Path (if needed):**
```typescript
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: process.env.REDIS_URL });

export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:' // rate limit prefix
  }),
  // ... rest of config
});
```

**Monitoring:**
- Log rate limit hits: `app.use((req, res, next) => { if (req.rateLimit) console.log('Rate limit info:', req.rateLimit); })`
- Cloudflare/Nginx can provide additional DDoS protection at edge

**Alternative Considered:** No rate limiting
- **Verdict**: Security risk, essential for production apps

---

### 4.3 Environment Configuration

**Decision:** dotenv with separate .env files per environment

**Rationale:**
- **Standard Pattern**: dotenv is Node.js standard for environment variables
- **Type Safety**: Create config module with validated env vars
- **Secrets Management**: .env files gitignored, use platform-specific secrets in production

**Structure:**

```
packages/backend/
  .env.example          # Template with all required variables
  .env.development      # Local development (gitignored)
  .env.test             # Test environment (gitignored)
  .env.production       # Production (NOT committed, set via platform)
```

**Configuration Module:**

```typescript
// packages/backend/src/config/env.ts
import dotenv from 'dotenv';
import path from 'path';

// Load appropriate .env file
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GOOGLE_CALLBACK_URL'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Export typed config
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL!
  },
  session: {
    secret: process.env.SESSION_SECRET!,
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800000', 10) // 7 days default
  },
  auth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackUrl: process.env.GOOGLE_CALLBACK_URL!
    }
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  }
} as const;
```

**.env.example:**

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fitness_tracker

# Session
SESSION_SECRET=your-secret-key-change-in-production
SESSION_MAX_AGE=604800000

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
```

**Production Deployment:**
- Heroku: `heroku config:set DATABASE_URL=...`
- Vercel: Add env vars in project settings
- AWS: Use Parameter Store or Secrets Manager

---

## 5. Frontend Architecture

### 5.1 State Management Library

**Decision:** Zustand for global state (auth, active workout), React Query (SWR) for server state

**Rationale:**

**Zustand Benefits:**
- **Lightweight**: 3KB bundle (vs. Redux 47KB)
- **Simple API**: No boilerplate, no providers
- **TypeScript-First**: Excellent type inference
- **Developer Experience**: Minimal learning curve
- **Sufficient for App**: Only need global state for auth + active workout

**React Query (SWR) for Server State:**
- **Automatic Caching**: Cache API responses, revalidate on window focus
- **Loading/Error States**: Built-in states for async operations
- **Optimistic Updates**: Update UI before server response
- **Request Deduplication**: Multiple components can request same data without duplicate fetches

**Implementation:**

```typescript
// packages/frontend/src/stores/authStore.ts
import { create } from 'zustand';
import { User } from '@fitness-tracker/shared';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: (user) => set({ user, isAuthenticated: true }),

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const user = await response.json();
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
```

```typescript
// packages/frontend/src/hooks/useActiveWorkout.ts
import useSWR from 'swr';
import { WorkoutSession } from '@fitness-tracker/shared';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useActiveWorkout() {
  const { data, error, mutate } = useSWR<WorkoutSession | null>(
    '/api/workouts/active',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000 // Don't refetch within 5 seconds
    }
  );

  return {
    activeWorkout: data,
    isLoading: !error && !data,
    isError: error,
    refetch: mutate
  };
}
```

**State Organization:**

- **Zustand Stores**: Auth state, UI state (modals, toasts)
- **React Query**: All server data (workouts, exercises, history)
- **Component State**: Form inputs, local UI state (expanded sections)

**Alternative Considered:** Redux Toolkit
- **Pros**: Industry standard, DevTools, time-travel debugging
- **Cons**: 47KB bundle, verbose boilerplate, overkill for simple app
- **Verdict**: Zustand provides 90% of benefits at 6% of the bundle size

**Alternative Considered:** React Context only
- **Pros**: Built-in, no dependencies
- **Cons**: Re-renders all consumers, no built-in async handling, verbose for complex state
- **Verdict**: Good for simple state, but Zustand + SWR is better DX

---

### 5.2 TypeScript Configuration

**Decision:** Strict mode enabled with project references for monorepo

**Rationale:**
- **Type Safety**: Catch errors at compile time, reduce runtime bugs
- **Monorepo Support**: TypeScript project references enable incremental builds
- **Shared Types**: Import types from `@fitness-tracker/shared` package
- **Build Performance**: Only rebuild changed packages

**Root tsconfig.json:**

```json
{
  "files": [],
  "references": [
    { "path": "./packages/shared" },
    { "path": "./packages/backend" },
    { "path": "./packages/frontend" }
  ]
}
```

**packages/shared/tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "outDir": "./dist",
    "rootDir": "./types"
  },
  "include": ["types/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**packages/backend/tsconfig.json:**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "references": [
    { "path": "../shared" }
  ],
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**packages/frontend/tsconfig.json:**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "composite": true
  },
  "references": [
    { "path": "../shared" }
  ],
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Strict Mode Implications:**
- `strictNullChecks`: Must handle null/undefined explicitly
- `noImplicitAny`: All variables must have explicit or inferred types
- `strictFunctionTypes`: Function parameter types checked contravariantly
- `strictBindCallApply`: Bind/call/apply methods type-checked

**Import Example:**

```typescript
// packages/frontend/src/pages/Dashboard.tsx
import { User, WorkoutSession } from '@fitness-tracker/shared';

interface DashboardProps {
  user: User;
  recentWorkouts: WorkoutSession[];
}

export function Dashboard({ user, recentWorkouts }: DashboardProps) {
  // TypeScript knows exact shape of user and workouts
  return (
    <div>
      <h1>Welcome back, {user.displayName}!</h1>
      {recentWorkouts.map(workout => (
        <WorkoutCard key={workout.id} workout={workout} />
      ))}
    </div>
  );
}
```

---

### 5.3 CSS Framework Integration

**Decision:** Chakra UI with custom theme based on design system

**Rationale:**
- **Bundle Size**: 47KB (acceptable for mobile target, smaller than Material UI 92KB)
- **Accessibility**: Built-in WCAG AA compliance, keyboard navigation
- **Mobile-First**: Responsive utilities (base, sm, md, lg breakpoints)
- **Design System Alignment**: Easily map design tokens from DESIGN-DOCUMENTATION.md
- **Developer Experience**: Component-based, excellent TypeScript support

**Setup:**

```typescript
// packages/frontend/src/theme/index.ts
import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6', // primary-brand
      600: '#2563EB', // primary-hover
      700: '#1D4ED8', // primary-active
      800: '#1E40AF',
      900: '#1E3A8A',
    },
    neutral: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    success: {
      500: '#10B981',
      bg: '#D1FAE5',
    },
    error: {
      500: '#EF4444',
      bg: '#FEE2E2',
    },
  },
  fonts: {
    body: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif`,
    heading: `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif`,
  },
  fontSizes: {
    h1: '28px',
    h2: '24px',
    h3: '20px',
    xl: '18px',
    md: '16px',
    sm: '14px',
    xs: '12px',
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  radii: {
    sm: '6px',
    md: '12px',
    lg: '16px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md',
      },
      sizes: {
        lg: {
          h: '56px',
          fontSize: 'xl',
          px: 'xl',
        },
        md: {
          h: '44px',
          fontSize: 'md',
          px: 'lg',
        },
      },
      variants: {
        primary: {
          bg: 'primary.500',
          color: 'white',
          _hover: {
            bg: 'primary.600',
            transform: 'translateY(-1px)',
            boxShadow: 'lg',
          },
          _active: {
            bg: 'primary.700',
            transform: 'translateY(0)',
          },
        },
        secondary: {
          bg: 'neutral.100',
          color: 'neutral.700',
          border: '1px solid',
          borderColor: 'neutral.300',
          _hover: {
            bg: 'neutral.200',
          },
        },
      },
      defaultProps: {
        size: 'md',
        variant: 'primary',
      },
    },
  },
});

export default theme;
```

```typescript
// packages/frontend/src/main.tsx
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>
);
```

**Component Usage:**

```typescript
import { Button, Box, Heading } from '@chakra-ui/react';

export function Dashboard() {
  return (
    <Box p="lg">
      <Heading fontSize="h1" mb="xl">Welcome back!</Heading>
      <Button
        variant="primary"
        size="lg"
        w="full"
        onClick={startWorkout}
      >
        Start New Workout
      </Button>
    </Box>
  );
}
```

**Performance Optimization:**
- **Tree Shaking**: Vite automatically tree-shakes unused Chakra components
- **Code Splitting**: Lazy load Chakra icons: `const Icon = lazy(() => import('@chakra-ui/icons'))`
- **System Fonts**: No web font loading overhead

---

### 5.4 Routing Strategy

**Decision:** React Router v6 with protected routes and nested layouts

**Rationale:**
- **Industry Standard**: Most popular React routing library
- **Type-Safe**: TypeScript support for route parameters
- **Nested Routes**: Layout components (TopNav, BottomNav) shared across pages
- **Lazy Loading**: Code-split routes for better initial load time

**Implementation:**

```typescript
// packages/frontend/src/router/index.tsx
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../layouts/AppLayout';
import { LoadingSpinner } from '../components/LoadingSpinner';

// Lazy-loaded pages
const Dashboard = lazy(() => import('../pages/Dashboard'));
const ActiveWorkout = lazy(() => import('../pages/ActiveWorkout'));
const WorkoutHistory = lazy(() => import('../pages/WorkoutHistory'));
const WorkoutDetail = lazy(() => import('../pages/WorkoutDetail'));
const AuthPage = lazy(() => import('../pages/AuthPage'));

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Suspense fallback={<LoadingSpinner />}><AuthPage /></Suspense>,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout>
          <Outlet />
        </AppLayout>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Suspense fallback={<LoadingSpinner />}><Dashboard /></Suspense>,
      },
      {
        path: 'workout/:id',
        element: <Suspense fallback={<LoadingSpinner />}><ActiveWorkout /></Suspense>,
      },
      {
        path: 'history',
        element: <Suspense fallback={<LoadingSpinner />}><WorkoutHistory /></Suspense>,
      },
      {
        path: 'history/:id',
        element: <Suspense fallback={<LoadingSpinner />}><WorkoutDetail /></Suspense>,
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
```

```typescript
// packages/frontend/src/router/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

**Route Structure:**

```
/                         → Dashboard (redirects to /login if not authenticated)
/login                    → Authentication page
/workout/:id              → Active workout logging
/history                  → Workout history list
/history/:id              → Workout detail view
/exercises                → Exercise library (future)
/settings                 → User settings (future)
```

---

## 6. Offline Support Strategy

### 6.1 Initial Approach (MVP)

**Decision:** Optimistic UI + Request Queue (no Service Workers initially)

**Rationale:**
- **Balance Complexity vs. Value**: Full offline-first architecture (Service Workers + IndexedDB) adds significant complexity
- **Target User Behavior**: Most users have internet in gym (Wi-Fi or cellular)
- **Intermittent Connectivity**: Handle brief disconnections, not extended offline use
- **Progressive Enhancement**: Can add Service Workers in Phase 2 if needed

**Implementation:**

```typescript
// packages/frontend/src/api/requestQueue.ts
interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body: any;
  timestamp: number;
  retries: number;
}

class RequestQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private maxRetries = 3;

  constructor() {
    // Load queued requests from localStorage on init
    this.loadFromStorage();

    // Process queue on connectivity change
    window.addEventListener('online', () => this.processQueue());
  }

  async enqueue(url: string, method: string, body: any) {
    const request: QueuedRequest = {
      id: crypto.randomUUID(),
      url,
      method,
      body,
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(request);
    this.saveToStorage();

    // Try to process immediately
    if (navigator.onLine) {
      await this.processQueue();
    }

    return request.id;
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue[0];

      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.body),
        });

        if (response.ok) {
          // Success - remove from queue
          this.queue.shift();
          this.saveToStorage();
        } else {
          // Server error - retry with backoff
          request.retries++;
          if (request.retries >= this.maxRetries) {
            // Max retries exceeded - remove and notify user
            this.queue.shift();
            this.saveToStorage();
            this.notifyFailure(request);
          } else {
            // Wait before retry
            await this.delay(Math.pow(2, request.retries) * 1000);
          }
        }
      } catch (error) {
        // Network error - keep in queue for later
        console.error('Request failed, will retry:', error);
        break; // Stop processing, wait for online event
      }
    }

    this.isProcessing = false;
  }

  private saveToStorage() {
    localStorage.setItem('request_queue', JSON.stringify(this.queue));
  }

  private loadFromStorage() {
    const saved = localStorage.getItem('request_queue');
    if (saved) {
      this.queue = JSON.parse(saved);
    }
  }

  private notifyFailure(request: QueuedRequest) {
    // Show toast notification to user
    console.error('Failed to sync request after max retries:', request);
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const requestQueue = new RequestQueue();
```

**Optimistic UI Pattern:**

```typescript
// packages/frontend/src/hooks/useAddExercise.ts
import { useSWRConfig } from 'swr';
import { requestQueue } from '../api/requestQueue';

export function useAddExercise(workoutId: string) {
  const { mutate } = useSWRConfig();

  const addExercise = async (exerciseData: ExerciseInput) => {
    // Generate temporary ID
    const tempId = `temp_${Date.now()}`;
    const optimisticExercise = {
      id: tempId,
      ...exerciseData,
      createdAt: new Date(),
      _pending: true, // Flag for UI
    };

    // 1. Update UI immediately (optimistic)
    mutate(
      `/api/workouts/${workoutId}/exercises`,
      (current: any) => [...(current || []), optimisticExercise],
      false // Don't revalidate yet
    );

    try {
      // 2. Send request to server
      const response = await fetch(`/api/workouts/${workoutId}/exercises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exerciseData),
      });

      if (response.ok) {
        const realExercise = await response.json();
        // 3. Replace optimistic data with real data
        mutate(
          `/api/workouts/${workoutId}/exercises`,
          (current: any) => current.map((ex: any) =>
            ex.id === tempId ? realExercise : ex
          )
        );
      } else {
        throw new Error('Server error');
      }
    } catch (error) {
      if (!navigator.onLine) {
        // 4. Offline - queue request for later
        await requestQueue.enqueue(
          `/api/workouts/${workoutId}/exercises`,
          'POST',
          exerciseData
        );
        // Keep optimistic UI, show "Pending sync" indicator
      } else {
        // 5. Online but failed - rollback optimistic update
        mutate(
          `/api/workouts/${workoutId}/exercises`,
          (current: any) => current.filter((ex: any) => ex.id !== tempId)
        );
        throw error; // Show error to user
      }
    }
  };

  return { addExercise };
}
```

**UI Indicators:**

```typescript
// Show pending state in UI
{exercise._pending && (
  <Badge colorScheme="yellow">
    <Icon as={ClockIcon} mr={1} />
    Syncing...
  </Badge>
)}

// Network status indicator
<Box position="fixed" top={0} left={0} right={0} zIndex={1000}>
  {!isOnline && (
    <Alert status="warning">
      <AlertIcon />
      You're offline. Changes will sync when reconnected.
    </Alert>
  )}
</Box>
```

**Phase 2 Enhancement (Optional):**

If user testing reveals need for extended offline support:

```typescript
// Add Service Worker for offline caching
// packages/frontend/public/service-worker.js
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// Use IndexedDB for local workout storage
import { openDB } from 'idb';

const db = await openDB('fitness-tracker', 1, {
  upgrade(db) {
    db.createObjectStore('workouts', { keyPath: 'id' });
    db.createObjectStore('exercises', { keyPath: 'id' });
  },
});

// Store workouts locally, sync to server when online
await db.put('workouts', workoutData);
```

**Alternative Considered:** Full offline-first architecture from start
- **Verdict**: Premature optimization, adds 2-3 weeks of development time, target users typically have connectivity

---

## 7. Analytics Implementation

### 7.1 Analytics Strategy

**Decision:** Self-hosted analytics (PostHog or Plausible) for privacy + basic event tracking

**Rationale:**
- **Privacy-Focused**: Users care about fitness data privacy, self-hosted respects that
- **GDPR/CCPA Compliance**: Self-hosted analytics avoids third-party data sharing
- **Sufficient Features**: Track key metrics (workout count, average duration, feature usage)
- **Open Source**: PostHog is free and self-hostable
- **No Cookie Banners**: Self-hosted analytics typically doesn't require cookie consent

**Key Metrics to Track:**

| Metric | Event | Purpose |
|--------|-------|---------|
| Workout logging time | `workout_completed` with duration | Validate <30s goal |
| Feature usage | `exercise_added`, `workout_started` | Identify popular features |
| Error rates | `api_error` with endpoint | Monitor reliability |
| User retention | `user_login` | Weekly/monthly active users |
| Performance | `page_load_time` | Lighthouse score validation |

**Implementation (PostHog):**

```typescript
// packages/frontend/src/analytics/posthog.ts
import posthog from 'posthog-js';

export function initAnalytics() {
  if (import.meta.env.PROD) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: import.meta.env.VITE_POSTHOG_HOST,
      autocapture: false, // Disable automatic event capture
      capture_pageview: false, // Manual pageview tracking
      persistence: 'localStorage', // Use localStorage instead of cookies
    });
  }
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (import.meta.env.PROD) {
    posthog.capture(eventName, properties);
  } else {
    console.log('[Analytics]', eventName, properties);
  }
}

export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (import.meta.env.PROD) {
    posthog.identify(userId, traits);
  }
}
```

**Event Tracking Examples:**

```typescript
// Track workout completion time
const workoutStartTime = Date.now();

function finishWorkout() {
  const duration = Date.now() - workoutStartTime;

  trackEvent('workout_completed', {
    duration_seconds: Math.round(duration / 1000),
    exercise_count: exercises.length,
    total_sets: exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
  });
}

// Track feature usage
function addExercise(exerciseId: string, isCustom: boolean) {
  trackEvent('exercise_added', {
    exercise_id: exerciseId,
    is_custom: isCustom,
    workout_id: currentWorkout.id,
  });
}

// Track errors
function handleApiError(error: Error, endpoint: string) {
  trackEvent('api_error', {
    endpoint,
    error_message: error.message,
    status_code: error.response?.status,
  });
}
```

**Privacy Settings:**

```typescript
// Allow users to opt out
export function setAnalyticsOptOut(optOut: boolean) {
  posthog.opt_out_capturing();
  localStorage.setItem('analytics_opt_out', optOut.toString());
}
```

**Alternative Considered:** Google Analytics
- **Pros**: Industry standard, comprehensive features
- **Cons**: Privacy concerns, requires cookie consent, data shared with Google
- **Verdict**: Self-hosted better aligns with privacy-focused app

**Alternative Considered:** No analytics
- **Verdict**: Need basic metrics to validate success criteria (<30s logging, >90% Lighthouse)

---

### 7.2 Error Tracking

**Decision:** Sentry for error monitoring (optional: self-hosted or cloud)

**Rationale:**
- **Production Monitoring**: Catch errors users encounter in real-time
- **Stack Traces**: Full context for debugging
- **User Impact**: Track which errors affect most users
- **Performance Monitoring**: Transaction tracing (API latency)

**Implementation:**

```typescript
// packages/frontend/src/main.tsx
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [new BrowserTracing()],
    tracesSampleRate: 0.1, // Sample 10% of transactions
    environment: import.meta.env.MODE,
    beforeSend(event, hint) {
      // Don't send if user opted out of analytics
      const optedOut = localStorage.getItem('analytics_opt_out') === 'true';
      return optedOut ? null : event;
    },
  });
}
```

```typescript
// packages/backend/src/index.ts
import * as Sentry from '@sentry/node';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,
  });

  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.errorHandler());
}
```

**Cost Considerations:**
- Sentry free tier: 5,000 events/month
- Self-hosted Sentry: Free but requires infrastructure
- For <1000 users, free tier is sufficient

---

## 8. Security & Performance

### 8.1 Security Headers

**Decision:** Helmet.js middleware for Express security headers

**Implementation:**

```typescript
// packages/backend/src/middleware/security.ts
import helmet from 'helmet';

export const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // For React
      styleSrc: ["'self'", "'unsafe-inline'"], // For Chakra UI
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", process.env.CORS_ORIGIN],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
});
```

---

### 8.2 Input Validation

**Decision:** Zod for runtime validation (backend + frontend)

**Implementation:**

```typescript
// packages/shared/validators/workout.ts
import { z } from 'zod';

export const workoutSessionSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

export const workoutSetSchema = z.object({
  setNumber: z.number().int().positive(),
  reps: z.number().int().positive().optional(),
  weight: z.number().positive().optional(),
  weightUnit: z.enum(['lbs', 'kg', 'bodyweight']).optional(),
  duration: z.number().int().positive().optional(),
  distance: z.number().positive().optional(),
  distanceUnit: z.enum(['miles', 'km']).optional(),
});

// Backend usage
app.post('/api/workouts/:id/exercises/:exerciseId/sets', async (req, res) => {
  try {
    const validatedData = workoutSetSchema.parse(req.body);
    // ... create set
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
  }
});
```

---

### 8.3 Performance Monitoring

**Decision:** Lighthouse CI in GitHub Actions for continuous performance monitoring

**Implementation:**

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: npm ci

      - name: Build frontend
        run: npm run build --workspace=packages/frontend

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "staticDistDir": "./packages/frontend/dist",
      "url": [
        "http://localhost:5173/",
        "http://localhost:5173/login"
      ]
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.8}],
        "categories:accessibility": ["error", {"minScore": 0.9}]
      }
    }
  }
}
```

---

## 9. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)

**Backend:**
- [ ] Setup PostgreSQL + Prisma schema
- [ ] Implement authentication (Passport.js + Google OAuth)
- [ ] Session management (connect-pg-simple)
- [ ] CSRF protection
- [ ] Basic API routes (auth, workouts, exercises)

**Frontend:**
- [ ] Setup Vite + React + TypeScript
- [ ] Chakra UI theme configuration
- [ ] Zustand stores (auth)
- [ ] React Router setup
- [ ] Protected routes

**Infrastructure:**
- [ ] Development environment (.env files)
- [ ] Database migrations (Prisma)
- [ ] TypeScript project references

---

### Phase 2: Core Features (Weeks 3-5)

**Backend:**
- [ ] Workout CRUD endpoints
- [ ] Exercise library seeding (60 exercises)
- [ ] Active workout detection
- [ ] Sets/reps API

**Frontend:**
- [ ] Dashboard page
- [ ] Active workout logging screen
- [ ] Exercise selection modal
- [ ] Workout history list
- [ ] Workout detail view

**Features:**
- [ ] Start/finish workout
- [ ] Add exercises with sets
- [ ] Optimistic UI updates
- [ ] Request queue for offline

---

### Phase 3: Polish & Testing (Week 6)

- [ ] Mobile responsive testing (375px, 768px, 1024px)
- [ ] Lighthouse audit (target >90% mobile usability, >80% performance)
- [ ] Accessibility audit (WCAG AA)
- [ ] Error handling (toast notifications)
- [ ] Loading states (skeleton screens)
- [ ] Integration tests
- [ ] End-to-end tests (Playwright)

---

### Phase 4: Deployment (Week 7)

- [ ] Production environment setup (Railway/Heroku/Vercel)
- [ ] PostgreSQL production database
- [ ] Environment variables configuration
- [ ] SSL certificates
- [ ] Analytics setup (PostHog)
- [ ] Error monitoring (Sentry)
- [ ] Smoke tests in production

---

### Phase 5: Enhancements (Post-MVP)

- [ ] Personal record (PR) detection
- [ ] Workout statistics
- [ ] Service Worker for offline
- [ ] GitHub OAuth (additional provider)
- [ ] Workout templates
- [ ] Goal setting

---

## Summary of Key Decisions

| Decision Area | Choice | Key Rationale |
|---------------|--------|---------------|
| **Database** | PostgreSQL + Prisma | Production-ready, TypeScript support, ACID compliance |
| **Auth** | Passport.js + Google OAuth | Industry standard, simple Express integration |
| **Sessions** | PostgreSQL-backed | No Redis required, survives restarts |
| **Frontend State** | Zustand + SWR | Lightweight (3KB), great DX, sufficient for app |
| **CSS** | Chakra UI | 47KB bundle, accessibility, mobile-first |
| **Offline** | Optimistic UI + Queue | Balance complexity vs. reliability |
| **Rate Limiting** | express-rate-limit | Simple, in-memory sufficient for <1000 users |
| **Analytics** | PostHog (self-hosted) | Privacy-focused, GDPR compliant |
| **Error Tracking** | Sentry | Industry standard, free tier sufficient |
| **Data Model** | Separate WorkoutSet records | Granular tracking, query flexibility |
| **Active Workout** | Single per user | Simplicity, matches real usage |

---

**Document Status:** Approved for implementation
**Next Steps:** Begin Phase 1 backend implementation
**Review Date:** After MVP completion (Week 7)
