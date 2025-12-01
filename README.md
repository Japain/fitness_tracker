# Fitness Tracker

A TypeScript-based fitness tracking application with a React frontend and Node.js backend. Mobile-first design with focus on quick workout logging (< 30 seconds per session).

## Project Structure

```
fitness_tracker/
├── packages/
│   ├── frontend/          # React + TypeScript frontend (Vite)
│   ├── backend/           # Express + TypeScript API
│   │   └── src/
│   │       └── config/
│   │           └── env.ts # Environment configuration loader
│   └── shared/            # Shared TypeScript types
├── mockups/               # UI design mockups and specifications
│   ├── html/              # Interactive HTML/CSS mockups
│   ├── screenshots/       # PNG screenshots at mobile viewport
│   ├── DESIGN-DOCUMENTATION.md  # Complete design system
│   └── README.md          # Mockup guide
├── context/               # Development guidelines
│   └── DESIGN-PRINCIPLES.md     # Visual design checklist
├── .claude/agents/        # Specialized development agents
│   ├── technical-architect.md
│   ├── frontend-typescript-dev.md
│   ├── backend-typescript-dev.md
│   ├── ux-design-researcher.md
│   └── product-requirements-manager.md
├── PROJECT_REQUIREMENTS.md       # Complete product specification
├── ARCHITECTURE_DECISIONS.md    # Technical architecture documentation
├── TODO.md                       # Implementation roadmap
├── CLAUDE.md              # AI assistant context and guidelines
├── docker-compose.yml     # PostgreSQL database container
├── .env.development       # Local development environment variables
├── .env.production        # Production environment variables
├── .env.example           # Environment variables template
├── package.json           # Root workspace configuration
└── tsconfig.json          # Root TypeScript configuration
```

## Getting Started

### Prerequisites
- Node.js v22.18.0 (managed via nvm - see `.nvmrc`)
- Docker and Docker Compose (for local PostgreSQL)
- npm or yarn

### Installation

1. **Install Node.js version**
   ```bash
   nvm use  # Uses Node.js 22.18.0 from .nvmrc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start PostgreSQL database (Docker)**
   ```bash
   docker-compose up -d
   ```

   This starts a PostgreSQL 15 container with:
   - Database: `fitness_tracker_dev`
   - Port: `5432`
   - User: `fitness_tracker`
   - Password: `dev_password_change_in_production`

4. **Run database migrations** (first time setup)
   ```bash
   cd packages/backend
   npx prisma migrate dev  # Applies the initial database schema
   npx prisma db seed      # Seeds the exercise library with 60 exercises
   ```

   This creates all database tables:
   - `User` - User accounts with Google OAuth integration
   - `Exercise` - Exercise library (60 pre-defined + custom exercises)
   - `WorkoutSession` - Workout tracking with active/completed states
   - `WorkoutExercise` - Exercise-to-workout relationships
   - `WorkoutSet` - Individual set data (reps, weight, duration, distance)

5. **Configure environment variables**

   Environment variables are managed at the root level:
   - `.env.development` - Local development (already configured for Docker PostgreSQL)
   - `.env.production` - Production deployment (configure with Railway/production DB)
   - `.env.example` - Template for new developers

   The `.env.development` file is already configured with:
   - Local Docker PostgreSQL connection
   - Development CORS settings
   - Backend/frontend URLs

   You'll need to add OAuth credentials when you reach Phase 2 (Authentication).

### Running the Application

#### Quick Start (Recommended)

Start all services together:

```bash
# 1. Start PostgreSQL database
docker-compose up -d

# 2. Start both backend and frontend
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432

#### Running Services Individually

If you prefer to run services separately for debugging:

```bash
# Terminal 1: Start PostgreSQL
docker-compose up -d

# Terminal 2: Start Backend (port 3000)
cd packages/backend
npm run dev

# Terminal 3: Start Frontend (port 5173)
cd packages/frontend
npm run dev
```

**Backend Output:**
```
🚀 Server running on port 3000 in development mode
📊 Database: localhost:5432
🌐 CORS enabled for: http://localhost:5173
🔒 Security headers enabled via Helmet
```

**Frontend Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

#### Stopping Services

```bash
# Stop backend/frontend: Ctrl+C in terminal

# Stop database
docker-compose stop

# Stop and remove database (keeps data)
docker-compose down

# Stop and remove database AND data
docker-compose down -v  # ⚠️ This deletes all data!
```

### Database Management

**Prisma commands (run from `packages/backend/`):**
```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create a new migration (after schema changes)
npx prisma migrate dev --name description_of_changes

# Apply migrations
npx prisma migrate dev

# Reset database and re-apply all migrations
npx prisma migrate reset  # ⚠️ Deletes all data!

# Seed the database
npx prisma db seed

# Open Prisma Studio (database GUI)
npx prisma studio

# Validate schema
npx prisma validate

# View migration status
npx prisma migrate status
```

**Docker PostgreSQL commands:**
```bash
# View database logs
docker-compose logs -f postgres

# Stop database
docker-compose stop

# Restart database
docker-compose start

# Remove database (keeps data)
docker-compose down

# Remove database and all data
docker-compose down -v  # ⚠️ This deletes all data!

# Access PostgreSQL CLI
docker exec -it fitness_tracker_postgres psql -U fitness_tracker -d fitness_tracker_dev
```

### Building

Build all packages:
```bash
npm run build
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite
  - **UI Library**: Chakra UI with custom theme (design tokens from mockups)
  - **Routing**: React Router v6 with lazy loading
  - **State Management**: Zustand (global auth state) + SWR (server state)
  - **API Client**: Custom fetch wrapper with CSRF token support
- **Backend**: Express, TypeScript, Node.js v22.18.0
- **Database**: PostgreSQL 15 (Docker for local, Railway for production)
- **ORM**: Prisma 5.22.0 (schema, migrations, and type-safe database client)
- **Shared**: TypeScript types and interfaces
- **Design Tools**: Playwright MCP for browser automation and mockup validation
- **Development**: npm workspaces, TypeScript project references, Docker Compose

## Project Documentation

### Key Resources

- **[PROJECT_REQUIREMENTS.md](./PROJECT_REQUIREMENTS.md)** - Complete product specification including user stories, functional requirements, and acceptance criteria
- **[ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md)** - Technical architecture, design decisions, and implementation guidelines
- **[CLAUDE.md](./CLAUDE.md)** - Context and instructions for AI-assisted development
- **[mockups/](./mockups/)** - UI design mockups and design system
  - Interactive HTML/CSS mockups for all key screens
  - Mobile viewport screenshots (375×667px)
  - Complete design system specification
- **[context/DESIGN-PRINCIPLES.md](./context/DESIGN-PRINCIPLES.md)** - Visual development checklist and guidelines

### Development Agents

This project uses specialized Claude Code agents for different aspects of development:

- **technical-architect** - Analyzes requirements, makes architectural decisions, creates technical specs
- **frontend-typescript-dev** - Implements React/TypeScript UI components and features
- **backend-typescript-dev** - Implements Express API endpoints and backend logic
- **ux-design-researcher** - Creates mockups, conducts UX research, validates designs
- **product-requirements-manager** - Manages product requirements and validates implementations

## Design Workflow

1. **Reference mockups** in `mockups/html/` for visual requirements
2. **Follow design tokens** specified in `mockups/DESIGN-DOCUMENTATION.md`
3. **Validate against** `context/DESIGN-PRINCIPLES.md` checklist
4. **Test with Playwright** to compare implementation with mockup screenshots

## Key Features

- **Mobile-first** design optimized for quick workout logging
- **Authentication** with OAuth (Google/Auth0)
- **Real-time workout tracking** with state persistence
- **Exercise library** with custom exercise support
- **Workout history** with detailed progress tracking
- **User data segregation** - complete privacy per user

## Project Status

### Completed

- ✅ **Phase 0: Environment Setup & Prerequisites** (Completed 2025-11-26)
  - Node.js v22.18.0 installed via nvm
  - npm dependencies installed across all packages
  - PostgreSQL 15 running in Docker
  - Development environment variables configured at project root

- ✅ **Phase 1: Foundation** (Completed 2025-11-27)

  **Database Foundation:**
  - Shared TypeScript types package created (`packages/shared`)
  - Prisma 5.22.0 configured (downgraded from v7 for MVP stability)
  - Complete database schema with 5 models (User, Exercise, WorkoutSession, WorkoutExercise, WorkoutSet)
  - Initial migration applied to PostgreSQL
  - Exercise library seeded with 60 exercises (Push: 21, Pull: 18, Legs: 15, Core: 2, Cardio: 4)

  **Backend Setup:**
  - Express server initialized on port 3000
  - Prisma Client singleton configured (hot-reload safe)
  - Environment configuration loader (`src/config/env.ts`)
  - CORS middleware configured for frontend (localhost:5173)
  - Helmet security middleware (comprehensive security headers)
  - Health check endpoint: `GET /api/health` (tests DB connectivity)

  **Frontend Setup:**
  - Vite + React + TypeScript configured
  - Chakra UI v2 with custom theme (design tokens from mockups)
  - React Router v6 with lazy loading and code splitting
  - Zustand for global auth state
  - SWR for server state management
  - API client with CSRF token support
  - TypeScript project references configured across all packages

- ✅ **Phase 2: Authentication & User Management** (Completed 2025-11-29)

  **Backend Authentication:**
  - Passport.js configured with Google OAuth strategy
  - PostgreSQL-backed session management (7-day expiration)
  - Custom CSRF protection using Double Submit Cookie pattern
  - Session cookies with httpOnly, secure (prod), and sameSite protections
  - requireAuth middleware for protecting routes

  **Authentication Endpoints:**
  - `GET /api/auth/google` - Initiate OAuth flow
  - `GET /api/auth/google/callback` - OAuth callback handler
  - `GET /api/auth/me` - Get current user data
  - `POST /api/auth/logout` - End session
  - `GET /api/auth/csrf-token` - Get CSRF token

  **Frontend Authentication:**
  - Authentication page built per design mockup (06-authentication.html)
  - Auth store integrated with backend endpoints
  - CSRF token handling in API client
  - ProtectedRoute component with auth checks
  - Session persistence across page refreshes

  **Security Features:**
  - User upsert logic (find or create via Google ID)
  - Automatic profile updates on login
  - Session persistence in PostgreSQL
  - CSRF protection on all mutating requests
  - Type-safe authentication with TypeScript

### Next Steps

**Phase 3: Core Workout Features**
- Implement workout session creation and management
- Build active workout screen (mockup 02-active-workout.html)
- Create exercise selection modal (mockup 03-exercise-selection.html)
- Implement workout history and detail views

For detailed implementation steps and progress tracking, see [`TODO.md`](./TODO.md).
