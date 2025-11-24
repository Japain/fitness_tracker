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
  - TypeScript with Node.js
  - Entry point: `packages/backend/src/index.ts`

- **`packages/frontend`**: React SPA with Vite (port 5173)
  - TypeScript + React + Vite
  - Entry point: `packages/frontend/src/main.tsx`
  - Vite proxy configured to forward `/api` requests to backend

### Key Design Decisions

- **Shared Types**: All data models are defined once in `packages/shared` and imported by both frontend and backend to ensure type safety across the stack
- **TypeScript References**: Packages use TypeScript project references (`tsconfig.json` includes `references` field) for proper build ordering
- **State Persistence**: Application must preserve workout state if user closes browser mid-workout
- **User Data Segregation**: Authentication required; users can only access their own data

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

## Development Commands

```bash
# Node version management
nvm use                           # Uses Node.js 22.18.0 (from .nvmrc)

# Install dependencies (run from root)
npm install

# Development (runs all packages)
npm run dev                       # Starts both frontend and backend

# Run packages individually
cd packages/backend && npm run dev    # Backend only (tsx watch)
cd packages/frontend && npm run dev   # Frontend only (Vite)

# Building
npm run build                     # Builds all packages
cd packages/backend && npm run build  # Build backend only (tsc)
cd packages/frontend && npm run build # Build frontend only (tsc + vite build)

# Other
npm run test                      # Run tests across all packages
npm run lint                      # Lint all packages
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
