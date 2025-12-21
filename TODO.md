# Fitness Tracker - Implementation TODO

**Version:** 1.6
**Date:** 2025-12-21
**Status:** Phase 3 Complete - Workout History Implemented & PR #11 Review Issues Resolved

## Recent Completed Work

### Phase 3 - Workout History (2025-12-21)
- ✅ Complete workout history feature with WorkoutHistory and WorkoutDetail pages
- ✅ Fixed PR #11 review issues (data accuracy, React keys, accessibility, UX improvements)
- ✅ Date formatting utilities with edge case handling
- ✅ **Details:** See `FRONTEND_SESSION_NOTES.md` - Phase 3: Workout History section

### Phase 3 - Active Workout Screen (2025-12-15)
- ✅ Complete active workout logging UI with real-time timer and exercise management
- ✅ Mobile-optimized input fields, exercise search/filtering, and workout completion flow
- ✅ Fixed PR #10 review issues (orderIndex bug, duplicate API calls, accessibility)
- ✅ **Details:** See `FRONTEND_SESSION_NOTES.md` - Phase 3: Active Workout Screen section

### Phase 3 - Dashboard & Backend API (2025-12-07)
- ✅ Dashboard page with workout stats, creation flow, and navigation components
- ✅ Complete backend workout API with comprehensive Zod validation
- ✅ Fixed authentication race condition and PR #7 validation issues
- ✅ **Details:** See `FRONTEND_SESSION_NOTES.md` and `context/VALIDATION_IMPLEMENTATION_SUMMARY.md`

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
  - Created domain-separated type files (User, Exercise, WorkoutSession, WorkoutExercise, WorkoutSet)
  - All types support both strength and cardio exercises
  - **Reference:** `CLAUDE.md` Architecture section
  - **Completed:** 2025-11-25, Updated: 2025-11-29

### Database Schema & Migrations
- [x] **Create Prisma schema** [@backend-typescript-dev]
  - Complete database schema with 5 models (User, Exercise, WorkoutSession, WorkoutExercise, WorkoutSet)
  - Performance indexes for user queries and workout ordering
  - Using Prisma 5.22.0 for MVP stability
  - **Completed:** 2025-11-26

- [x] **Run initial Prisma migration** [@backend-typescript-dev]
  - Initial migration applied successfully with all tables and indexes
  - **Completed:** 2025-11-26

- [x] **Seed exercise library (60 exercises)** [@backend-typescript-dev]
  - 60 pre-defined exercises across 5 categories (Push, Pull, Legs, Core, Cardio)
  - **Reference:** `CLAUDE.md` Database Setup section
  - **Completed:** 2025-11-26

### Backend Setup
- [x] **Initialize Express server** [@backend-typescript-dev]
  - Express app with CORS, Helmet security, health check endpoint
  - **Completed:** 2025-11-27

- [x] **Set up Prisma Client** [@backend-typescript-dev]
  - PrismaClient singleton with environment-based logging
  - **Completed:** 2025-11-27

- [x] **Configure environment variables** [@backend-typescript-dev]
  - Environment config loader with validation
  - **Reference:** `CLAUDE.md` Environment Configuration section
  - **Completed:** 2025-11-27

### Frontend Setup
- [x] **Initialize Vite + React + TypeScript** [@frontend-typescript-dev]
  - Vite dev server with backend API proxy, hot reload configured
  - **Completed:** 2025-11-26

- [x] **Install and configure Chakra UI** [@frontend-typescript-dev]
  - Complete design system implementation from mockups (colors, typography, spacing, components)
  - Mobile-first defaults (44px touch targets, 16px input font size)
  - **Reference:** `CLAUDE.md` and `mockups/DESIGN-DOCUMENTATION.md`
  - **Completed:** 2025-11-26

- [x] **Set up React Router** [@frontend-typescript-dev]
  - Lazy-loaded routes for all pages (Dashboard, Auth, ActiveWorkout, WorkoutHistory, WorkoutDetail)
  - Protected route component with auth guard
  - **Reference:** `CLAUDE.md` State Management section
  - **Completed:** 2025-11-26

- [x] **Set up Zustand for state management** [@frontend-typescript-dev]
  - Auth store with user state and authentication actions
  - **Completed:** 2025-11-26

- [x] **Set up SWR for server state** [@frontend-typescript-dev]
  - API client with CSRF token management and error handling
  - SWR configuration with caching and retry logic
  - **Completed:** 2025-11-26

### TypeScript Configuration
- [x] **Configure TypeScript project references** [@backend-typescript-dev] [@frontend-typescript-dev]
  - Monorepo TypeScript project references configured with shared types
  - Build verified with code splitting and optimization
  - **Completed:** 2025-11-26

---

## Phase 2: Authentication & User Management

**Goal:** Implement secure Google OAuth authentication with session management.

### Backend Authentication
- [x] **Install authentication dependencies** [@backend-typescript-dev]
  - Passport.js, Google OAuth, express-session, PostgreSQL session store
  - **Completed:** 2025-11-29

- [x] **Configure Passport.js** [@backend-typescript-dev]
  - Google OAuth strategy with user upsert logic and session management
  - **Completed:** 2025-11-29

- [x] **Configure express-session with PostgreSQL** [@backend-typescript-dev]
  - PostgreSQL-backed sessions with 7-day expiration and security headers
  - **Completed:** 2025-11-29

- [x] **Implement CSRF protection** [@backend-typescript-dev]
  - Custom Double Submit Cookie pattern (replaced deprecated `csurf`)
  - **Reference:** `CLAUDE.md` Authentication & Security section
  - **Completed:** 2025-11-29

- [x] **Create authentication routes** [@backend-typescript-dev]
  - Google OAuth endpoints, session management, and CSRF token endpoint
  - **Completed:** 2025-11-29

- [x] **Create requireAuth middleware** [@backend-typescript-dev]
  - Authentication guard for protected routes
  - **Completed:** 2025-11-29

- [x] **Production readiness improvements** [@backend-typescript-dev]
  - Graceful shutdown handling, production error logging with sensitive field redaction
  - Code documentation and error handling improvements from PR reviews
  - **Completed:** 2025-11-29

### Frontend Authentication
- [x] **Create authentication page** [@frontend-typescript-dev]
  - Google OAuth login page per design mockups
  - **Completed:** 2025-11-29

- [x] **Implement authentication flow** [@frontend-typescript-dev]
  - Auth store with checkAuth, login, logout actions
  - **Reference:** `FRONTEND_SESSION_NOTES.md` - Phase 2: Authentication section
  - **Completed:** 2025-11-29

- [x] **Create ProtectedRoute component** [@frontend-typescript-dev]
  - Route guard with loading states and auth redirect
  - **Completed:** 2025-11-29

- [x] **Implement CSRF token handling** [@frontend-typescript-dev]
  - Client-side CSRF token management for all mutations
  - **Completed:** 2025-11-29

---

## Phase 3: Core Workout Features

**Goal:** Implement workout session creation, exercise logging, and completion.

### Backend Workout API
- [x] **Create workout routes** [@backend-typescript-dev]
  - Complete CRUD endpoints for workouts, exercises, and sets
  - Active workout detection and conflict handling
  - **Reference:** `CLAUDE.md` Workout API section
  - **Completed:** 2025-12-01

- [x] **Address PR #7 validation issues** [@backend-typescript-dev]
  - Fixed race conditions, date validation, duplicate detection, query parameter validation
  - **Reference:** `context/VALIDATION_IMPLEMENTATION_SUMMARY.md`
  - **Completed:** 2025-12-01

### User Data Segregation
- [x] **Implement userId filtering** [@backend-typescript-dev]
  - All database queries filter by `req.user.id` (security requirement)
  - **Completed:** 2025-12-01

### Backend Input Validation
- [x] **Comprehensive Zod validation** [@backend-typescript-dev]
  - Zod validation schemas for all workout endpoints (shared package)
  - Validation middleware applied to all routes
  - Fixed Zod version conflicts and deprecation warnings
  - Replaced `any` types with Prisma types and consolidated validation logic
  - **Reference:** `context/VALIDATION_IMPLEMENTATION_SUMMARY.md` for complete details
  - **Completed:** 2025-12-04, Updated: 2025-12-07

### Frontend Dashboard
- [x] **Create Dashboard page** [@frontend-typescript-dev]
  - Dashboard with stats, recent workouts, and workout creation flow
  - Active workout conflict modal and navigation components
  - **Reference:** `FRONTEND_SESSION_NOTES.md` - Phase 3: Dashboard Implementation
  - **Completed:** 2025-12-07

- [x] **Create useWorkouts hooks** [@frontend-typescript-dev]
  - SWR hooks for recent workouts and weekly stats
  - **Completed:** 2025-12-07

- [x] **Fix authentication race condition** [@frontend-typescript-dev]
  - Fixed critical auth loading state bug
  - **Reference:** `AUTH_TROUBLESHOOTING_LOG.md`
  - **Completed:** 2025-12-07

- [x] **Fix backend cookie configuration** [@backend-typescript-dev]
  - Development environment cookie fixes for localhost
  - **Completed:** 2025-12-07

### Frontend Active Workout Screen
- [x] **Complete active workout logging UI** [@frontend-typescript-dev]
  - ActiveWorkout page with real-time timer, exercise management, and set input
  - ExerciseCard, SetRow, and ExerciseSelectionModal components
  - Mobile-optimized input fields with auto-save on blur
  - Exercise search/filtering with localStorage-based recent exercises
  - Finish workout flow with toast notifications
  - **Reference:** `FRONTEND_SESSION_NOTES.md` - Phase 3: Active Workout Screen
  - **Completed:** 2025-12-15

### Frontend Workout History
- [x] **Complete workout history feature** [@frontend-typescript-dev]
  - WorkoutHistory page with monthly stats and paginated workout list
  - WorkoutDetail page with exercise/set breakdown
  - useWorkoutHistory hooks with accurate monthly stats calculation
  - Date formatting utilities with edge case handling
  - **Reference:** `FRONTEND_SESSION_NOTES.md` - Phase 3: Workout History
  - **Completed:** 2025-12-21

### Code Quality Improvements (Deferred from PR #10)
- [ ] **Refactor SetRow component** [@frontend-typescript-dev]
  - Reduce code duplication between strength and cardio rendering
  - Consider extracting shared input logic to reusable components
  - **Priority:** P2 (Medium)
  - **Reference:** PR #10 Comment 13 (SetRow.tsx)

- [ ] **Optimize useEffect dependencies in ExerciseSelectionModal** [@frontend-typescript-dev]
  - Remove unnecessary `isOpen` dependency from useEffect
  - Consider extracting filter logic to separate hooks
  - **Priority:** P2 (Medium)
  - **Reference:** PR #10 Comment 15

- [ ] **Implement TODO functionality** [@frontend-typescript-dev]
  - Replace alert() placeholders with actual functionality:
    - Edit exercise notes (ExerciseCard.tsx:84)
    - Menu button with options: Add notes, Cancel workout, Settings (ActiveWorkout.tsx:47)
  - **Priority:** P3 (Low - nice-to-have)
  - **Reference:** PR #10 Comment 8

- [ ] **Add SVG accessibility attributes** [@frontend-typescript-dev]
  - Add `aria-hidden="true"` to all decorative SVG icons
  - Ensure icons with semantic meaning have appropriate labels
  - **Priority:** P3 (Low - accessibility enhancement)
  - **Reference:** PR #10 Comment 16

---

## Phase 4: Exercise Management

**Goal:** Implement exercise library browsing and custom exercise creation.

### Backend Exercise API
- [x] **Create exercise routes (GET endpoint)** [@backend-typescript-dev] ✅ **PARTIALLY COMPLETED**
  - Created `packages/backend/src/routes/exercises.ts`
  - ✅ Implemented `GET /api/exercises` (list exercises with filters)
  - ✅ Returns library exercises (isCustom=false) + user's custom exercises
  - ✅ Ordered by category and name
  - ✅ Fixed error handling and type safety (2025-12-15)
  - ⏳ TODO: Support query params for category/search filters
  - ⏳ TODO: Implement `POST /api/exercises` (create custom exercise)
  - ⏳ TODO: Implement `PATCH /api/exercises/:id` (update custom exercise)
  - ⏳ TODO: Implement `DELETE /api/exercises/:id` (delete custom exercise)
  - **Depends on:** Authentication, requireAuth
  - **Reference:** `PROJECT_REQUIREMENTS.md` lines 870-876, `ARCHITECTURE_DECISIONS.md` lines 830-855
  - **Completed (GET only):** 2025-12-15

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
