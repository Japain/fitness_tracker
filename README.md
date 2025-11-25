# Fitness Tracker

A TypeScript-based fitness tracking application with a React frontend and Node.js backend. Mobile-first design with focus on quick workout logging (< 30 seconds per session).

## Project Structure

```
fitness_tracker/
├── packages/
│   ├── frontend/          # React + TypeScript frontend (Vite)
│   ├── backend/           # Express + TypeScript API
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
├── CLAUDE.md              # AI assistant context and guidelines
├── package.json           # Root workspace configuration
└── tsconfig.json          # Root TypeScript configuration
```

## Getting Started

### Prerequisites
- Node.js (v22 or higher)
- npm or yarn

### Installation

```bash
npm install
```

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

### Building

Build all packages:
```bash
npm run build
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Express, TypeScript, Node.js (v22)
- **Shared**: TypeScript types and interfaces
- **Design Tools**: Playwright MCP for browser automation and mockup validation
- **Development**: npm workspaces, TypeScript project references

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

## Next Steps

1. Install dependencies: `npm install`
2. Review project requirements: `PROJECT_REQUIREMENTS.md`
3. Check design mockups: `mockups/`
4. Set up database (PostgreSQL recommended)
5. Configure authentication (OAuth provider)
6. Implement features following architecture documentation
