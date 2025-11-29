# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web-based fitness tracking application built with TypeScript (frontend + backend). The app enables users to log workouts, track progress, and review historical exercise data. Designed for mobile-first experience with a focus on ease of input (< 30 second workout logging).

## Architecture

This is a **monorepo** using npm workspaces with three packages:

- **`packages/shared`**: TypeScript type definitions shared between frontend and backend
  - Core data models: `User`, `Exercise`, `WorkoutSession`, `WorkoutExercise`
  - Located in `packages/shared/types/index.ts`

- **`packages/backend`**: Express API server (port 3000)
  - TypeScript with Node.js v22.18.0
  - Entry point: `packages/backend/src/index.ts`
  - Configuration: `packages/backend/src/config/env.ts` (loads root `.env` files)
  - Database: Prisma 5.22.0 ORM with PostgreSQL 15
  - Schema: `packages/backend/prisma/schema.prisma` (5 models: User, Exercise, WorkoutSession, WorkoutExercise, WorkoutSet)

- **`packages/frontend`**: React SPA with Vite (port 5173)
  - TypeScript + React + Vite
  - Entry point: `packages/frontend/src/main.tsx`
  - Vite proxy configured to forward `/api` requests to backend
  - **UI Library**: Chakra UI v2 with custom theme at `src/theme/index.ts`
  - **Routing**: React Router v6 with lazy loading (`src/router/index.tsx`)
  - **State Management**:
    - Zustand for global auth state (`src/stores/authStore.ts`)
    - SWR for server state caching and revalidation
  - **API Client**: `src/api/client.ts` with CSRF token management and session cookies

### Infrastructure
- **Docker Compose**: Local PostgreSQL 15 database (`docker-compose.yml`)
- **Environment Files**: Root-level `.env.development` and `.env.production`
- **Database**: PostgreSQL 15 (Docker locally, Railway for production)
- **ORM**: Prisma 5.22.0 (type-safe database client, migrations, schema management)
  - Schema location: `packages/backend/prisma/schema.prisma`
  - Migrations: `packages/backend/prisma/migrations/`
  - Seed script: `packages/backend/prisma/seed.ts`
  - **Technical Decision**: Using Prisma 5.22.0 (not v7) for MVP stability and documentation consistency

### Key Design Decisions

- **Shared Types**: All data models are defined once in `packages/shared` and imported by both frontend and backend to ensure type safety across the stack
- **TypeScript References**: Packages use TypeScript project references (`tsconfig.json` includes `references` field) for proper build ordering
- **Design System**: Chakra UI theme implements all design tokens from `mockups/DESIGN-DOCUMENTATION.md` (colors, typography, spacing, components)
- **State Architecture**:
  - Zustand for global client state (authentication, user session)
  - SWR for server state (automatic caching, revalidation, deduplication)
  - Local component state for UI-only concerns
- **Code Splitting**: React Router lazy loading splits each page into separate chunks for optimal performance
- **Security**: CSRF token fetched on app init and included in all mutating requests
- **State Persistence**: Application must preserve workout state if user closes browser mid-workout
- **User Data Segregation**: Authentication required; users can only access their own data

### Authentication & Security

**Authentication System (Phase 2 - Completed):**
- **OAuth Provider**: Google OAuth 2.0 via Passport.js
- **Session Management**: PostgreSQL-backed sessions using `connect-pg-simple`
- **Session Duration**: 7 days (604800000ms)
- **CSRF Protection**: Custom Double Submit Cookie pattern (replaced deprecated `csurf`)

**Backend Authentication Files:**
- `packages/backend/src/middleware/auth.ts` - Passport.js configuration with GoogleStrategy
- `packages/backend/src/middleware/csrf.ts` - CSRF token generation and validation
- `packages/backend/src/middleware/requireAuth.ts` - Authentication guard for protected routes
- `packages/backend/src/routes/auth.ts` - Authentication endpoints

**Authentication Endpoints:**
- `GET /api/auth/google` - Initiates OAuth flow with Google
- `GET /api/auth/google/callback` - OAuth callback handler (redirects to frontend)
- `GET /api/auth/me` - Returns current authenticated user (or 401)
- `POST /api/auth/logout` - Destroys session and clears cookies
- `GET /api/auth/csrf-token` - Returns CSRF token for state-changing requests

**Session Cookies:**
- `httpOnly: true` - Prevents XSS attacks
- `secure: true` (production only) - HTTPS only
- `sameSite: 'lax'` - CSRF protection
- Stored in PostgreSQL `session` table (auto-created)

**CSRF Tokens:**
- Cookie name: `_csrf` (httpOnly, 7-day expiration)
- Header name: `x-csrf-token` (required for POST/PATCH/DELETE)
- Uses cryptographically secure 32-byte tokens

**User Authentication Flow:**
1. User clicks "Continue with Google" → redirects to `GET /api/auth/google`
2. Google OAuth consent screen
3. Callback to `GET /api/auth/google/callback`
4. User upsert: find existing user by `googleId` or create new user
5. Session created in PostgreSQL with 7-day expiration
6. Redirect to frontend dashboard with session cookie
7. Frontend calls `GET /api/auth/me` to get user data
8. All subsequent requests include session cookie automatically

**Protected Routes Pattern:**
```typescript
import { requireAuth } from '../middleware/requireAuth';

router.get('/api/workouts', requireAuth, async (req, res) => {
  // req.user is guaranteed to exist and be typed
  const workouts = await prisma.workoutSession.findMany({
    where: { userId: req.user.id } // ALWAYS filter by userId
  });
  res.json(workouts);
});
```

**Testing Backend Authentication:**

*Health Check (no auth required):*
```bash
curl http://localhost:3000/api/health
# Expected: {"status": "ok", "database": "connected", "timestamp": "..."}
```

*Get CSRF Token (no auth required):*
```bash
curl -c cookies.txt http://localhost:3000/api/auth/csrf-token
# Expected: {"csrfToken": "abc123..."}
# Note: CSRF cookie is also set in the response
```

*Check Current User (unauthenticated):*
```bash
curl -b cookies.txt http://localhost:3000/api/auth/me
# Expected: {"message": "Not authenticated"}
```

*Google OAuth Flow (use browser):*
1. Navigate to: `http://localhost:3000/api/auth/google`
2. Complete Google OAuth flow
3. Redirected to frontend with session cookie set
4. Session persists for 7 days

*Check Current User (authenticated):*
After completing OAuth in browser:
```bash
curl -b cookies.txt http://localhost:3000/api/auth/me
# Expected: {"id": "...", "email": "...", "displayName": "...", "preferredWeightUnit": "lb", ...}
```

*Logout:*
```bash
curl -X POST -b cookies.txt http://localhost:3000/api/auth/logout
# Expected: {"message": "Logged out successfully"}
```

*View Active Sessions:*
Sessions are stored in PostgreSQL `session` table (auto-created by connect-pg-simple):
```bash
docker exec -it fitness_tracker_postgres psql -U fitness_tracker -d fitness_tracker_dev -c "SELECT * FROM session;"
```

Session details:
- Expire after 7 days of inactivity
- Stored with httpOnly cookies
- secure flag enabled in production
- sameSite: 'lax' for CSRF protection

### Visual Development
- Comprehensive design checklist in `context/DESIGN-PRINCIPLES.md`
- When making visual (front-end, UI,UX) changes, always refer to that file for guidance.

### Design Mockups
The `mockups/` folder contains approved UI designs for implementation:

- **`mockups/html/`**: Interactive HTML/CSS mockups for all key screens
  - 01-dashboard-home.html - Dashboard/Home screen
  - 02-active-workout.html - Active workout logging screen
  - 03-exercise-selection.html - Exercise selection modal
  - 04-workout-history.html - Workout history list
  - 05-workout-detail.html - Workout detail view
  - 06-authentication.html - Authentication/login screen

- **`mockups/screenshots/`**: PNG screenshots of mockups at mobile viewport (375×667px)

- **`mockups/DESIGN-DOCUMENTATION.md`**: Complete design system specification
  - Design tokens (colors, typography, spacing)
  - Component library specifications
  - Accessibility requirements
  - Implementation guidelines

- **`mockups/README.md`**: Quick reference guide

**When implementing features:**
1. Always reference the corresponding mockup for visual requirements
2. Use the design tokens specified in DESIGN-DOCUMENTATION.md
3. Validate implementation against the mockup screenshots
4. Ensure accessibility requirements from the mockups are met

## Available Tools

### Playwright MCP (Browser Automation)
This project has Playwright configured as an MCP (Model Context Protocol) server, providing browser automation capabilities:

**Use cases:**
- **Design mockup creation**: The `ux-design-researcher` agent uses Playwright to create, iterate on, and validate HTML/CSS mockups
- **Visual testing**: Take screenshots at different viewport sizes to verify responsive design
- **Accessibility testing**: Check accessibility tree snapshots and validate WCAG compliance
- **UI validation**: Compare implemented features against approved design mockups

**Available through MCP tools:**
- `mcp__playwright__browser_navigate` - Open local HTML files or URLs
- `mcp__playwright__browser_resize` - Test at mobile (375×667px), tablet, and desktop viewports
- `mcp__playwright__browser_take_screenshot` - Capture full page or specific elements
- `mcp__playwright__browser_snapshot` - Get accessibility tree for WCAG validation
- `mcp__playwright__browser_click`, `mcp__playwright__browser_type` - Simulate user interactions
- `mcp__playwright__browser_evaluate` - Run JavaScript in the browser context

**Workflow:**
- Design mockups are created as HTML files in `mockups/html/`
- Screenshots are saved to `mockups/screenshots/`
- All designs must be validated against `context/DESIGN-PRINCIPLES.md` through iterative Playwright testing

## Environment Configuration

### Environment Variables
All environment variables are managed at the **project root** (not in individual packages):

- **`.env.development`** - Local development configuration
  - Uses Docker PostgreSQL at `localhost:5432`
  - Backend runs on port 3000, frontend on port 5173
  - Already configured with development database connection

- **`.env.production`** - Production deployment configuration
  - Uses Railway PostgreSQL (cloud-hosted)
  - Requires production OAuth callback URLs
  - Must generate new session secret for production

- **`.env.example`** - Template for documentation

**Configuration loader:** `packages/backend/src/config/env.ts`
- Automatically loads correct `.env` file based on `NODE_ENV`
- Validates required environment variables on startup
- Provides typed configuration object throughout backend

**Required environment variables:**
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)
- `GOOGLE_CLIENT_ID` - OAuth client ID (Phase 2+)
- `GOOGLE_CLIENT_SECRET` - OAuth client secret (Phase 2+)
- `SESSION_SECRET` - Session encryption key (Phase 2+)
- `CORS_ORIGIN` - Allowed frontend origin
- `VITE_API_URL` - Backend API URL (frontend)

### Database Setup

**Database Schema (Prisma 5.22.0):**

The database schema is complete with 5 models:

1. **User** - User accounts with Google OAuth integration
   - Fields: `id`, `googleId`, `email`, `displayName`, `profilePictureUrl`, `preferredWeightUnit`, timestamps
   - Indexes: `email`, `googleId`

2. **Exercise** - Exercise library (60 pre-defined + custom exercises)
   - Fields: `id`, `name`, `category` (Push/Pull/Legs/Core/Cardio), `type` (strength/cardio), `isCustom`, `userId` (nullable)
   - Library exercises: `isCustom = false`, `userId = null`
   - Custom exercises: `isCustom = true`, `userId` set to owner

3. **WorkoutSession** - Workout tracking with active/completed states
   - Fields: `id`, `userId`, `startTime`, `endTime` (nullable for active workouts), `notes`, timestamps
   - Key indexes: `userId + startTime`, `userId + endTime`
   - Active workout query: `WHERE userId = ? AND endTime IS NULL`

4. **WorkoutExercise** - Exercise-to-workout relationships (join table)
   - Fields: `id`, `workoutSessionId`, `exerciseId`, `orderIndex`, `notes`, timestamp
   - Index: `workoutSessionId + orderIndex` (for exercise ordering)

5. **WorkoutSet** - Individual set data (granular tracking)
   - Fields: `id`, `workoutExerciseId`, `setNumber`, `reps`, `weight`, `weightUnit`, `duration`, `distance`, `distanceUnit`, `completed`, timestamp
   - Supports both strength (reps, weight) and cardio (duration, distance) exercises
   - Index: `workoutExerciseId + setNumber`

**Exercise Library:**
- 60 pre-seeded exercises across 5 categories
- Categories: Push (21), Pull (18), Legs (15), Core (2), Cardio (4)
- Includes compound lifts, isolation exercises, bodyweight movements, and cardio options

**Local Development (Docker):**
```bash
# Start PostgreSQL container
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f postgres

# Stop database
docker-compose stop

# Access PostgreSQL CLI
docker exec -it fitness_tracker_postgres psql -U fitness_tracker -d fitness_tracker_dev
```

**Prisma Commands (run from `packages/backend/`):**
```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name description_of_changes

# Seed the exercise library
npx prisma db seed

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

**Local database credentials:**
- Host: `localhost`
- Port: `5432`
- Database: `fitness_tracker_dev`
- User: `fitness_tracker`
- Password: `dev_password_change_in_production`
- Connection string: `postgresql://fitness_tracker:dev_password_change_in_production@localhost:5432/fitness_tracker_dev`

**Production Database (Railway):**
- Managed PostgreSQL 15+ instance
- Connection string stored in `.env.production`
- SSL/TLS enabled by default

## Development Commands

```bash
# Node version management
nvm use                           # Uses Node.js 22.18.0 (from .nvmrc)

# Install dependencies (run from root)
npm install

# Start database (first time setup)
docker-compose up -d              # Start PostgreSQL in Docker

# Development (runs all packages)
npm run dev                       # Starts both frontend and backend

# Run packages individually
cd packages/backend && npm run dev    # Backend only (tsx watch)
cd packages/frontend && npm run dev   # Frontend only (Vite)

# Building
npm run build                     # Builds all packages
cd packages/backend && npm run build  # Build backend only (tsc)
cd packages/frontend && npm run build # Build frontend only (tsc + vite build)

# Database management (Docker)
docker-compose down               # Stop and remove containers (keeps data)
docker-compose down -v            # Stop and remove containers + data

# Prisma commands (from packages/backend)
npx prisma generate               # Generate Prisma Client
npx prisma migrate dev            # Create and apply migrations
npx prisma db seed                # Seed exercise library
npx prisma studio                 # Open database GUI

# Other
npm run test                      # Run tests across all packages
npm run lint                      # Lint all packages
```

## Database Usage Patterns

### Prisma Client Usage

Import and use Prisma Client in your backend code:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Example: Get all exercises for user (library + custom)
const exercises = await prisma.exercise.findMany({
  where: {
    OR: [
      { isCustom: false },           // Library exercises
      { userId: req.user.id }        // User's custom exercises
    ]
  },
  orderBy: { name: 'asc' }
});

// Example: Get active workout for user
const activeWorkout = await prisma.workoutSession.findFirst({
  where: {
    userId: req.user.id,
    endTime: null                     // Active = no end time
  },
  include: {
    exercises: {
      include: {
        exercise: true,
        sets: true
      },
      orderBy: { orderIndex: 'asc' }
    }
  }
});
```

### Critical Security Pattern

**ALL database queries MUST filter by `userId`** to ensure user data segregation:

```typescript
// ✅ CORRECT - Filters by userId
const workouts = await prisma.workoutSession.findMany({
  where: { userId: req.user.id }
});

// ❌ WRONG - No userId filter (security vulnerability!)
const workouts = await prisma.workoutSession.findMany();
```

### Active Workout Detection

Query for active workouts using `endTime: null`:

```typescript
const activeWorkout = await prisma.workoutSession.findFirst({
  where: {
    userId: req.user.id,
    endTime: null
  }
});
```

## Important Requirements

### Mobile Optimization
- Must score >90% on Lighthouse mobile usability
- Responsive design is critical
- Input forms optimized for mobile screens

### Authentication
- External OAuth provider required (Google Auth, Auth0, etc.)
- User data must be completely segregated by userId

### Data Persistence
- Workouts must be retrievable with 100% accuracy
- In-progress workouts should survive browser closure

### Core User Flow
- Start "New Workout" session (defaults to current date/time)
- Add exercises progressively during workout (live logging)
- Support both pre-defined exercise library and custom exercises
- View workout history by date/time

## Out of Scope
- Social features (friends, sharing, leaderboards)
- Nutrition logging and meal tracking
- Native mobile apps (iOS/Android)
