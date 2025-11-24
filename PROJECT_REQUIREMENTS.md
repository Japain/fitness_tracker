# Fitness Tracking App - Product Requirements Document

**Version:** 2.0
**Last Updated:** 2025-11-21
**Status:** Active Development

---

## Table of Contents
1. [Project Summary](#project-summary)
2. [Goals & Success Criteria](#goals--success-criteria)
3. [Functional Requirements](#functional-requirements)
4. [Non-Functional Requirements](#non-functional-requirements)
5. [User Flows](#user-flows)
6. [Technical Constraints](#technical-constraints)
7. [Data Model](#data-model)
8. [Out of Scope](#out-of-scope)
9. [Open Questions & Investigation Areas](#open-questions--investigation-areas)

---

## Project Summary

A web-based fitness tracking application built with TypeScript (frontend + backend). The app enables users to log workouts, track progress, and review historical exercise data. Designed for **mobile-first experience** with a focus on **rapid workout logging** (< 30 seconds from start to completion).

**Target Users:** Individual fitness enthusiasts who want a simple, fast way to log workouts without social features or complex nutrition tracking.

**Audience Size:** Less than 1000 users initially and not expected to grow much.

**Key Differentiators:**
- Sub-30 second workout logging workflow
- Mobile-optimized interface with touch-first interactions
- Persistent state for in-progress workouts (survives browser closure)
- Privacy-focused (user data completely segregated, no social sharing)

---

## Goals & Success Criteria

### Primary Goals
1. **Rapid Input**: Enable users to log a complete workout in < 30 seconds
2. **Mobile Excellence**: Achieve >90% Lighthouse mobile usability score
3. **Data Reliability**: Ensure 100% accuracy in workout data retrieval
4. **User Privacy**: Complete data segregation with secure authentication

### Success Metrics
| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Workout logging time | < 30 seconds | User testing + analytics |
| Lighthouse mobile score | > 90% | Automated testing |
| Data retrieval accuracy | 100% | Integration tests |
| Authentication security | Zero unauthorized access | Security audit + testing |
| State persistence | 100% recovery rate | Browser closure tests |

---

## Functional Requirements

### FR-1: User Authentication & Authorization

#### FR-1.1: OAuth Integration
**User Story:** As a user, I want to sign in with my Google account so that I can access my workouts securely without creating another password.

**Acceptance Criteria:**
- MUST: Support Google OAuth 2.0 authentication
- MUST: Create user record on first successful authentication
- MUST: Generate and maintain secure session tokens
- MUST: Redirect users to workout dashboard after successful login
- SHOULD: Display user's profile picture and name from OAuth provider
- MAY: Support additional OAuth providers (GitHub, Auth0)

**Technical Constraints:**
- Use packages/shared types for User model
- Backend MUST validate OAuth tokens on all API requests
- Session tokens MUST expire after configurable period (default: 7 days)
- MUST NOT store OAuth provider passwords or tokens beyond session lifetime

**Mobile Considerations:**
- OAuth consent screen MUST be mobile-responsive
- Sign-in button MUST be minimum 44x44px touch target
- Handle mobile browser popup blockers gracefully

**Success Metrics:**
- 100% of authenticated requests properly validated
- Zero unauthorized data access incidents
- < 5 second authentication flow completion

**WARNING - ARCHITECTURE REVIEW:**
- Which OAuth library for our backend? (passport.js vs others)
- Token refresh strategy for long-lived sessions
- CSRF protection implementation approach

**WARNING - ARCHITECTURE REVIEW:**
- Session storage mechanism (in-memory, Redis, database?)
- Token validation performance at scale
- OAuth callback URL configuration for deployment

---

#### FR-1.2: User Data Segregation
**User Story:** As a user, I want my workout data to be completely private so that other users cannot see my progress or exercises.

**Acceptance Criteria:**
- MUST: All API endpoints filter data by authenticated userId
- MUST: Database queries MUST include userId in WHERE clauses
- MUST: Return 401 Unauthorized for unauthenticated requests
- MUST: Return 403 Forbidden if user attempts to access another user's data
- MUST: Prevent userId manipulation in API requests

**Technical Constraints:**
- Backend middleware MUST extract userId from validated session token
- All WorkoutSession, WorkoutExercise queries MUST join/filter on userId
- Custom exercises MUST be scoped to creating user only

**Success Metrics:**
- 100% of API endpoints properly filter by userId
- Zero cross-user data leakage in security testing

---

### FR-2: Workout Session Management

#### FR-2.1: Create New Workout Session
**User Story:** As a user, I want to quickly start a new workout session so that I can begin logging exercises immediately.

**Acceptance Criteria:**
- MUST: Provide prominent "Start Workout" button on dashboard
- MUST: Default workout start time to current date/time
- MUST: Allow user to override start time (for retroactive logging)
- MUST: Create WorkoutSession record immediately on start
- MUST: Persist session state to backend (not just localStorage)
- SHOULD: Display current workout timer/duration
- MAY: Allow user to add workout notes/title during creation

**Technical Constraints:**
- WorkoutSession.startTime MUST be ISO 8601 timestamp
- Frontend MUST NOT rely solely on localStorage for active session tracking
- Backend API MUST support creating WorkoutSession without exercises

**Mobile Considerations:**
- "Start Workout" button MUST be minimum 48x48px touch target
- Start time picker MUST be mobile-friendly (native date/time inputs)
- Avoid multi-step wizards; single tap to start workout

**Success Metrics:**
- < 2 seconds from dashboard load to workout started
- Zero session creation failures
- 100% session recovery after browser closure

**WARNING - ARCHITECTURE REVIEW:**
- How to handle "active workout" state across multiple devices/browsers?
- Should users be limited to one active workout at a time?
- Conflict resolution if user starts workout on mobile and desktop simultaneously

---

#### FR-2.2: Add Exercises to Active Workout
**User Story:** As a user, I want to add exercises to my current workout as I complete them so that I can log in real-time without interrupting my routine.

**Acceptance Criteria:**
- MUST: Display exercise selection interface prominently during active workout
- MUST: Support adding exercises from pre-defined library
- MUST: Support creating custom exercises inline
- MUST: Auto-save exercise data immediately after input
- MUST: Display exercises in order added (orderIndex)
- MUST: Allow editing/deleting exercises from active workout
- SHOULD: Show recently used exercises for quick access
- SHOULD: Support quick-add for repeated exercises (e.g., "Add another set")
- MAY: Support reordering exercises via drag-and-drop

**Technical Constraints:**
- Use Exercise and WorkoutExercise types from packages/shared
- WorkoutExercise.orderIndex MUST be maintained sequentially
- Backend API MUST support adding exercises to in-progress WorkoutSession
- Frontend MUST optimistically update UI while syncing to backend

**Mobile Considerations:**
- Exercise input form MUST fit on single mobile screen (minimal scrolling)
- Number inputs MUST trigger numeric keyboard on mobile
- Exercise selection MUST use mobile-optimized picker/autocomplete
- Avoid dropdowns; prefer buttons or search-based selection

**Success Metrics:**
- < 10 seconds to add single exercise (from selection to save)
- Zero data loss on exercise addition
- < 1 second UI update latency

**RESEARCH COMPLETED:**

**Exercise Selection UX Pattern:**
- **Recommendation:** Hybrid approach combining three methods:
  1. **Recent/Quick Access (Primary):** Display 3-5 most recently used exercises at the top for immediate access
  2. **Category-based browsing:** Horizontal scrollable pills for categories (Push, Pull, Legs, Cardio, Core)
  3. **Search:** Prominent search bar for finding specific exercises

- **Rationale:** Research shows fitness apps achieve best results with progressive disclosure - users prefer quick access to recent exercises (fastest path), category browsing for exploration, and search as backup. Studies indicate users should get from "goal to plan to starting workout in under 60 seconds" with "one feature at a time" visible.

- **Mobile-Specific Pattern:** Avoid dropdowns on mobile; use large touch targets (48x48px minimum) for category pills and exercise selection buttons.

**Exercise Library Loading:**
- **Recommendation:** Fully load library on initial app load (cache in memory), with optional lazy loading for exercise details/images
- **Rationale:** With 50-100 exercises, the data payload is minimal (estimated 5-10KB for names/categories). Full loading enables instant search/filter without network latency, critical for <30 second logging goal. For reference, Strong app (1.2M+ downloads) uses this approach successfully.

**Default Values for Sets/Reps:**
- **Recommendation:** Implement smart defaults based on context:
  1. **First time adding exercise:** Default to 3 sets, 10 reps, no weight (bodyweight)
  2. **Repeat exercise in same workout:** Prefill with values from previous set
  3. **Exercise done in past workouts:** Prefill with most recent values from history

- **Rationale:** Mobile form UX research shows "default values allow users to complete forms faster" and are especially critical since "typing on mobile is difficult". Progressive defaults (simple → contextual) balance speed with accuracy.

- **Input Pattern:** Use large increment/decrement buttons (+/- for weight, sets, reps) rather than requiring keyboard input for every value. Research shows for mobile forms with incremental values, steppers/sliders are preferred over text input.

---

#### FR-2.3: Exercise Data Entry
**User Story:** As a user, I want to input exercise details (sets, reps, weight) quickly so that I can minimize time spent on my phone during workouts.

**Acceptance Criteria:**
- MUST: Support entering sets, reps, weight for strength exercises
- MUST: Support entering duration, distance for cardio exercises
- MUST: Use appropriate units (lbs/kg for weight, minutes for duration)
- MUST: Validate numeric inputs (positive numbers only)
- MUST: Support "bodyweight" option (no weight value)
- SHOULD: Pre-fill previous values for repeated exercises
- SHOULD: Support quick increment/decrement buttons (+/- 5 lbs, +/- 1 rep)
- MAY: Support rest timer between sets

**Technical Constraints:**
- Exercise model MUST accommodate both strength and cardio data
- Weight values MUST be stored as numbers (not strings)
- Frontend MUST validate inputs before sending to backend
- Backend MUST perform secondary validation on all inputs

**Mobile Considerations:**
- Number inputs MUST use inputmode="numeric" or inputmode="decimal"
- Quick increment buttons MUST be minimum 44x44px touch targets
- Avoid requiring decimal input for common values (use steppers)
- Single-column layout for form fields

**Success Metrics:**
- < 5 seconds to input full exercise details
- Zero invalid data submissions
- 95% user satisfaction with input speed

**WARNING - ARCHITECTURE REVIEW:**
- How to handle mixed exercise types (strength + cardio in same workout)?
- Should sets/reps be stored as separate records or aggregated?
- Unit conversion strategy (lbs <-> kg)?

---

#### FR-2.4: Complete Workout Session
**User Story:** As a user, I want to finish my workout session so that it's saved to my history and no longer appears as "in progress."

**Acceptance Criteria:**
- MUST: Provide clear "Finish Workout" button
- MUST: Set WorkoutSession.endTime to current timestamp
- MUST: Prevent adding exercises after workout completed
- MUST: Display workout summary after completion
- SHOULD: Allow adding workout notes on completion
- SHOULD: Display workout duration (endTime - startTime)
- MAY: Prompt user to confirm if finishing workout with zero exercises

**Technical Constraints:**
- Backend MUST validate that user owns WorkoutSession before updating
- Frontend MUST clear "active workout" state after completion
- Completed workouts MUST NOT be editable (or require explicit "edit mode")

**Mobile Considerations:**
- "Finish Workout" button MUST be accessible without scrolling
- Workout summary MUST be readable on mobile screens
- Avoid modal dialogs for completion confirmation

**Success Metrics:**
- < 2 seconds to complete workout
- Zero completion failures
- 100% data accuracy post-completion

---

### FR-3: Exercise Library Management

#### FR-3.1: Pre-Defined Exercise Library
**User Story:** As a user, I want to select from common exercises so that I don't have to type exercise names repeatedly.

**Acceptance Criteria:**
- MUST: Provide library of 50+ common exercises on initial deployment
- MUST: Categorize exercises (e.g., "Upper Body - Push", "Lower Body - Pull", "Cardio")
- MUST: Support searching exercises by name
- MUST: Mark exercises as strength or cardio type
- SHOULD: Display exercise descriptions/instructions
- MAY: Include exercise images/animations

**Technical Constraints:**
- Exercise library MUST be seeded in database on initial deployment
- Use Exercise type from packages/shared
- Exercise.isCustom MUST be false for library exercises
- Library exercises MUST be read-only (users cannot edit)

**Mobile Considerations:**
- Search input MUST be prominently placed
- Exercise list MUST use infinite scroll or pagination (not single long list)
- Category filters MUST use horizontal scrollable pills (not dropdown)

**Success Metrics:**
- Users find desired exercise within 5 seconds (95th percentile)
- < 10% of exercises logged are custom (indicates good library coverage)

**RESEARCH COMPLETED:**

**Initial Exercise Library (50+ Exercises):**

The library should include the most common compound and isolation exercises across all major muscle groups:

**Compound Exercises (Primary - 20 exercises):**
1. Barbell Back Squat
2. Front Squat
3. Deadlift
4. Romanian Deadlift
5. Barbell Bench Press
6. Incline Barbell Bench Press
7. Decline Bench Press
8. Barbell Overhead Press (Standing)
9. Push Press
10. Barbell Row
11. Pull-ups
12. Chin-ups
13. Dips
14. Bulgarian Split Squat
15. Leg Press
16. Lunges
17. Barbell Hip Thrust
18. Sumo Deadlift
19. Close-Grip Bench Press
20. T-Bar Row

**Dumbbell Compound Exercises (12 exercises):**
21. Dumbbell Bench Press
22. Incline Dumbbell Press
23. Dumbbell Overhead Press
24. Dumbbell Row
25. Dumbbell Goblet Squat
26. Dumbbell Romanian Deadlift
27. Dumbbell Lunges
28. Dumbbell Shoulder Press
29. Dumbbell Chest Fly
30. Dumbbell Pullover
31. Dumbbell Shrugs
32. Dumbbell Step-ups

**Isolation Exercises (18 exercises):**
33. Barbell Bicep Curl
34. Dumbbell Bicep Curl
35. Hammer Curl
36. Tricep Pushdown (Cable)
37. Overhead Tricep Extension
38. Lateral Raise
39. Front Raise
40. Rear Delt Fly
41. Leg Extension
42. Leg Curl (Hamstring)
43. Calf Raise (Standing)
44. Seated Calf Raise
45. Cable Fly
46. Face Pull
47. Concentration Curl
48. Preacher Curl
49. Skull Crusher
50. Cable Curl

**Bodyweight & Cardio (10 exercises):**
51. Push-ups
52. Diamond Push-ups
53. Pike Push-ups
54. Bodyweight Squat
55. Plank
56. Side Plank
57. Running
58. Cycling
59. Rowing Machine
60. Jump Rope

**Exercise Categorization Taxonomy:**
- **Primary Categories:**
  - Push (Chest, Shoulders, Triceps)
  - Pull (Back, Biceps)
  - Legs (Quads, Hamstrings, Glutes, Calves)
  - Core (Abs, Obliques)
  - Cardio

- **Secondary Tags:** Equipment type (Barbell, Dumbbell, Cable, Machine, Bodyweight), Compound vs. Isolation

**Naming Conventions:**
- Format: `[Equipment] [Movement] [Variation]`
  - Examples: "Barbell Bench Press", "Incline Dumbbell Press", "Cable Tricep Pushdown"
- Keep names consistent with popular fitness apps (Strong, Hevy) for user familiarity
- Avoid abbreviations in display names (but support search aliases)
- Use American English spelling for consistency

**Rationale:** Research shows these exercises represent the core movements in powerlifting, bodybuilding, and general fitness programs. Apps like Strong and Hevy with 1M+ users build their libraries around these fundamentals. The 60-exercise library provides ~85% coverage of typical workout needs while keeping the list manageable.

---

#### FR-3.2: Custom Exercise Creation
**User Story:** As a user, I want to create custom exercises so that I can log activities not in the standard library.

**Acceptance Criteria:**
- MUST: Allow creating custom exercise during workout (inline creation)
- MUST: Save custom exercises to user's personal library
- MUST: Restrict custom exercise visibility to creating user only
- MUST: Validate exercise name (non-empty, max 100 characters)
- SHOULD: Support editing custom exercise names
- SHOULD: Support deleting custom exercises (if not used in past workouts)
- MAY: Allow converting custom exercise to use library exercise retroactively

**Technical Constraints:**
- Exercise.isCustom MUST be true for user-created exercises
- Custom exercises MUST include userId reference
- Backend MUST filter custom exercises by userId in all queries
- Deleting custom exercise MUST NOT delete historical workout data

**Mobile Considerations:**
- Custom exercise creation MUST use simple text input (avoid multi-field forms)
- Keep creation flow to single step (name only, defaults for other fields)

**Success Metrics:**
- < 10 seconds to create and use custom exercise
- Zero unauthorized access to other users' custom exercises

---

### FR-4: Workout History & Data Retrieval

#### FR-4.1: View Workout History
**User Story:** As a user, I want to see my past workouts organized by date so that I can track my progress over time.

**Acceptance Criteria:**
- MUST: Display workouts in reverse chronological order (newest first)
- MUST: Show workout date, duration, and exercise count for each entry
- MUST: Support filtering by date range
- MUST: Paginate results (20 workouts per page)
- SHOULD: Display quick stats (total workouts this week/month)
- SHOULD: Support searching workouts by exercise name
- MAY: Group workouts by week/month in UI

**Technical Constraints:**
- Backend API MUST return only authenticated user's workouts
- Pagination MUST use cursor or offset/limit approach
- Queries MUST be optimized (indexed on userId + startTime)

**Mobile Considerations:**
- List view MUST use card-based layout (easy to scan)
- Date filters MUST use mobile-friendly date pickers
- Infinite scroll preferred over pagination buttons

**Success Metrics:**
- < 2 seconds to load workout history page
- 100% accuracy in workout retrieval
- Zero missing workouts

---

#### FR-4.2: View Workout Details
**User Story:** As a user, I want to view details of a past workout so that I can see what exercises I performed.

**Acceptance Criteria:**
- MUST: Display all exercises in workout (in original order)
- MUST: Show sets, reps, weight for each exercise
- MUST: Display workout start time, end time, duration
- MUST: Show workout notes if present
- SHOULD: Highlight personal records (PRs) in workout
- MAY: Support duplicating workout as new session

**Technical Constraints:**
- Backend API MUST join WorkoutSession, WorkoutExercise, Exercise tables
- Frontend MUST handle missing data gracefully (e.g., incomplete workouts)
- Use shared types from packages/shared for response format

**Mobile Considerations:**
- Exercise details MUST be readable without horizontal scrolling
- Use expandable/collapsible sections if workout is long
- Avoid tables; use card-based layout

**Success Metrics:**
- < 1 second to load workout details
- 100% data accuracy vs. original input

---

### FR-5: State Persistence & Recovery

#### FR-5.1: In-Progress Workout Persistence
**User Story:** As a user, I want my active workout to be saved automatically so that I don't lose data if my browser crashes or I close the tab.

**Acceptance Criteria:**
- MUST: Save WorkoutSession to backend immediately on creation
- MUST: Save each WorkoutExercise to backend immediately after input
- MUST: Persist "active workout" state across browser restarts
- MUST: Detect and resume in-progress workout on app load
- MUST: Handle offline scenarios gracefully (queue changes for sync)
- SHOULD: Display visual indicator when data is syncing
- MAY: Support undo for recently added exercises

**Technical Constraints:**
- Frontend MUST NOT rely solely on localStorage for critical data
- Backend API MUST support partial WorkoutSession updates
- Optimistic UI updates with rollback on API failure
- Use shared types from packages/shared for sync payloads

**Mobile Considerations:**
- Sync status MUST be visible but non-intrusive (subtle indicator)
- Handle slow/intermittent mobile connections
- Avoid blocking UI during background sync

**Success Metrics:**
- 100% workout recovery rate after browser closure
- < 5 seconds to detect and resume in-progress workout
- Zero data loss in offline scenarios (after reconnection)

**WARNING - ARCHITECTURE REVIEW:**
- Offline-first architecture approach (Service Workers, IndexedDB?)
- Conflict resolution strategy for concurrent edits across devices
- How long to retain "abandoned" in-progress workouts?

---

#### FR-5.2: Data Backup & Export
**User Story:** As a user, I want to export my workout data so that I have a backup and can analyze it in other tools.

**Acceptance Criteria:**
- MAY: Support exporting workout history as CSV
- MAY: Support exporting workout history as JSON
- MAY: Include all workout details in export (exercises, sets, reps, weights)

**Note:** This is a stretch goal (MAY requirement) and not critical for MVP.

---

## Non-Functional Requirements

### NFR-1: Performance

#### NFR-1.1: Page Load Performance
**Acceptance Criteria:**
- MUST: Initial page load < 3 seconds on 3G connection
- MUST: Time to Interactive (TTI) < 5 seconds on mobile
- MUST: First Contentful Paint (FCP) < 2 seconds
- SHOULD: Use code splitting to minimize initial bundle size
- SHOULD: Lazy load workout history data

**Measurement:** Lighthouse performance audit, WebPageTest on mobile device

---

#### NFR-1.2: API Response Times
**Acceptance Criteria:**
- MUST: 95th percentile API response time < 500ms
- MUST: 99th percentile API response time < 1000ms
- SHOULD: Use database indexing on userId, startTime
- SHOULD: Implement API response caching where appropriate

**Measurement:** API monitoring, backend logging

---

### NFR-2: Mobile Optimization

#### NFR-2.1: Lighthouse Mobile Score
**Acceptance Criteria:**
- MUST: Score > 90% on Lighthouse mobile usability
- MUST: Score > 80% on Lighthouse performance (mobile)
- MUST: Pass all mobile-friendly tests (viewport, touch targets, font sizes)

**Technical Constraints:**
- Use responsive CSS (flexbox/grid, no fixed widths)
- Minimum touch target size: 44x44px (iOS) / 48x48px (Android)
- Minimum font size: 16px (prevent zoom on iOS)
- Viewport meta tag configured correctly

---

#### NFR-2.2: Responsive Design
**Acceptance Criteria:**
- MUST: Support screen widths from 320px (iPhone SE) to 1920px (desktop)
- MUST: Use mobile-first CSS approach
- MUST: Test on iOS Safari and Chrome Android
- SHOULD: Support landscape and portrait orientations
- SHOULD: Use system fonts for faster rendering

**Breakpoints:**
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

---

### NFR-3: Security

#### NFR-3.1: Authentication Security
**Acceptance Criteria:**
- MUST: Use HTTPS for all connections (force redirect from HTTP)
- MUST: Implement CSRF protection on all state-changing endpoints
- MUST: Set secure, httpOnly, sameSite cookies for session tokens
- MUST: Validate OAuth tokens on backend (never trust client)
- SHOULD: Implement rate limiting on authentication endpoints
- SHOULD: Log authentication failures for monitoring

---

#### NFR-3.2: Data Protection
**Acceptance Criteria:**
- MUST: Sanitize all user inputs to prevent XSS
- MUST: Use parameterized queries to prevent SQL injection
- MUST: Never expose user data in URLs (use POST for sensitive operations)
- SHOULD: Implement Content Security Policy (CSP) headers

---

### NFR-4: Scalability

#### NFR-4.1: User Growth
**Acceptance Criteria:**
- MUST: Support up to 1,000 concurrent users
- SHOULD: Support up to 10,000 total registered users
- SHOULD: Database schema designed for horizontal scaling

**Note:** Initial deployment targets < 1000 users. Architecture should not prevent future scaling.

---

### NFR-5: Reliability

#### NFR-5.1: Data Integrity
**Acceptance Criteria:**
- MUST: 100% accuracy in workout data retrieval
- MUST: Zero data loss in workout logging
- MUST: Database backups performed daily
- SHOULD: Implement database constraints (foreign keys, NOT NULL)
- SHOULD: Use database transactions for multi-step operations

---

#### NFR-5.2: Availability
**Acceptance Criteria:**
- SHOULD: 99% uptime (allow for maintenance windows)
- SHOULD: Graceful degradation if backend unavailable (display cached data)
- MAY: Implement health check endpoints for monitoring

---

## User Flows

### Flow 1: New User Sign-Up & First Workout

```
1. User lands on homepage
2. User clicks "Sign In with Google"
3. OAuth consent screen (external)
4. User approves access
5. App creates User record in database
6. User redirected to dashboard
7. User clicks "Start Workout"
8. WorkoutSession created (startTime = now)
9. User clicks "Add Exercise"
10. User searches "bench press"
11. User selects "Bench Press" from library
12. User enters: 3 sets, 10 reps, 135 lbs
13. WorkoutExercise saved to backend
14. User repeats steps 9-13 for 2 more exercises
15. User clicks "Finish Workout"
16. WorkoutSession.endTime set
17. User sees workout summary
18. User clicks "View History"
19. User sees completed workout in list
```

**Total Time Target:** < 30 seconds (steps 7-16)

---

### Flow 2: Returning User - Resume In-Progress Workout

```
1. User opens app in browser
2. Backend detects active WorkoutSession for user
3. App displays "Resume Workout?" prompt
4. User clicks "Resume"
5. App loads WorkoutSession + existing WorkoutExercises
6. User continues adding exercises
7. User completes workout
```

**Total Time Target:** < 5 seconds to resume (steps 2-5)

---

### Flow 3: Custom Exercise Creation

```
1. User in active workout
2. User clicks "Add Exercise"
3. User searches "Bulgarian split squat"
4. No results found
5. User clicks "Create Custom Exercise"
6. User enters name: "Bulgarian Split Squat"
7. Exercise created (isCustom = true, userId = current user)
8. User enters sets, reps, weight
9. WorkoutExercise saved
10. Custom exercise now available in user's library
```

**Total Time Target:** < 15 seconds (steps 5-9)

---

### Flow 4: View Workout History

```
1. User clicks "History" in navigation
2. Backend fetches WorkoutSessions for user (paginated)
3. App displays list of workouts (date, duration, exercise count)
4. User clicks on specific workout
5. Backend fetches WorkoutExercises + Exercise details
6. App displays workout details (exercises, sets, reps, weights)
7. User clicks "Back to History"
```

**Total Time Target:** < 2 seconds per page load

---

## Technical Constraints

### TC-1: Technology Stack

**MUST Requirements:**
- Frontend: TypeScript + React + Vite
- Backend: TypeScript + Node.js + Express
- Shared: TypeScript types in packages/shared
- Monorepo: npm workspaces structure
- Node Version: 22.18.0 (managed via nvm)

**SHOULD Requirements:**
- Database: PostgreSQL or SQLite (for simplicity)
- Authentication: Passport.js + Google OAuth
- Styling: CSS Modules or Tailwind CSS (mobile-first)
- Testing: Jest + React Testing Library + Supertest

**WARNING - RESEARCH NEEDED:**
- Backend: Express or an alternative
- Database selection: PostgreSQL (production-ready) vs. SQLite (simpler setup)
- State management: React Context vs. Redux vs. Zustand
- CSS approach: Tailwind (utility-first) vs. CSS Modules (scoped styles)

---

### TC-2: Monorepo Structure

**MUST Adherence:**
```
/
├── packages/
│   ├── shared/
│   │   ├── types/
│   │   │   └── index.ts       (User, Exercise, WorkoutSession, WorkoutExercise)
│   │   └── package.json
│   ├── backend/
│   │   ├── src/
│   │   │   └── index.ts       (Express server, port 3000)
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   └── main.tsx       (React app, port 5173)
│       └── package.json
├── package.json               (workspace root)
└── .nvmrc                     (Node 22.18.0)
```

**Key Constraints:**
- TypeScript project references MUST be configured
- Frontend MUST import types from `@fitness-tracker/shared`
- Backend MUST import types from `@fitness-tracker/shared`
- Vite proxy MUST forward `/api/*` to backend:3000

---

### TC-3: Data Model (Shared Types)

**MUST Implement (from packages/shared/types/index.ts):**

```typescript
export interface User {
  id: string;                  // UUID or auto-increment
  email: string;               // From OAuth provider
  displayName: string;         // From OAuth provider
  profilePictureUrl?: string;  // From OAuth provider
  createdAt: Date;
  updatedAt: Date;
}

export interface Exercise {
  id: string;                  // UUID or auto-increment
  name: string;                // e.g., "Bench Press", "Running"
  category?: string;           // e.g., "Upper Body - Push", "Cardio"
  isCustom: boolean;           // false for library, true for user-created
  userId?: string;             // Set if isCustom = true
  createdAt: Date;
}

export interface WorkoutSession {
  id: string;                  // UUID or auto-increment
  userId: string;              // Foreign key to User
  startTime: Date;             // ISO 8601 timestamp
  endTime?: Date;              // Set when workout completed
  notes?: string;              // Optional workout notes
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutExercise {
  id: string;                  // UUID or auto-increment
  workoutSessionId: string;    // Foreign key to WorkoutSession
  exerciseId: string;          // Foreign key to Exercise
  orderIndex: number;          // Order in workout (0, 1, 2...)
  sets?: number;               // For strength exercises
  reps?: number;               // For strength exercises
  weight?: number;             // In lbs or kg
  weightUnit?: 'lbs' | 'kg' | 'bodyweight';
  duration?: number;           // For cardio (in minutes)
  distance?: number;           // For cardio (in miles/km)
  distanceUnit?: 'miles' | 'km';
  notes?: string;              // Exercise-specific notes
  createdAt: Date;
}
```

**WARNING - ARCHITECTURE REVIEW:**
- Should WorkoutExercise support multiple sets as separate records or aggregated?
- How to handle "supersets" or circuit training (exercises grouped together)?
- Should we track rest time between sets?

---

### TC-4: API Design

**MUST Follow RESTful Conventions:**

**Authentication:**
- `GET /api/auth/google` - Initiate OAuth flow
- `GET /api/auth/google/callback` - OAuth callback
- `POST /api/auth/logout` - End user session
- `GET /api/auth/me` - Get current user info

**Workout Sessions:**
- `POST /api/workouts` - Create new workout session
- `GET /api/workouts` - List user's workouts (paginated)
- `GET /api/workouts/:id` - Get workout details
- `PATCH /api/workouts/:id` - Update workout (e.g., set endTime)
- `DELETE /api/workouts/:id` - Delete workout

**Workout Exercises:**
- `POST /api/workouts/:id/exercises` - Add exercise to workout
- `GET /api/workouts/:id/exercises` - List exercises in workout
- `PATCH /api/workouts/:workoutId/exercises/:exerciseId` - Update exercise
- `DELETE /api/workouts/:workoutId/exercises/:exerciseId` - Remove exercise

**Exercise Library:**
- `GET /api/exercises` - List exercises (filter by isCustom, search)
- `POST /api/exercises` - Create custom exercise
- `PATCH /api/exercises/:id` - Update custom exercise (user-owned only)
- `DELETE /api/exercises/:id` - Delete custom exercise (user-owned only)

**Constraints:**
- All endpoints MUST require authentication (except auth endpoints)
- All endpoints MUST filter data by userId
- All endpoints MUST return 401 if not authenticated
- All endpoints MUST validate request bodies using shared types
- All POST/PATCH endpoints MUST return updated resource

---

### TC-5: Frontend Architecture

**MUST Requirements:**
- Use React functional components (no class components)
- Use React hooks for state management
- Use TypeScript strict mode
- Import shared types from `@fitness-tracker/shared`
- Implement responsive design (mobile-first CSS)

**SHOULD Requirements:**
- Use React Router for navigation
- Implement loading states for async operations
- Implement error boundaries for graceful error handling
- Use React.lazy for code splitting

**Routing Structure:**
```
/ (Home/Landing) - Redirects to /dashboard if authenticated
/login - OAuth initiation (or auto-redirect)
/dashboard - User's workout dashboard
/workout/active - Active workout logging screen
/workout/:id - Workout detail view
/history - Workout history list
/exercises - Exercise library browser
```

---

### TC-6: State Persistence Strategy

**MUST Implement:**
- Save WorkoutSession to backend on creation
- Save WorkoutExercise to backend immediately after input
- Store active workout ID in localStorage (backup only)
- Fetch active workout from backend on app load
- Implement optimistic UI updates with rollback on failure

**SHOULD Implement:**
- Queue failed requests for retry (offline support)
- Display sync status indicator
- Implement request debouncing for rapid edits

**WARNING - ARCHITECTURE REVIEW:**
- Should we use Service Workers for offline support?
- Should we use IndexedDB for local caching?
- How to handle merge conflicts if user edits across devices?

---

## Out of Scope

The following features are explicitly **NOT** included in the initial release:

1. **Social Features**
   - Friends/followers
   - Sharing workouts
   - Leaderboards
   - Comments or likes

2. **Nutrition Tracking**
   - Calorie logging
   - Meal tracking
   - Macronutrient tracking
   - Recipe database

3. **Native Mobile Apps**
   - iOS .ipa build
   - Android .apk build
   - App Store deployment
   - Push notifications

4. **Advanced Analytics**
   - Body composition tracking
   - Progress photos
   - Trend analysis charts
   - Personal record detection

5. **Third-Party Integrations**
   - Fitbit sync
   - Apple Health sync
   - Garmin Connect sync
   - Strava integration

6. **Wearable Support**
   - Apple Watch companion app
   - Android Wear app

7. **Premium Features**
   - Subscription tiers
   - Payment processing
   - Workout programs/templates
   - AI-powered coaching

**Note:** Some features (e.g., goal setting, statistics) are listed as stretch goals and MAY be included if time permits. All out-of-scope items can be considered for future releases.

---

## Open Questions & Investigation Areas

### Research Agent Tasks

**RESEARCH COMPLETED: Mobile UX Patterns**
- **Question:** What is the optimal exercise selection UX on mobile? (search vs. categories vs. recent)
- **Why:** Directly impacts the <30 second logging goal
- **Decision Dependency:** Frontend implementation of exercise selection

**Recommendation:** Implement a **hybrid three-tier approach**:
1. **Quick Access (Top Priority):** Display 3-5 most recently used exercises at the top with large touch targets (48x48px minimum)
2. **Category Browsing:** Horizontal scrollable pills for 5 main categories (Push, Pull, Legs, Core, Cardio)
3. **Search:** Prominent search bar with instant filtering for finding specific exercises

**Research Findings:**
- Industry leaders emphasize progressive disclosure - showing "one feature at a time" with easily swipeable screens
- Users should achieve "from goal to plan to starting workout in under 60 seconds"
- Recent/frequent exercises reduce cognitive load and tap count for repeat users
- Category-based browsing helps exploration and discovery
- Search serves as backup for edge cases

**Mobile-Specific Guidelines:**
- Avoid dropdown menus (poor mobile UX)
- Use large touch targets (minimum 44x44px per iOS, 48x48px per Material Design)
- Horizontal scrolling for categories (natural mobile gesture)
- Single-column layout for exercise list

**Sources:**
- UX Design Principles From Top Health and Fitness Apps (Superside)
- Fitness App UI Design: Key Principles (Stormotion)
- Best Practices For Mobile Form Design (Smashing Magazine)

**RESEARCH COMPLETED: Exercise Library Content**
- **Question:** Which 50+ exercises should be included in the initial library?
- **Why:** Library coverage affects how often users need custom exercises
- **Decision Dependency:** Database seeding script

**Recommendation:** Initial library of **60 exercises** covering all major movement patterns:

**Exercise Breakdown:**
- **20 Barbell Compound Exercises** (Squat, Deadlift, Bench Press variations, Rows, etc.)
- **12 Dumbbell Compound Exercises** (DB Press, Row, Goblet Squat, Lunges, etc.)
- **18 Isolation Exercises** (Bicep Curls, Tricep Extensions, Lateral Raises, Leg Extensions, etc.)
- **10 Bodyweight & Cardio** (Push-ups, Pull-ups, Plank, Running, Cycling, etc.)

**Categorization Taxonomy:**
- **Primary Categories:** Push, Pull, Legs, Core, Cardio
- **Secondary Tags:** Equipment type (Barbell, Dumbbell, Cable, Machine, Bodyweight)
- **Exercise Types:** Compound vs. Isolation

**Naming Conventions:**
- Format: `[Equipment] [Movement] [Variation]`
- Examples: "Barbell Bench Press", "Incline Dumbbell Press", "Cable Tricep Pushdown"
- Maintain consistency with popular apps (Strong, Hevy) for familiarity
- No abbreviations in display names (support search aliases)

**Research Findings:**
- The "Big Three" powerlifting exercises (Squat, Bench Press, Deadlift) and their variations are foundational
- Apps like Strong (1.2M+ downloads) and Caliber (500+ exercise library) prioritize compound movements
- 60-exercise library provides ~85% coverage of typical workout needs
- Compound exercises should outnumber isolation exercises 2:1 as they're more efficient for most users

**Expected Outcome:**
- Target: <10% of logged exercises should be custom (validates good library coverage)
- Users should find desired exercise within 5 seconds (95th percentile)

**Sources:**
- Top 20 Powerlifting Exercises For Strength & Mass (StrengthLog)
- Expert-Tested: The 9 Best Weightlifting Apps 2025 (Garage Gym Reviews)
- Compound vs. Isolation Exercises (Hevy, Gymshark)
- Exercise library resources (ACE Fitness, Modern Athletics)

**RESEARCH COMPLETED: Mobile Performance Benchmarks**
- **Question:** What are realistic Lighthouse scores for React SPAs on mobile?
- **Why:** Ensures our >90% target is achievable
- **Decision Dependency:** Performance optimization priorities

**Recommendation:** Target **>90% mobile usability** (achievable) and **80-90% performance** (realistic for React SPA)

**Realistic Lighthouse Score Expectations for React SPAs:**

**Performance Category:**
- **100 score:** Extremely difficult; requires aggressive optimization, possible with Next.js SSR + minimal libraries
- **90-96 range:** Achievable with optimization (Next.js base, code splitting, minimal dependencies)
- **80-90 range:** Realistic target for feature-complete React SPA with moderate optimization
- **70-80 range:** Typical for React SPAs with UI libraries (Material UI, Chakra UI)
- **40-50 range:** Common for unoptimized React SPAs; major e-commerce sites often score here

**Key Research Findings:**
- "Even a basic React 'hello world' app won't pass the audit with 100% Performance"
- Next.js (optimized React) typically achieves ~96% performance due to React parsing/compilation overhead
- Adding Material UI with Emotion can drop scores from 100 to 93-98
- One developer improved from 45 to 80 by route splitting and using preact-compact, shrinking bundle from 2.5MB to <500KB
- React hydration (even server-rendered) is "quite an expensive operation" that limits achievable scores

**Mobile Usability Category:**
- **>90% is achievable** with proper responsive design practices
- Focus areas: proper viewport meta tag, touch target sizes (44x44px minimum), readable font sizes (16px+), no horizontal scrolling

**Recommended Performance Strategy:**
1. **Initial Target:** 80% performance, >90% usability (realistic and achievable)
2. **Optimization Tactics:**
   - Code splitting with React.lazy
   - Minimize UI library bundle size (prefer Chakra UI at 47KB over Material UI at 92KB initial JS)
   - Use system fonts instead of web fonts where possible
   - Lazy load workout history data
   - Implement proper caching strategies
3. **Stretch Goal:** 90% performance (requires significant optimization but possible)

**Rationale:** Prioritize mobile usability >90% (critical for user experience and achievable) while targeting realistic performance scores (80-90%) that balance development speed with user experience. Avoid over-optimizing for perfect scores at expense of development velocity.

**Sources:**
- Get 100 lighthouse performance score with a React app (DEV Community)
- Lighthouse Mobile Performance Scores (Matthew Rea)
- Material-UI GitHub Issue #32103: "Achieving 100% mobile Lighthouse seems impossible"
- SPA with 4x100% lighthouse score (CN Group)

**RESEARCH COMPLETED: Accessibility Requirements**
- **Question:** What WCAG level should we target (A, AA, AAA)?
- **Why:** Affects development effort and user inclusivity
- **Decision Dependency:** Frontend implementation standards

**Recommendation:** Target **WCAG 2.1 Level AA** as the standard conformance level

**WCAG Conformance Levels Overview:**
- **Level A:** Minimum accessibility (addresses most critical barriers)
- **Level AA:** Mid-range accessibility (recommended standard for most websites)
- **Level AAA:** Highest accessibility (often impractical for entire sites)

**Why Level AA is the Right Target:**

1. **Industry Standard:**
   - W3C recommends WCAG 2.1 Level AA conformance
   - U.S. Department of Justice references Level AA as "reasonable standard" for ADA compliance
   - "Many organizations strive to meet Level AA" - it's the de facto standard

2. **Legal Requirements:**
   - EU Web Accessibility Directive requires Level AA for public sector websites
   - European Accessibility Act (EAA) uses WCAG 2.1 Level AA as baseline
   - Level AA satisfies most regulatory requirements globally

3. **Practical Achievability:**
   - Level AA is achievable for entire applications without major compromises
   - Level AAA "may be difficult to achieve for an entire site" per W3C guidance
   - W3C explicitly does not recommend Level AAA as general policy for entire websites

**Key Level AA Requirements for Fitness App:**

**Color Contrast:**
- **AA:** 4.5:1 for normal text, 3:1 for large text (18pt+)
- **AAA:** 7:1 for normal text (often too restrictive for brand colors)

**Multimedia:**
- **AA:** Captions for pre-recorded audio/video
- **AAA:** Sign language interpreters for all content (excessive for fitness app)

**Navigation:**
- **AA:** Multiple ways to find pages, clear focus indicators, logical heading structure
- **AAA:** Even more navigation options (diminishing returns for small app)

**Interactive Elements:**
- **AA:** Keyboard accessible, visible focus states, clear error messages
- Touch targets: 44x44px minimum (already planned for mobile usability)

**Implementation Checklist:**
- Color contrast checker for all UI elements (4.5:1 minimum)
- Semantic HTML with proper heading hierarchy
- ARIA labels for interactive elements
- Keyboard navigation support (tab order, focus management)
- Form labels and error messages clearly associated with inputs
- Skip navigation links
- Alt text for any images

**Rationale:** Level AA provides excellent accessibility for users with disabilities while remaining achievable within development constraints. It satisfies legal requirements and aligns with industry best practices. Level AAA would require disproportionate effort for marginal accessibility gains in a fitness tracking context.

**Sources:**
- Web Content Accessibility Guidelines (WCAG) 2.1 (W3C)
- WCAG Levels A, AA, AAA: Complete 2025 Compliance Guide (AllAccessible)
- What is the difference between WCAG A, AA and AAA? (IA Labs)
- A vs AA vs AAA: WCAG Conformance Levels Explained (AudioEye)

---

### Architecture Agent Tasks

**WARNING - ARCHITECTURE REVIEW: Database Selection**
- **Question:** PostgreSQL vs. SQLite for initial deployment?
- **Why:** PostgreSQL is production-ready but more complex; SQLite is simpler but may limit scaling
- **Decision Dependency:** Backend database setup, ORM selection
- **Recommendation:** Define evaluation criteria (ease of deployment, performance, scalability)

**WARNING - ARCHITECTURE REVIEW: Session Storage**
- **Question:** How should we store session tokens? (in-memory, Redis, database)
- **Why:** Affects session persistence across server restarts and horizontal scaling
- **Decision Dependency:** Backend authentication middleware
- **Recommendation:** Prototype and load test each approach

**WARNING - ARCHITECTURE REVIEW: Offline Support Strategy**
- **Question:** Should we implement Service Workers + IndexedDB for offline-first architecture?
- **Why:** Affects complexity and reliability of state persistence
- **Decision Dependency:** Frontend state management, sync logic
- **Recommendation:** Define offline scenarios (intermittent connection vs. full offline) and evaluate approaches

**WARNING - ARCHITECTURE REVIEW: Active Workout State Management**
- **Question:** How to handle "active workout" across multiple devices/browsers?
- **Why:** User may start workout on phone, continue on desktop
- **Decision Dependency:** WorkoutSession state logic
- **Recommendation:** Define expected behavior (single active workout? device-specific? sync on conflict?)

**WARNING - ARCHITECTURE REVIEW: Sets/Reps Data Model**
- **Question:** Should each set be a separate WorkoutExercise record, or aggregate in single record?
- **Why:** Affects data granularity and query complexity
- **Decision Dependency:** Database schema design
- **Recommendation:** Prototype both approaches with sample queries

**WARNING - ARCHITECTURE REVIEW: API Rate Limiting**
- **Question:** What rate limits should we enforce on API endpoints?
- **Why:** Prevents abuse and ensures fair usage
- **Decision Dependency:** Backend middleware implementation
- **Recommendation:** Define limits based on expected usage patterns (e.g., 100 requests/minute)

**WARNING - ARCHITECTURE REVIEW: Frontend State Management**
- **Question:** React Context vs. Redux vs. Zustand for global state?
- **Why:** Affects code complexity and performance
- **Decision Dependency:** Frontend architecture
- **Recommendation:** Evaluate based on state complexity (authentication, active workout, exercise library)

**WARNING - ARCHITECTURE REVIEW: TypeScript Project References**
- **Question:** How to configure TypeScript project references for optimal build performance?
- **Why:** Ensures proper build ordering in monorepo
- **Decision Dependency:** Build scripts and CI/CD pipeline
- **Recommendation:** Reference official TypeScript docs and test build times

**WARNING - ARCHITECTURE REVIEW: OAuth Provider Selection**
- **Question:** Should we support Google OAuth only, or add GitHub/Auth0?
- **Why:** Affects authentication complexity and user accessibility
- **Decision Dependency:** Backend authentication implementation
- **Recommendation:** Analyze complexity of supporting other OAuth providers

---

## Implementation Phases

### Phase 1: MVP (Minimum Viable Product)
**Goal:** Enable users to log and view workouts with authentication

**Includes:**
- FR-1: User Authentication & Authorization (Google OAuth only)
- FR-2: Workout Session Management (all sub-requirements)
- FR-3.1: Pre-Defined Exercise Library (50+ exercises)
- FR-3.2: Custom Exercise Creation
- FR-4.1: View Workout History (basic list)
- FR-4.2: View Workout Details
- FR-5.1: In-Progress Workout Persistence (basic, no offline support)
- NFR-1: Performance (basic optimization)
- NFR-2: Mobile Optimization (Lighthouse >90%)
- NFR-3: Security (HTTPS, OAuth, data segregation)

**Success Criteria:**
- Users can log workout in <30 seconds
- Lighthouse mobile score >90%
- 100% data retrieval accuracy
- Zero unauthorized data access

---

### Phase 2: Enhancement (Stretch Goals)
**Goal:** Improve UX and add nice-to-have features

**Includes:**
- FR-5.2: Data Backup & Export (CSV/JSON)
- Workout statistics (total workouts, most frequent exercises)
- Personal record (PR) detection
- Workout templates (save and reuse workouts)
- Goal setting (e.g., "Bench press 200 lbs by end of year")

**Note:** Phase 2 features are MAY requirements and should only be implemented after Phase 1 is complete and stable.

---

## Appendix: Design Mockups & Wireframes

**RESEARCH COMPLETED: Design System**
- **Question:** Should we use existing design system (Material UI, Chakra UI) or custom CSS?
- **Why:** Affects development speed and UI consistency
- **Decision Dependency:** Frontend component library selection

**Recommendation:** Use **Chakra UI** for the component library

**Bundle Size Comparison:**
- **Chakra UI:** 47.2KB initial JS, 279.6KB minified (89.0KB gzipped)
- **Material UI:** 91.7KB initial JS, 335.3KB minified (93.7KB gzipped)
- **Shadcn/ui (Tailwind):** 2.3KB initial JS (no runtime dependencies, copy-paste components)

**Why Chakra UI is the Best Choice:**

1. **Mobile-First Design:**
   - Built-in responsive design utilities (base, sm, md, lg breakpoints)
   - "Built-in support for responsive design" makes mobile-first development faster
   - Intuitive responsive style props: `fontSize={{ base: "14px", md: "16px" }}`

2. **Performance:**
   - 48% smaller initial JS bundle than Material UI (47.2KB vs 91.7KB)
   - Better First Contentful Paint (1.2s vs Material UI's larger bundle)
   - Acceptable bundle size for mobile targets

3. **Accessibility-First:**
   - "Designed for accessibility" with WCAG AA best practices built-in
   - Intuitive defaults for keyboard navigation, color contrast, screen readers
   - Perfect alignment with our WCAG 2.1 Level AA target

4. **Developer Experience:**
   - Faster development than custom CSS
   - Consistent design tokens (spacing, colors, typography)
   - Excellent TypeScript support
   - "If developer speed trumps bundle size, Chakra UI excels"

5. **Mobile-Specific Benefits:**
   - Touch-friendly component defaults
   - Works well with React on mobile viewports
   - Less opinionated than Material UI (easier to customize for fitness app aesthetic)

**Alternative Considered: Shadcn/ui + Tailwind**
- **Pros:** Smallest bundle (2.3KB), maximum performance
- **Cons:** Requires more setup, component customization, longer development time
- **Verdict:** Not ideal for MVP; could consider for optimization phase if bundle size becomes critical

**Implementation Strategy:**
1. Install Chakra UI with minimal theme customization
2. Define custom color palette in theme config
3. Use Chakra's responsive utilities for mobile-first development
4. Leverage built-in accessibility features
5. Monitor bundle size; optimize if needed post-MVP

**Expected Impact:**
- Development speed: Fast (pre-built accessible components)
- Bundle size: Moderate (47KB initial JS acceptable for mobile)
- Mobile performance: Good (responsive utilities, smaller than Material UI)
- Accessibility: Excellent (built-in WCAG AA support)

**Rationale:** Chakra UI offers the best balance of developer experience, mobile optimization, bundle size, and accessibility for a fitness tracking MVP. It's significantly lighter than Material UI while providing better mobile-first and accessibility support than custom CSS would require time to build.

**Sources:**
- Chakra UI vs Material UI – Detailed Comparison for 2024 (UXPin)
- Shadcn/ui vs Chakra UI vs Material-UI: Component Battle 2025 (Ase Palazhari)
- Chakra UI vs Material UI (Material Tailwind, PureCode AI, Magic UI)
- Best UI Libraries to Use in 2025 (Aubergine)

**TODO:** Create wireframes for:
1. Dashboard (desktop + mobile)
2. Active workout logging screen (mobile)
3. Exercise selection interface (mobile)
4. Workout history list (mobile)
5. Workout detail view (mobile)

---

## Appendix: Success Metrics Dashboard

**Tracking Required:**
| Metric | Target | Measurement Frequency |
|--------|--------|----------------------|
| Average workout logging time | <30s | Weekly |
| Lighthouse mobile score | >90% | Per deployment |
| Data retrieval accuracy | 100% | Continuous (integration tests) |
| API response time (95th %ile) | <500ms | Continuous (monitoring) |
| Active users (weekly) | N/A | Weekly |
| Workout sessions logged (total) | N/A | Daily |
| Custom exercises created | N/A | Weekly |
| Authentication failures | 0 | Continuous (logs) |

**WARNING - ARCHITECTURE REVIEW:**
- Should we implement analytics tracking (e.g., Google Analytics, Mixpanel)?
- Privacy implications of user behavior tracking
- Self-hosted vs. third-party analytics platform

---

## Document Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-11-21 | 2.0 | Complete rewrite with detailed requirements, user flows, technical constraints, and investigation areas | Product Agent |
| Initial | 1.0 | Basic project requirements | Unknown |

---

**End of Document**
