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

4. **Configure environment variables**

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

**View database logs:**
```bash
docker-compose logs -f postgres
```

**Stop database:**
```bash
docker-compose stop
```

**Restart database:**
```bash
docker-compose start
```

**Remove database (keeps data):**
```bash
docker-compose down
```

**Remove database and all data:**
```bash
docker-compose down -v  # ⚠️ This deletes all data!
```

**Access PostgreSQL CLI:**
```bash
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

## Current Status

- ✅ **Phase 0 Complete**: Environment setup, PostgreSQL, OAuth registration
- ✅ **Phase 1 Frontend Setup Complete**:
  - React + TypeScript + Vite configured
  - Chakra UI theme system with all design tokens
  - React Router with lazy-loaded routes
  - Zustand auth store + SWR data fetching
  - API client with CSRF token management
  - TypeScript project references verified
- ⏳ **Phase 1 Backend Setup**: In Progress
  - Prisma schema and migrations
  - Express server setup
  - Backend API routes
- 🔜 **Phase 2**: Authentication (Google OAuth)
- 🔜 **Phase 3+**: Core workout features

## Next Steps

1. **Complete Phase 1 Backend Setup** (see `TODO.md`)
   - Create Prisma schema and run migrations
   - Set up Express server with middleware
   - Seed exercise library (60 exercises)

2. **Review project documentation**
   - Review `PROJECT_REQUIREMENTS.md` for functional requirements
   - Check `ARCHITECTURE_DECISIONS.md` for technical implementation
   - Browse `mockups/` for UI designs
   - Follow `TODO.md` for implementation phases

For detailed implementation steps, see `TODO.md`.
