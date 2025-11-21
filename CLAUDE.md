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
