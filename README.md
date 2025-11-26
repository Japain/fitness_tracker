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

### Development

Run all packages in development mode:
```bash
npm run dev
```

Or run individually:
```bash
# Backend (runs on port 3000)
cd packages/backend
npm run dev

# Frontend (runs on port 5173)
cd packages/frontend
npm run dev
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
- ✅ **Phase 0**: Environment setup and prerequisites
  - Node.js v22.18.0 installed
  - npm dependencies installed
  - PostgreSQL 15 running in Docker
  - Development environment variables configured

- ✅ **Phase 1 - Database Foundation** (Completed 2025-11-26)
  - Shared TypeScript types package created
  - Prisma 5.22.0 configured (downgraded from v7 for MVP stability)
  - Complete database schema with 5 models (User, Exercise, WorkoutSession, WorkoutExercise, WorkoutSet)
  - Initial migration applied to PostgreSQL
  - Exercise library seeded with 60 exercises (Push, Pull, Legs, Core, Cardio)

1. ✅ **Complete Phase 1 Backend Setup** (see `TODO.md`)
   - Create Prisma schema and run migrations
   - Set up Express server with middleware
   - Seed exercise library (60 exercises)

### Next Steps

1. **Continue Phase 1 implementation**
   - Complete backend Express server setup
   - Complete frontend React + Vite setup
   - Configure TypeScript project references

2. **Phase 2: Authentication**
   - Configure Google OAuth credentials
   - Implement Passport.js authentication
   - Create authentication routes and middleware

3. **Phase 3+: Core features**
   - Workout tracking and logging
   - Exercise library browsing and custom exercises
   - Workout history and detail views

For detailed implementation steps and progress tracking, see `TODO.md`.
