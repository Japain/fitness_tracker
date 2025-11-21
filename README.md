# Fitness Tracker

A TypeScript-based fitness tracking application with a React frontend and Node.js backend.

## Project Structure

```
fitness_tracker/
├── packages/
│   ├── frontend/          # React + TypeScript frontend (Vite)
│   ├── backend/           # Express + TypeScript API
│   └── shared/            # Shared TypeScript types
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

- **Frontend**: React, TypeScript
- **Backend**: TypeScript, Node.js
- **Shared**: TypeScript types and interfaces

## Next Steps

1. Install dependencies: `npm install`
2. Set up database (PostgreSQL recommended)
3. Configure authentication (OAuth provider)
4. Implement API endpoints
5. Build UI components
