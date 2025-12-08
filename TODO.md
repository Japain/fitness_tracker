# Fitness Tracker - Implementation TODO

**Version:** 1.3
**Date:** 2025-12-07
**Status:** Phase 3 Frontend Dashboard Complete - Ready for Active Workout Screen

---

## Table of Contents

1. [Phase 0: Environment Setup & Prerequisites](#phase-0-environment-setup--prerequisites)
2. [Phase 1: Foundation (Weeks 1-2)](#phase-1-foundation-weeks-1-2)
3. [Phase 2: Authentication & User Management](#phase-2-authentication--user-management)
4. [Phase 3: Core Workout Features](#phase-3-core-workout-features)
5. [Phase 4: Exercise Management](#phase-4-exercise-management)
6. [Phase 5: State Persistence & Offline Support](#phase-5-state-persistence--offline-support)
7. [Phase 6: Polish & Testing](#phase-6-polish--testing)
8. [Phase 7: Deployment & Production](#phase-7-deployment--production)
9. [Phase 8: Post-MVP Enhancements](#phase-8-post-mvp-enhancements-optional)

---

## Phase 0: Environment Setup & Prerequisites

**Goal:** Prepare development environment and external services before implementation begins.

### Database Setup
- [x] **Create PostgreSQL database** [@user]
  - Install PostgreSQL 15+ locally or use Docker
  - Create database: `fitness_tracker_dev`
  - Note connection string for .env file
  - **Reference:** `ARCHITECTURE_DECISIONS.md` Section 4.1

- [x] **Create PostgreSQL production database** [@user]
  - Set up managed PostgreSQL on Railway, Supabase, or AWS RDS
  - Note production connection string
  - Configure SSL certificate if required
  - **Depends on:** Local database setup

### OAuth Configuration
- [x] **Register Google OAuth application** [@user]
  - Create project in Google Cloud Console
  - Enable Google OAuth 2.0 API
  - Add authorized redirect URIs:
    - Development: `http://localhost:3000/api/auth/google/callback`
    - Production: `https://yourdomain.com/api/auth/google/callback`
  - Save Client ID and Client Secret
  - **Reference:** `ARCHITECTURE_DECISIONS.md` Section 1.1

### Environment Variables
- [x] **Create backend .env files** [@user]
  - Copy `packages/backend/.env.example` to `.env.development`
  - Fill in all required values:
    - `DATABASE_URL` (from PostgreSQL setup)
    - `GOOGLE_CLIENT_ID` (from OAuth setup)
    - `GOOGLE_CLIENT_SECRET` (from OAuth setup)
    - `SESSION_SECRET` (generate random 32-character string)
    - `GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback`
  - **Reference:** `ARCHITECTURE_DECISIONS.md` Section 4.3

- [x] **Create frontend .env files** [@user]
  - Copy `packages/frontend/.env.example` to `.env.development`
  - Set `VITE_API_URL=http://localhost:3000`

### Node Version
- [x] **Verify Node.js version** [@user]
  - Run `nvm use` in project root (should use Node 22.18.0 from .nvmrc)
  - Run `node --version` to confirm
  - Install dependencies: `npm install` (in project root)

---

## Phase 1: Foundation (Weeks 1-2)

**Goal:** Set up monorepo structure, TypeScript configuration, and database schema.

### Shared Types Package
- [x] **Define core data types in packages/shared** [@backend-typescript-dev]
  - Created domain-separated type files:
    - `packages/shared/types/user.ts` - User interface with preferredWeightUnit
    - `packages/shared/types/exercise.ts` - Exercise interface with `type` field ('strength' | 'cardio')
    - `packages/shared/types/workout.ts` - WorkoutSession, WorkoutExercise, WorkoutSet interfaces
    - `packages/shared/types/index.ts` - Barrel export (re-exports all types)
  - Implemented `User` interface with profilePictureUrl, preferredWeightUnit, createdAt, updatedAt
  - Implemented `Exercise` interface with required `type` field ('strength' | 'cardio')
  - Implemented `WorkoutSession` interface with userId, startTime, endTime, notes
  - Implemented `WorkoutExercise` interface (pure join entity with orderIndex)
  - Implemented `WorkoutSet` interface (separate model per `ARCHITECTURE_DECISIONS.md` Section 3.1)
    - Supports both strength fields (reps, weight) and cardio fields (duration, distance)
  - All types exported via barrel pattern for backward compatibility
  - **Priority:** P0 (blocks all other work)
  - **Reference:** `PROJECT_REQUIREMENTS.md` lines 792-835
  - **Completed:** 2025-11-25
  - **Updated:** 2025-11-29 (added preferredWeightUnit)

### Database Schema & Migrations
- [x] **Create Prisma schema** [@backend-typescript-dev]
  - Created `packages/backend/prisma/schema.prisma` with complete database schema
  - Implemented `User` model (id, googleId, email, displayName, profilePictureUrl, timestamps)
  - Implemented `Exercise` model with `isCustom`, `userId` (nullable), `category`, `type` fields
  - Implemented `WorkoutSession` model with `userId`, `startTime`, `endTime` (nullable for active workouts)
  - Implemented `WorkoutExercise` join model with `orderIndex` for exercise ordering
  - Implemented `WorkoutSet` model with nullable fields supporting both strength (reps, weight) and cardio (duration, distance)
  - Added indexes: `userId + startTime`, `userId + endTime`, `workoutSessionId + orderIndex`
  - Added `googleId` field to User shared type for OAuth integration
  - **Technical Decision:** Using Prisma 5.22.0 (downgraded from 7.x per technical-architect recommendation for MVP stability)
  - **Completed:** 2025-11-26

- [x] **Run initial Prisma migration** [@backend-typescript-dev]
  - Ran `npx prisma migrate dev --name init` successfully
  - Created migration: `packages/backend/prisma/migrations/20251126151451_init/migration.sql`
  - Generated Prisma Client at `node_modules/.prisma/client`
  - Verified all 5 tables created: User, Exercise, WorkoutSession, WorkoutExercise, WorkoutSet
  - Verified all 9 indexes created for query performance
  - Database connection to Docker PostgreSQL confirmed working
  - **Completed:** 2025-11-26

- [x] **Seed exercise library (60 exercises)** [@backend-typescript-dev]
  - Created `packages/backend/prisma/seed.ts` with comprehensive exercise library
  - Seeded 60 pre-defined exercises: Push (21), Pull (18), Legs (15), Core (2), Cardio (4)
  - All exercises marked as `isCustom: false`, `userId: null` (library exercises)
  - Configured package.json with seed script using tsx
  - Successfully ran seed: `npx prisma db seed`
  - Verified all exercises inserted into database
  - **Completed:** 2025-11-26

### Backend Setup
- [x] **Initialize Express server** [@backend-typescript-dev]
  - Created `packages/backend/src/index.ts`
  - Set up Express app on port 3000
  - Added CORS middleware (allow localhost:5173 with credentials)
  - Added body-parser middleware (Express.json())
  - Added Helmet security middleware (comprehensive security headers)
  - Created health check endpoint: `GET /api/health` (tests DB connectivity)
  - Server successfully running and verified
  - **Reference:** `ARCHITECTURE_DECISIONS.md` Section 8.1
  - **Completed:** 2025-11-27

- [x] **Set up Prisma Client** [@backend-typescript-dev]
  - Created `packages/backend/src/lib/prisma.ts`
  - Initialized PrismaClient singleton (hot-reload safe)
  - Configured environment-based logging (verbose in dev, errors in prod)
  - Exported client for use in routes
  - **Reference:** `ARCHITECTURE_DECISIONS.md` Section 4.1
  - **Completed:** 2025-11-27

- [x] **Configure environment variables** [@backend-typescript-dev]
  - Verified `packages/backend/src/config/env.ts` properly configured
  - Loads dotenv based on NODE_ENV from project root
  - Validates required env vars on startup
  - Exports typed config object
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1112-1159
  - **Completed:** 2025-11-27

### Frontend Setup
- [x] **Initialize Vite + React + TypeScript** [@frontend-typescript-dev]
  - Verified `packages/frontend/vite.config.ts` has proxy to backend port 3000
  - Created `packages/frontend/src/main.tsx` entry point with all providers (Chakra, Router, SWR)
  - Created `packages/frontend/src/App.tsx` root component with RouterProvider
  - Tested hot reload - working correctly
  - **Completed:** 2025-11-26

- [x] **Install and configure Chakra UI** [@frontend-typescript-dev]
  - Installed: `@chakra-ui/react@^2.10.9`, `@emotion/react@^11.14.0`, `@emotion/styled@^11.14.1`, `framer-motion@^10.18.0`
  - Created `packages/frontend/src/theme/index.ts` with complete design system
  - Mapped all design tokens from `mockups/DESIGN-DOCUMENTATION.md`:
    - Color palette (primary brand, 7-step neutral scale, semantic colors)
    - Typography (system font stack, type scale, font weights, line heights)
    - Spacing system (8px base unit, xs to 3xl scales)
    - Border radii, shadows, component styles
    - Mobile-first defaults (44px touch targets, 16px input font size)
  - Configured ChakraProvider in `main.tsx`
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1441-1601, `mockups/DESIGN-DOCUMENTATION.md` lines 42-154
  - **Completed:** 2025-11-26

- [x] **Set up React Router** [@frontend-typescript-dev]
  - Installed: `react-router-dom@^6.21.0` (already present)
  - Created `packages/frontend/src/router/index.tsx` with lazy loading
  - Defined routes: `/` (Dashboard), `/login` (AuthPage), `/workout/:id` (ActiveWorkout), `/history` (WorkoutHistory), `/history/:id` (WorkoutDetail)
  - Created `packages/frontend/src/components/ProtectedRoute.tsx` with auth guard
  - Implemented lazy loading for all route components using React.lazy() and Suspense
  - Created page components:
    - `packages/frontend/src/pages/Dashboard.tsx`
    - `packages/frontend/src/pages/AuthPage.tsx`
    - `packages/frontend/src/pages/ActiveWorkout.tsx`
    - `packages/frontend/src/pages/WorkoutHistory.tsx`
    - `packages/frontend/src/pages/WorkoutDetail.tsx`
  - Created `packages/frontend/src/components/AppLayout.tsx` with nav placeholders
  - Verified code splitting in build output (each page is separate chunk)
  - **Depends on:** Authentication store (stubbed for now, ready for backend integration)
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1609-1708
  - **Completed:** 2025-11-26

- [x] **Set up Zustand for state management** [@frontend-typescript-dev]
  - Installed: `zustand@^4.5.7`
  - Created `packages/frontend/src/stores/authStore.ts` with complete auth state management
  - Implemented auth state: `user`, `isAuthenticated`, `isLoading`, `error`
  - Implemented auth actions: `login()`, `logout()`, `checkAuth()`, `setLoading()`, `setError()`
  - Typed with shared `User` interface from `@fitness-tracker/shared`
  - Stubbed API calls ready for backend integration
  - Integrated with ProtectedRoute component (calls checkAuth on mount)
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1213-1253
  - **Completed:** 2025-11-26

- [x] **Set up SWR for server state** [@frontend-typescript-dev]
  - Installed: `swr@^2.3.6`
  - Created `packages/frontend/src/hooks/useActiveWorkout.ts` as example SWR hook
  - Created `packages/frontend/src/api/client.ts` with comprehensive API infrastructure:
    - CSRF token management (fetchCsrfToken, getCsrfToken)
    - Generic fetcher() function for SWR
    - Generic apiRequest() function for mutations
    - Custom ApiError class for typed error handling
    - Automatic 401 redirect to login
    - Session cookie support (credentials: 'include')
  - Created `packages/frontend/src/components/SWRProvider.tsx` with SWR configuration
  - Configured SWR defaults:
    - revalidateOnFocus: false
    - dedupingInterval: 5000ms
    - shouldRetryOnError: false
    - errorRetryCount: 3
  - Integrated CSRF token initialization in `main.tsx`
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1256-1280
  - **Completed:** 2025-11-26

### TypeScript Configuration
- [x] **Configure TypeScript project references** [@backend-typescript-dev] [@frontend-typescript-dev]
  - Verified root `tsconfig.json` has `composite: true`
  - Verified `packages/shared/tsconfig.json` extends root config properly
  - Verified `packages/frontend/tsconfig.json` has reference to `../shared`
  - Confirmed frontend can import from `@fitness-tracker/shared` (User, Exercise, WorkoutSession, WorkoutExercise types)
  - Tested build: `npm run build` ✅ - All packages build successfully with no TypeScript errors
  - Build produces optimized bundles with code splitting (total: ~477KB, 159KB gzipped)
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1301-1426
  - **Completed:** 2025-11-26

---

## Phase 2: Authentication & User Management

**Goal:** Implement secure Google OAuth authentication with session management.

### Backend Authentication
- [x] **Install authentication dependencies** [@backend-typescript-dev]
  - Installed runtime: `passport`, `passport-google-oauth20`, `express-session`, `connect-pg-simple`, `cookie-parser`
  - Installed types: `@types/passport`, `@types/passport-google-oauth20`, `@types/express-session`, `@types/cookie-parser`, `@types/connect-pg-simple`
  - **Completed:** 2025-11-29

- [x] **Configure Passport.js** [@backend-typescript-dev]
  - Created `packages/backend/src/middleware/auth.ts`
  - Configured GoogleStrategy with environment variables (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL)
  - Implemented user upsert logic (finds existing user by googleId or creates new user)
  - Sets default `preferredWeightUnit: 'lbs'` for new users
  - Configured session serialization/deserialization with user lookup
  - Updates user profile data (email, displayName, profilePictureUrl) on each login
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 64-102
  - **Completed:** 2025-11-29

- [x] **Configure express-session with PostgreSQL** [@backend-typescript-dev]
  - Created session middleware in `packages/backend/src/index.ts`
  - Using `connect-pg-simple` for PostgreSQL-backed session store
  - Session configuration:
    - 7-day expiration (604800000ms)
    - `httpOnly` cookies for XSS protection
    - `secure: true` in production (HTTPS only)
    - `sameSite: 'lax'` for CSRF protection
    - Auto-creates `session` table in PostgreSQL
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 122-146
  - **Completed:** 2025-11-29

- [x] **Implement CSRF protection** [@backend-typescript-dev]
  - **Note:** Replaced deprecated `csurf` package with custom implementation
  - Created `packages/backend/src/middleware/csrf.ts` using **Double Submit Cookie pattern**
  - Generates cryptographically secure 32-byte tokens
  - Cookie name: `_csrf` (httpOnly, sameSite, 7-day expiration)
  - Header name: `x-csrf-token` (validated on state-changing requests)
  - Exported middleware:
    - `csrfCookieParser` - Cookie parser middleware
    - `setCsrfToken` - Generates and sets CSRF cookie
    - `verifyCsrfToken` - Validates token on POST/PATCH/DELETE requests
    - `csrfProtection` - Combined middleware for convenience
  - Created endpoint: `GET /api/auth/csrf-token`
  - **Technical Decision:** Using Double Submit Cookie instead of deprecated `csurf` for modern security best practices
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 155-210
  - **Completed:** 2025-11-29

- [x] **Create authentication routes** [@backend-typescript-dev]
  - Created `packages/backend/src/routes/auth.ts`
  - Implemented endpoints:
    - `GET /api/auth/google` - Initiates OAuth flow with Google
    - `GET /api/auth/google/callback` - OAuth callback, redirects to frontend dashboard
    - `GET /api/auth/me` - Returns current user data (or 401 if not authenticated)
    - `POST /api/auth/logout` - Destroys session and clears cookies
    - `GET /api/auth/csrf-token` - Returns CSRF token for client-side requests
  - All routes properly integrated with Passport.js
  - **Reference:** `PROJECT_REQUIREMENTS.md` lines 851-854, `ARCHITECTURE_DECISIONS.md` Section 1
  - **Completed:** 2025-11-29

- [x] **Create requireAuth middleware** [@backend-typescript-dev]
  - Created `packages/backend/src/middleware/requireAuth.ts`
  - Checks `req.isAuthenticated()` via Passport
  - Returns 401 with clear error message if not authenticated
  - Validates user data exists and is properly formed
  - Includes `isAuthenticated()` type guard helper function
  - Ready to apply to protected routes (workouts, exercises, etc.)
  - **Completed:** 2025-11-29

- [x] **Add code documentation comments** [@backend-typescript-dev]
  - Added comment in `packages/backend/src/middleware/auth.ts` (lines 46-47) explaining why `preferredWeightUnit` is not updated on login (to preserve user preference)
  - Added comment in `packages/backend/src/middleware/csrf.ts` (lines 69-71) explaining CSRF is only enforced for authenticated users (all state-changing operations require auth)
  - **Priority:** P2 (code clarity improvement)
  - **Reference:** PR #4 Comments 2, 6
  - **Completed:** 2025-11-29

- [x] **Refactor user response using object destructuring** [@backend-typescript-dev]
  - Updated `GET /api/auth/me` endpoint in `packages/backend/src/routes/auth.ts` (line 65) to use object destructuring
  - Implemented: `const { googleId, ...userResponse } = user;` pattern
  - Reduces maintenance burden when User type fields change
  - **Priority:** P2 (code maintainability improvement)
  - **Reference:** PR #4 Comment B (auth.ts:61)
  - **Completed:** 2025-11-29

- [x] **Improve session destruction error handling** [@backend-typescript-dev]
  - Updated logout endpoint in `packages/backend/src/routes/auth.ts` (lines 93-101)
  - Implemented: Returns 500 error if session.destroy() fails with clear error message
  - Error response includes: "Logout succeeded but session cleanup failed. Please try again."
  - **Priority:** P2 (error handling robustness)
  - **Reference:** PR #4 Comment 7
  - **Completed:** 2025-11-29

- [x] **Implement graceful shutdown handling** [@backend-typescript-dev]
  - Added SIGTERM and SIGINT signal handlers to `packages/backend/src/index.ts` (lines 92-130)
  - Implemented Prisma disconnect on shutdown
  - Implemented HTTP server close with 10-second timeout
  - Graceful shutdown function logs all steps and exits with appropriate status codes
  - **Priority:** P1 (production readiness)
  - **Reference:** PR #3 Comment 4
  - **Completed:** 2025-11-29

- [x] **Implement production error logging** [@backend-typescript-dev]
  - Created `packages/backend/src/utils/errorLogger.ts` with complete error logging utility
  - Implemented environment-based logging (full details in dev, sanitized in prod)
  - Implemented sensitive field redaction (passwords, tokens, secrets, apiKeys, sessionIds)
  - Added logError, logInfo, and logWarning functions
  - Updated health check endpoint to use secure logging (index.ts:72)
  - Sentry integration prepared (TODO comment added for future implementation)
  - **Priority:** P1 (security hardening)
  - **Reference:** PR #3 Comment 6, `ARCHITECTURE_DECISIONS.md` lines 2073-2120
  - **Completed:** 2025-11-29

### Frontend Authentication
- [x] **Create authentication page** [@frontend-typescript-dev]
  - Created `packages/frontend/src/pages/AuthPage.tsx`
  - Implemented UI per `mockups/06-authentication.html`
  - Added "Continue with Google" button
  - Links to `GET /api/auth/google` via backend proxy
  - **Reference:** `mockups/DESIGN-DOCUMENTATION.md` lines 658-748
  - **Completed:** 2025-11-29

- [x] **Implement authentication flow** [@frontend-typescript-dev]
  - Updated `packages/frontend/src/stores/authStore.ts`
  - Implemented `checkAuth()` to call `GET /api/auth/me` on mount
  - Stores user data in Zustand on successful auth
  - Updated `logout()` to use `apiRequest()` helper for CSRF token inclusion
  - Redirect to dashboard handled by React Router
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1213-1253
  - **Completed:** 2025-11-29

- [x] **Create ProtectedRoute component** [@frontend-typescript-dev]
  - Updated `packages/frontend/src/router/ProtectedRoute.tsx`
  - Checks `isAuthenticated` from auth store
  - Shows loading spinner while `isLoading` is true
  - Redirects to `/login` if not authenticated
  - Optimized to prevent duplicate auth checks
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1676-1694
  - **Completed:** 2025-11-29

- [x] **Implement CSRF token handling** [@frontend-typescript-dev]
  - Updated `packages/frontend/src/api/client.ts`
  - Fetches CSRF token on app init from `GET /api/auth/csrf-token`
  - Includes CSRF token in all POST/PATCH/DELETE request headers as `x-csrf-token`
  - Caches token in memory for reuse
  - Generic `apiRequest()` helper automatically includes token
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 189-210
  - **Completed:** 2025-11-29

---

## Phase 3: Core Workout Features

**Goal:** Implement workout session creation, exercise logging, and completion.

### Backend Workout API
- [x] **Create workout routes** [@backend-typescript-dev] ✅ **COMPLETED**
  - Create `packages/backend/src/routes/workouts.ts`
  - Implement `POST /api/workouts` (create new workout session)
  - Implement `GET /api/workouts` (list user's workouts, paginated)
  - Implement `GET /api/workouts/:id` (get workout details with exercises/sets)
  - Implement `GET /api/workouts/active` (get in-progress workout)
  - Implement `PATCH /api/workouts/:id` (update workout, set endTime)
  - Implement `DELETE /api/workouts/:id` (delete workout)
  - **Depends on:** Authentication, requireAuth middleware
  - **Reference:** `PROJECT_REQUIREMENTS.md` lines 856-862, `ARCHITECTURE_DECISIONS.md` Section 2

- [x] **Implement active workout detection** [@backend-typescript-dev] ✅ **COMPLETED**
  - Update `GET /api/workouts/active` endpoint
  - Query: `WHERE userId = req.user.id AND endTime IS NULL`
  - Return workout with exercises/sets included
  - Return 204 No Content if no active workout
  - Add database index on (userId, endTime) WHERE endTime IS NULL
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 380-439

- [x] **Implement workout conflict detection** [@backend-typescript-dev] ✅ **COMPLETED**
  - In `POST /api/workouts`, check for existing active workout
  - Return 409 Conflict if active workout exists
  - Include `activeWorkoutId` in error response
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 316-342

- [x] **Create workout exercise routes** [@backend-typescript-dev] ✅ **COMPLETED**
  - Create `packages/backend/src/routes/workoutExercises.ts`
  - Implement `POST /api/workouts/:id/exercises` (add exercise to workout)
  - Implement `GET /api/workouts/:id/exercises` (list exercises in workout)
  - Implement `PATCH /api/workouts/:workoutId/exercises/:exerciseId` (update)
  - Implement `DELETE /api/workouts/:workoutId/exercises/:exerciseId` (remove)
  - **Reference:** `PROJECT_REQUIREMENTS.md` lines 864-869

- [x] **Create workout set routes** [@backend-typescript-dev] ✅ **COMPLETED**
  - Create `packages/backend/src/routes/workoutSets.ts`
  - Implement `POST /api/workouts/:workoutId/exercises/:exerciseId/sets` (add set)
  - Implement `PATCH /api/workouts/:workoutId/exercises/:exerciseId/sets/:setId` (update set)
  - Implement `DELETE /api/workouts/:workoutId/exercises/:exerciseId/sets/:setId` (delete set)
  - Validate strength vs. cardio fields based on exercise type
  - **Depends on:** Exercise API (to look up exercise type)
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 539-565, 656-673

- [x] **Address PR #7 critical validation issues (P0/P1)** [@backend-typescript-dev] ✅ **COMPLETED**
  - **Fixed race condition in active workout creation (P0):**
    - Prevents concurrent requests from creating duplicate active workouts
    - File: `workouts.ts:23-92`
  - **Fixed invalid date validation (P1):**
  - **Fixed duplicate setNumber/orderIndex validation (P1):**
  - **Fixed zero value validation for reps and duration (P1):**
  - **Fixed query parameter validation (P1):**
    - Added NaN handling for limit/offset parsing
    - Added negative value protection (limit: 1-100, offset: >=0)
    - Added status whitelist validation ('active', 'completed', 'all')
  - **Completed:** 2025-12-01
  - **Reference:** PR #7 review comments (24 total, 8 P0/P1 addressed, 16 P2/P3 deferred)
  - **Deferred items:** See "Backend Input Validation" section below for P2/P3 improvements

### User Data Segregation
- [x] **Implement userId filtering middleware** [@backend-typescript-dev] ✅ **COMPLETED**
  - Update all workout/exercise routes to filter by `req.user.id`
  - Add database queries with `WHERE userId = req.user.id`
  - Verify no cross-user data leakage in tests
  - **Priority:** P0 (security requirement)
  - **Reference:** `PROJECT_REQUIREMENTS.md` lines 98-115
  - **Note:** Implemented in all workout, exercise, and set routes with proper type casting

### Backend Input Validation

**Status:** ✅ **COMPLETE** - All validation work finished on 2025-12-04 (deprecation warnings fixed 2025-12-07)

**Reference:** See `context/VALIDATION_IMPLEMENTATION_SUMMARY.md` for comprehensive implementation details

- [x] **Resolve Zod version mismatch and deprecation warnings** [@backend-typescript-dev] ✅ **COMPLETED**
  - Fixed Zod version conflict between root and package dependencies
  - Removed Zod from root package.json (should only be in packages where used)
  - Added Zod 3.24.1 to backend package.json as direct dependency
  - Both backend and shared packages now use consistent Zod 3.25.76
  - Eliminated all deprecation warnings from backend dev server
  - Resolved 2 moderate security vulnerabilities
  - **Completed:** 2025-12-07
  - **Reference:** `context/VALIDATION_IMPLEMENTATION_SUMMARY.md` (Deprecation Warning Resolution section)

- [x] **Install Zod validation library** [@backend-typescript-dev] ✅ **COMPLETED**
  - Installed Zod 3.24.1 in root and shared packages
  - Created `packages/shared/validators/workout.ts` with all schemas
  - Created `packages/shared/validators/index.ts` barrel export
  - Updated `packages/shared/tsconfig.json` to include validators
  - Configured package.json exports for `@fitness-tracker/shared/validators` imports
  - **Completed:** 2025-12-04
  - **Reference:** `context/VALIDATION_IMPLEMENTATION_SUMMARY.md` lines 13-25

- [x] **Create Zod schemas for workout data** [@backend-typescript-dev] ✅ **COMPLETED**
  - Created `createWorkoutSessionSchema` and `updateWorkoutSessionSchema`
  - Created `workoutListQuerySchema` for pagination and filtering
  - Created `createWorkoutExerciseSchema` and `updateWorkoutExerciseSchema`
  - Created `createWorkoutSetSchema` and `updateWorkoutSetSchema`
  - All schemas include custom error messages and business logic refinements
  - Schemas enforce type safety, coercion, and validation constraints
  - **Completed:** 2025-12-04
  - **Reference:** `context/VALIDATION_IMPLEMENTATION_SUMMARY.md` lines 27-51, `ARCHITECTURE_DECISIONS.md` lines 2169-2200

- [x] **Apply validation to all routes** [@backend-typescript-dev] ✅ **COMPLETED**
  - Created `packages/backend/src/middleware/validateRequest.ts` middleware
  - Implemented `validateBody<T>(schema)` and `validateQuery<T>(schema)` functions
  - Applied validation to all workout routes (workouts.ts)
  - Applied validation to all exercise routes (workoutExercises.ts)
  - Applied validation to all set routes (workoutSets.ts)
  - All validation failures return 400 Bad Request with detailed Zod error messages
  - **Completed:** 2025-12-04
  - **Reference:** `context/VALIDATION_IMPLEMENTATION_SUMMARY.md` lines 53-66, 89-137

- [x] **Address deferred PR #7 code quality improvements (P2 - Medium Priority)** [@backend-typescript-dev] ✅ **COMPLETED**
  - ✅ Replaced all 5 `any` types with Prisma types:
    - `workouts.ts:126` → `Prisma.WorkoutSessionWhereInput`
    - `workouts.ts:292` → `Prisma.WorkoutSessionUpdateInput`
    - `workoutExercises.ts:230` → `Prisma.WorkoutExerciseUpdateInput`
    - `workoutSets.ts:167` → `Prisma.WorkoutSetCreateInput`
    - `workoutSets.ts:268` → `Prisma.WorkoutSetUpdateInput`
  - ✅ Implemented empty update validation at all 3 locations via Zod refinements
  - ✅ Consolidated duplicated validation logic:
    - Strength/cardio validation moved to Zod schemas with refinements
    - Workout verification extracted to `verifyWorkoutOwnership()` helper
    - Exercise verification extracted to `verifyWorkoutExerciseOwnership()` helper
  - **Completed:** 2025-12-04
  - **Reference:** `context/VALIDATION_IMPLEMENTATION_SUMMARY.md` lines 139-154, PR #7 review

- [x] **Address deferred PR #7 minor improvements (P3 - Low Priority)** [@backend-typescript-dev] ✅ **COMPLETED**
  - ✅ Type assertion verbosity: Extracted `userId` variables where beneficial
  - ✅ Database query optimization: Combined verification into helper functions
  - ✅ OrderIndex negative validation: Enforced via Zod schema `.min(0)` constraint
  - ✅ Security ID enumeration: Evaluated and deemed low risk (requires auth, user's own data)
  - **Completed:** 2025-12-04
  - **Reference:** `context/VALIDATION_IMPLEMENTATION_SUMMARY.md` lines 156-163, PR #7 review

### Frontend Dashboard
- [x] **Create Dashboard page** [@frontend-typescript-dev] ✅ **COMPLETED**
  - Created `packages/frontend/src/pages/Dashboard.tsx`
  - Implemented UI per `mockups/01-dashboard-home.html`
  - Display welcome message with user's displayName (extracts first name)
  - Show "Start New Workout" button (prominent primary CTA with icon)
  - Display this week's stats (4 stat cards: workouts, time, exercises, volume)
  - Show recent workouts (last 3 workouts with date formatting and duration)
  - Implemented "View All Workouts" link to history page
  - Added loading states (Skeleton components for stats and workouts)
  - Added empty state: "No workouts yet. Start your first workout!"
  - **Completed:** 2025-12-07
  - **Reference:** `mockups/DESIGN-DOCUMENTATION.md` lines 156-247

- [x] **Implement workout creation** [@frontend-typescript-dev] ✅ **COMPLETED**
  - Handle "Start New Workout" button click
  - Call `POST /api/workouts` with startTime = now
  - Handle 409 conflict (show modal: "Resume active workout?")
  - Navigate to `/workout/:id` on success
  - Show error toast on failure using Chakra Toast
  - Implemented active workout conflict modal with "Resume" and "Cancel" buttons
  - **Completed:** 2025-12-07
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 316-367

- [x] **Create useWorkouts hooks** [@frontend-typescript-dev] ✅ **COMPLETED**
  - Created `packages/frontend/src/hooks/useWorkouts.ts`
  - Implemented `useRecentWorkouts(limit)` - Fetches recent workouts with pagination
  - Implemented `useWeeklyStats()` - Calculates weekly stats from workouts
  - Both hooks use SWR with proper caching (5s and 10s deduplication)
  - Helper function `calculateWeeklyStats()` filters last 7 days and computes totals
  - **Note:** Exercise count and volume are placeholders (0) - require workout details from backend
  - **Future optimization:** Consider dedicated backend endpoint `GET /api/stats/weekly`
  - **Completed:** 2025-12-07

- [x] **Fix authentication race condition** [@frontend-typescript-dev] ✅ **COMPLETED**
  - Fixed critical bug: users redirected to login before auth check completed
  - Root cause: `authStore` initial state `isLoading: false` caused premature routing
  - Fix: Changed initial state to `isLoading: true` in `packages/frontend/src/stores/authStore.ts`
  - Now shows loading spinner until `checkAuth()` completes
  - Users correctly routed to Dashboard (if authenticated) or Login (if not)
  - **Completed:** 2025-12-07
  - **Priority:** P0 (blocked authentication flow)
  - **Reference:** `AUTH_TROUBLESHOOTING_LOG.md`

- [x] **Fix backend cookie configuration for development** [@backend-typescript-dev] ✅ **COMPLETED**
  - Made session and CSRF cookies `sameSite` conditional (undefined in dev, 'lax' in prod)
  - Allows cross-origin cookies between localhost:3000 and localhost:5173
  - Files updated: `packages/backend/src/index.ts`, `packages/backend/src/middleware/csrf.ts`
  - Fixed OAuth failure redirect URL to use frontend origin
  - Added debug logging to auth endpoints
  - **Completed:** 2025-12-07
  - **Reference:** `AUTH_TROUBLESHOOTING_LOG.md`

### Frontend Active Workout Screen
- [ ] **Create ActiveWorkout page** [@frontend-typescript-dev]
  - Create `packages/frontend/src/pages/ActiveWorkout.tsx`
  - Implement UI per `mockups/02-active-workout.html`
  - Display workout header with timer, back button
  - Show list of exercises with sets (table format per mockup)
  - Add fixed bottom actions: "Add Exercise" + "Finish Workout"
  - **Reference:** `mockups/DESIGN-DOCUMENTATION.md` lines 254-361

- [ ] **Implement workout timer** [@frontend-typescript-dev]
  - Calculate elapsed time from `startTime` to now
  - Display timer in MM:SS format
  - Update every second with setInterval
  - Add pulsing dot animation per mockup

- [ ] **Create ExerciseCard component** [@frontend-typescript-dev]
  - Create `packages/frontend/src/components/ExerciseCard.tsx`
  - Display exercise name, category
  - Show sets in table format (Set# | Weight | Reps | Checkbox)
  - Add "Add Another Set" button
  - Include edit/delete icons per mockup
  - **Reference:** `mockups/DESIGN-DOCUMENTATION.md` lines 291-341

- [ ] **Implement set input fields** [@frontend-typescript-dev]
  - Create number inputs for weight, reps
  - Use `inputMode="numeric"` or `"decimal"` for mobile keyboard
  - Center-align numbers per mockup
  - Add checkbox for set completion
  - Auto-save on blur or Enter key
  - **Reference:** `mockups/DESIGN-DOCUMENTATION.md` lines 310-328, `PROJECT_REQUIREMENTS.md` lines 222-242

- [ ] **Create ExerciseSelectionModal component** [@frontend-typescript-dev]
  - Create `packages/frontend/src/components/ExerciseSelectionModal.tsx`
  - Implement UI per `mockups/03-exercise-selection.html`
  - Show bottom sheet modal (slide up animation)
  - Display search input at top
  - Show recent exercises (3 items)
  - Show category pills (horizontal scroll: Push, Pull, Legs, Core, Cardio)
  - Display exercise list (filtered by search/category)
  - Add "Create Custom Exercise" button at bottom
  - **Depends on:** Exercise API
  - **Reference:** `mockups/DESIGN-DOCUMENTATION.md` lines 368-483, `PROJECT_REQUIREMENTS.md` lines 186-210

- [ ] **Implement exercise selection logic** [@frontend-typescript-dev]
  - Handle category filter (show only exercises in selected category)
  - Implement search filter (fuzzy match on exercise name)
  - Track recently used exercises in localStorage
  - Call `POST /api/workouts/:id/exercises` on selection
  - Close modal and add exercise to UI optimistically
  - **Depends on:** Backend workout exercise API

- [ ] **Implement finish workout** [@frontend-typescript-dev]
  - Handle "Finish Workout" button click
  - Call `PATCH /api/workouts/:id` with endTime = now
  - Show workout summary (duration, exercise count, total sets)
  - Navigate to workout detail view
  - Clear active workout from state
  - **Reference:** `PROJECT_REQUIREMENTS.md` lines 260-277

### Frontend Workout History
- [ ] **Create WorkoutHistory page** [@frontend-typescript-dev]
  - Create `packages/frontend/src/pages/WorkoutHistory.tsx`
  - Implement UI per `mockups/04-workout-history.html`
  - Display stats summary card (total workouts, total exercises, avg duration)
  - Show workout list in reverse chronological order
  - Implement pagination or infinite scroll (20 workouts per page)
  - Each workout card shows: date, duration, exercise count, exercise pills
  - **Depends on:** Backend workout API
  - **Reference:** `mockups/DESIGN-DOCUMENTATION.md` lines 489-572

- [ ] **Create WorkoutDetail page** [@frontend-typescript-dev]
  - Create `packages/frontend/src/pages/WorkoutDetail.tsx`
  - Implement UI per `mockups/05-workout-detail.html`
  - Display workout date, duration, total sets
  - Show each exercise with sets in table format
  - Include back button to history
  - Add menu button for future actions (duplicate, edit, delete)
  - **Depends on:** Backend workout API
  - **Reference:** `mockups/DESIGN-DOCUMENTATION.md` lines 579-654

---

## Phase 4: Exercise Management

**Goal:** Implement exercise library browsing and custom exercise creation.

### Backend Exercise API
- [ ] **Create exercise routes** [@backend-typescript-dev]
  - Create `packages/backend/src/routes/exercises.ts`
  - Implement `GET /api/exercises` (list exercises with filters)
  - Support query params: `?category=Push&search=bench&isCustom=false`
  - Return library exercises (isCustom=false) + user's custom exercises
  - Implement `POST /api/exercises` (create custom exercise)
  - Implement `PATCH /api/exercises/:id` (update custom exercise, user-owned only)
  - Implement `DELETE /api/exercises/:id` (delete custom exercise, user-owned only)
  - **Depends on:** Authentication, requireAuth
  - **Reference:** `PROJECT_REQUIREMENTS.md` lines 870-876, `ARCHITECTURE_DECISIONS.md` lines 830-855

- [ ] **Implement exercise ownership checks** [@backend-typescript-dev]
  - In PATCH/DELETE routes, verify `exercise.userId === req.user.id`
  - Return 403 Forbidden if user doesn't own custom exercise
  - Prevent editing/deleting library exercises (isCustom=false)

### Frontend Exercise Management
- [ ] **Implement custom exercise creation** [@frontend-typescript-dev]
  - Update ExerciseSelectionModal with "Create Custom Exercise" flow
  - Show inline form: exercise name, category, type (strength/cardio)
  - Call `POST /api/exercises` on submit
  - Add new exercise to active workout immediately
  - Update exercise list with new custom exercise
  - **Depends on:** Backend exercise API
  - **Reference:** `PROJECT_REQUIREMENTS.md` lines 402-428

- [ ] **Implement exercise library loading strategy** [@frontend-typescript-dev]
  - Fetch all exercises on app load (cache in memory)
  - Store in Zustand or SWR cache
  - Use cached data for instant search/filter
  - **Reference:** `PROJECT_REQUIREMENTS.md` lines 196-201

---

## Phase 5: State Persistence & Offline Support

**Goal:** Ensure workout data survives browser closure and handle intermittent connectivity.

### Frontend State Persistence
- [ ] **Implement active workout resumption** [@frontend-typescript-dev]
  - On app mount, call `GET /api/workouts/active`
  - If active workout found, show "Resume Workout?" prompt
  - Navigate to `/workout/:id` on resume
  - Store active workout ID in localStorage as backup
  - **Depends on:** Backend active workout endpoint
  - **Reference:** `PROJECT_REQUIREMENTS.md` lines 490-526

- [ ] **Create request queue for offline support** [@frontend-typescript-dev]
  - Create `packages/frontend/src/api/requestQueue.ts`
  - Implement RequestQueue class with localStorage persistence
  - Queue failed requests for retry
  - Process queue on `window.addEventListener('online')`
  - Implement exponential backoff (max 3 retries)
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1723-1832

- [ ] **Implement optimistic UI updates** [@frontend-typescript-dev]
  - Create `packages/frontend/src/hooks/useAddExercise.ts`
  - Update UI immediately with temporary ID
  - Send request to backend
  - Replace temporary data with real data on success
  - Rollback on failure (if online) or queue (if offline)
  - Show "Syncing..." badge on pending items
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1836-1905

- [ ] **Add network status indicator** [@frontend-typescript-dev]
  - Listen to `window.addEventListener('online')` / `'offline'`
  - Show alert banner when offline: "You're offline. Changes will sync when reconnected."
  - Update UI when back online
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1908-1926

### Backend Data Persistence
- [ ] **Implement abandoned workout handling** [@backend-typescript-dev]
  - Update `GET /api/workouts` to categorize workouts:
    - Active: endTime = null, startTime < 24 hours ago
    - Incomplete: endTime = null, startTime > 24 hours ago
    - Completed: endTime != null
  - Don't auto-delete abandoned workouts
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 442-487

---

## Phase 6: Polish & Testing

**Goal:** Ensure production-ready quality with comprehensive testing and accessibility.

### UI Polish
- [ ] **Implement loading states** [@frontend-typescript-dev]
  - Add skeleton screens for dashboard, history, workout detail
  - Show spinners for button actions (save, delete)
  - Disable buttons during async operations
  - **Reference:** `context/DESIGN-PRINCIPLES.md` Section IV

- [ ] **Implement error states** [@frontend-typescript-dev]
  - Create Toast notification component
  - Show error messages for failed API calls
  - Add retry buttons where appropriate
  - Display empty states for zero workouts/exercises
  - **Reference:** `mockups/DESIGN-DOCUMENTATION.md` lines 1136-1140

- [ ] **Add micro-animations** [@frontend-typescript-dev]
  - Button hover effects (translateY, shadow)
  - Modal slide-up animation (250ms ease-out)
  - Checkbox check animation
  - Card hover effects (border color, shadow)
  - Keep animations quick (150-300ms)
  - **Reference:** `mockups/DESIGN-DOCUMENTATION.md` Section IV, `context/DESIGN-PRINCIPLES.md` Section IV

- [ ] **Implement bottom navigation** [@frontend-typescript-dev]
  - Create `packages/frontend/src/components/BottomNav.tsx`
  - Add 4 navigation items: Dashboard, History, Exercises (future), Settings (future)
  - Highlight active route
  - Position sticky at bottom
  - **Reference:** `mockups/DESIGN-DOCUMENTATION.md` lines 236-246

### Accessibility Audit
- [ ] **Run axe DevTools audit** [@frontend-typescript-dev]
  - Install axe DevTools browser extension
  - Test all pages for WCAG violations
  - Fix all critical and serious issues
  - Verify color contrast ratios meet AA (4.5:1 for normal text)
  - **Reference:** `PROJECT_REQUIREMENTS.md` Section NFR-2, `mockups/DESIGN-DOCUMENTATION.md` lines 1046-1093

- [ ] **Test keyboard navigation** [@frontend-typescript-dev]
  - Tab through entire app, verify logical order
  - Ensure all interactive elements are focusable
  - Verify focus indicators are visible (3px primary-brand outline)
  - Test modal focus trap (focus stays in modal when open)
  - Add keyboard shortcuts for power users (optional)

- [ ] **Add ARIA labels** [@frontend-typescript-dev]
  - Add aria-label to icon-only buttons (edit, delete, menu)
  - Add aria-labelledby to modals
  - Add aria-live regions for toast notifications
  - Ensure form inputs have associated labels
  - **Reference:** `mockups/DESIGN-DOCUMENTATION.md` lines 1086-1094

- [ ] **Test with screen readers** [@frontend-typescript-dev] [@user]
  - Test with VoiceOver (macOS/iOS)
  - Test with TalkBack (Android) or NVDA (Windows)
  - Verify all content is announced correctly
  - Fix any screen reader issues

### Performance Testing
- [ ] **Run Lighthouse mobile audit** [@frontend-typescript-dev] [@user]
  - Test at mobile viewport (375×667px)
  - Target: >90% mobile usability, >80% performance
  - Address any critical performance issues
  - Optimize bundle size if needed (code splitting, tree shaking)
  - **Reference:** `PROJECT_REQUIREMENTS.md` Section NFR-2

- [ ] **Test on real mobile devices** [@frontend-typescript-dev] [@user]
  - Test on iPhone (iOS Safari)
  - Test on Android (Chrome Android)
  - Verify touch targets meet 44×44px minimum
  - Test form inputs trigger correct mobile keyboard
  - Verify workout logging can be completed in <30 seconds

### Backend Testing
- [ ] **Write integration tests for API endpoints** [@backend-typescript-dev]
  - Install: `npm install -D jest supertest @types/jest @types/supertest`
  - Create test database
  - Test authentication routes (Google OAuth mock)
  - Test workout CRUD operations
  - Test exercise CRUD operations
  - Test user data segregation (critical security test)
  - Verify no cross-user data leakage
  - **Priority:** P0 for data segregation tests

- [ ] **Test active workout state management** [@backend-typescript-dev]
  - Test creating workout when one already active (should return 409)
  - Test resuming active workout
  - Test finishing workout
  - Test abandoned workout detection

### End-to-End Testing
- [ ] **Write E2E tests with Playwright** [@frontend-typescript-dev] [@backend-typescript-dev]
  - Install: `npm install -D @playwright/test`
  - Test full workout flow: login → start workout → add exercise → add sets → finish
  - Test workout history viewing
  - Test custom exercise creation
  - Test browser closure and resumption
  - Run in CI/CD pipeline

### Security Testing
- [ ] **Implement rate limiting** [@backend-typescript-dev]
  - Install: `npm install express-rate-limit`
  - Apply rate limits per `ARCHITECTURE_DECISIONS.md` Section 4.2:
    - Auth endpoints: 5 requests per 15 minutes
    - Workout endpoints: 200 requests per minute (lenient for set logging)
    - Exercise endpoints: 100 requests per minute
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1009-1087

- [ ] **Add security headers with Helmet** [@backend-typescript-dev]
  - Configure Content Security Policy
  - Set HSTS headers (max-age 1 year)
  - Enable X-Frame-Options: DENY
  - **Depends on:** Helmet middleware (should already be added in Phase 1)
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 2130-2159

- [ ] **Test authentication security** [@backend-typescript-dev] [@user]
  - Verify session cookies are httpOnly, secure (in prod), sameSite
  - Test CSRF protection on state-changing endpoints
  - Verify OAuth token validation
  - Test session expiration (7 days)
  - Attempt cross-user data access (should fail with 403)

---

## Phase 7: Deployment & Production

**Goal:** Deploy application to production and configure monitoring.

### Production Database
- [ ] **Set up production PostgreSQL database** [@user]
  - Provision managed PostgreSQL (Railway, Supabase, or AWS RDS)
  - Note production connection string
  - Configure SSL/TLS connection
  - **Depends on:** Phase 0 database setup

- [ ] **Run production migrations** [@backend-typescript-dev] [@user]
  - Set `DATABASE_URL` env var to production database
  - Run: `npx prisma migrate deploy`
  - Run seed script: `npx prisma db seed`
  - Verify all tables and indexes created

### Backend Deployment
- [ ] **Choose hosting platform** [@user]
  - Options: Railway, Heroku, Vercel (serverless), AWS EC2/ECS
  - Set up account and project
  - Note deployment URL

- [ ] **Configure production environment variables** [@user]
  - Set all required env vars in hosting platform:
    - `NODE_ENV=production`
    - `DATABASE_URL` (production)
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
    - `SESSION_SECRET` (new random string for production)
    - `GOOGLE_CALLBACK_URL` (production domain)
    - `CORS_ORIGIN` (production frontend domain)
    - `PORT` (if required by platform)

- [ ] **Deploy backend** [@backend-typescript-dev] [@user]
  - Build backend: `npm run build --workspace=packages/backend`
  - Deploy to chosen platform
  - Verify health check endpoint: `GET /api/health`
  - Test authentication flow

### Frontend Deployment
- [ ] **Choose hosting platform** [@user]
  - Options: Vercel, Netlify, AWS S3+CloudFront
  - Set up account and project

- [ ] **Configure production environment variables** [@user]
  - Set `VITE_API_URL` to production backend URL
  - Set other frontend env vars if needed

- [ ] **Build and deploy frontend** [@frontend-typescript-dev] [@user]
  - Build frontend: `npm run build --workspace=packages/frontend`
  - Deploy to chosen platform
  - Verify site loads at production domain

### SSL/HTTPS Configuration
- [ ] **Configure SSL certificates** [@user]
  - If using Vercel/Netlify: Automatic (done)
  - If using custom domain: Obtain SSL cert (Let's Encrypt or platform-provided)
  - Ensure both frontend and backend use HTTPS
  - Update OAuth redirect URIs to use https://

### Post-Deployment Testing
- [ ] **Smoke test production deployment** [@frontend-typescript-dev] [@backend-typescript-dev] [@user]
  - Test authentication flow (Google OAuth)
  - Create a test workout
  - Add exercises and sets
  - Finish workout
  - View workout history
  - Test on mobile device
  - Verify all API calls succeed

- [ ] **Monitor error logs** [@backend-typescript-dev] [@user]
  - Check backend logs for errors
  - Check frontend console for errors
  - Verify no authentication failures
  - Check database connection

### Monitoring & Analytics
- [ ] **Set up error tracking with Sentry** [@backend-typescript-dev] [@frontend-typescript-dev] [@user]
  - Create Sentry account (free tier)
  - Install: `npm install @sentry/react @sentry/node`
  - Configure Sentry DSN in frontend and backend
  - Test error reporting
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 2073-2120

- [ ] **Set up analytics with PostHog** [@frontend-typescript-dev] [@user]
  - Set up self-hosted PostHog or use cloud (optional)
  - Install: `npm install posthog-js`
  - Configure PostHog in frontend
  - Track key events: workout_started, workout_completed, exercise_added
  - Implement opt-out for users
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1963-2070

- [ ] **Configure Lighthouse CI** [@frontend-typescript-dev]
  - Create `.github/workflows/lighthouse.yml`
  - Configure Lighthouse CI to run on PRs
  - Set assertions: performance >80%, accessibility >90%
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 2205-2258

---

## Phase 8: Post-MVP Enhancements (Optional)

**Goal:** Add stretch goal features after MVP is stable and deployed.

### Personal Records (PRs)
- [ ] **Implement PR detection** [@backend-typescript-dev]
  - Create algorithm to find max weight for each exercise
  - Add `GET /api/exercises/:id/pr` endpoint
  - Return best set (highest weight) for user
  - **Reference:** `PROJECT_REQUIREMENTS.md` Phase 2 Enhancements

- [ ] **Display PRs in UI** [@frontend-typescript-dev]
  - Highlight PR sets in workout detail view (gold badge)
  - Show PR history on dashboard
  - Show PR notification when new PR achieved

### Workout Statistics
- [ ] **Create statistics endpoints** [@backend-typescript-dev]
  - Add `GET /api/stats/summary` (total workouts, exercises, volume)
  - Add `GET /api/stats/trends` (workouts per week/month)
  - Calculate total volume (sum of weight × reps × sets)

- [ ] **Create statistics dashboard page** [@frontend-typescript-dev]
  - Display weekly/monthly workout trends (charts)
  - Show most frequent exercises
  - Display total volume lifted
  - Show workout consistency (streak)

### Workout Templates
- [ ] **Implement workout templates** [@backend-typescript-dev]
  - Add `WorkoutTemplate` table in Prisma schema
  - Add endpoints: `POST /api/templates`, `GET /api/templates`, `DELETE /api/templates/:id`
  - Allow creating template from existing workout

- [ ] **Add template UI** [@frontend-typescript-dev]
  - Add "Save as Template" option to workout detail
  - Show template library on dashboard
  - Add "Start from Template" option

### Service Worker for Extended Offline
- [ ] **Implement Service Worker** [@frontend-typescript-dev]
  - Create `packages/frontend/public/service-worker.js`
  - Cache static assets (HTML, CSS, JS)
  - Implement offline page fallback
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1934-1942

- [ ] **Use IndexedDB for local storage** [@frontend-typescript-dev]
  - Install: `npm install idb`
  - Store workouts locally in IndexedDB
  - Sync to backend when online
  - **Reference:** `ARCHITECTURE_DECISIONS.md` lines 1944-1956

### Additional OAuth Providers
- [ ] **Add GitHub OAuth** [@backend-typescript-dev] [@user]
  - Register OAuth app in GitHub
  - Install: `npm install passport-github2`
  - Configure GitHub strategy in Passport
  - Add `GET /api/auth/github` route
  - Update authentication page with GitHub button

### Data Export
- [ ] **Implement CSV export** [@backend-typescript-dev]
  - Add `GET /api/workouts/export?format=csv` endpoint
  - Generate CSV with all workout data
  - Return as downloadable file

- [ ] **Implement JSON export** [@backend-typescript-dev]
  - Add `GET /api/workouts/export?format=json` endpoint
  - Return all workouts in JSON format

---

## Quick Reference

### Priority Levels
- **P0 (Critical):** Must be completed before launch; blocks other work
- **P1 (High):** Essential for MVP; should be completed before nice-to-haves
- **P2 (Medium):** Nice-to-have; can be deferred to post-MVP

### Agent Assignments
- **@backend-typescript-dev:** All backend/API/database tasks
- **@frontend-typescript-dev:** All frontend/UI/React tasks
- **@user:** Environment setup, OAuth registration, deployment configuration

### Key Documentation References
- **PROJECT_REQUIREMENTS.md:** Functional requirements, user stories, acceptance criteria
- **ARCHITECTURE_DECISIONS.md:** Technical decisions, implementation patterns, code examples
- **mockups/DESIGN-DOCUMENTATION.md:** UI specifications, design system, component details
- **context/DESIGN-PRINCIPLES.md:** Design philosophy, accessibility checklist
- **CLAUDE.md:** Project overview, commands, architecture summary

### Estimated Timeline
- **Phase 0:** 1 day (user setup)
- **Phase 1:** 1-2 weeks (foundation)
- **Phase 2:** 1 week (authentication)
- **Phase 3:** 2 weeks (core workout features)
- **Phase 4:** 1 week (exercise management)
- **Phase 5:** 1 week (state persistence)
- **Phase 6:** 1 week (polish & testing)
- **Phase 7:** 3-5 days (deployment)
- **Total MVP:** ~6-7 weeks

---

**Document Status:** Ready for Implementation
**Next Action:** Begin Phase 0 - Environment Setup
**Questions?** Refer to PROJECT_REQUIREMENTS.md or ARCHITECTURE_DECISIONS.md for technical details.
