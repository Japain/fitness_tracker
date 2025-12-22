# Exercise API Testing Guide

Complete testing guide for the Exercise API endpoints.

## Prerequisites

1. **Start the backend server:**
```bash
cd packages/backend
npm run dev
# Server should be running on http://localhost:3000
```

2. **Authenticate via Google OAuth:**
- Navigate to `http://localhost:3000/api/auth/google` in your browser
- Complete Google OAuth flow
- Session cookie will be automatically set

3. **Get CSRF token:**
```bash
curl -c cookies.txt http://localhost:3000/api/auth/csrf-token
```

The CSRF token will be in the JSON response and also set as a cookie in `cookies.txt`.

## Test Scenarios

### 1. GET /api/exercises - List All Exercises

**Basic Request (no filters):**
```bash
curl -b cookies.txt http://localhost:3000/api/exercises
```

**Expected Response:**
- 200 OK
- JSON array of exercises (60 library exercises + any custom exercises)
- Each exercise has: `id`, `name`, `category`, `type`, `isCustom`, `userId`, `createdAt`

**Filter by Category:**
```bash
curl -b cookies.txt "http://localhost:3000/api/exercises?category=Push"
```

**Expected Response:**
- 200 OK
- Only Push exercises (e.g., Bench Press, Push-ups, etc.)

**Filter by Type:**
```bash
curl -b cookies.txt "http://localhost:3000/api/exercises?type=strength"
```

**Expected Response:**
- 200 OK
- Only strength exercises (excludes cardio like Running, Cycling)

**Search by Name:**
```bash
curl -b cookies.txt "http://localhost:3000/api/exercises?search=bench"
```

**Expected Response:**
- 200 OK
- Exercises with "bench" in the name (case-insensitive)
- Example: "Bench Press", "Incline Bench Press", "Dumbbell Bench Press"

**Combined Filters:**
```bash
curl -b cookies.txt "http://localhost:3000/api/exercises?category=Push&type=strength&search=press"
```

**Expected Response:**
- 200 OK
- Only Push exercises of type strength containing "press" in the name

**Error Cases:**

Invalid category:
```bash
curl -b cookies.txt "http://localhost:3000/api/exercises?category=InvalidCategory"
```
Expected: 400 Bad Request with validation error

Invalid type:
```bash
curl -b cookies.txt "http://localhost:3000/api/exercises?type=invalid"
```
Expected: 400 Bad Request with validation error

Unauthenticated:
```bash
curl http://localhost:3000/api/exercises
```
Expected: 401 Unauthorized

---

### 2. POST /api/exercises - Create Custom Exercise

**Valid Request (Strength Exercise):**
```bash
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "My Custom Squat Variation",
    "category": "Legs",
    "type": "strength"
  }' \
  http://localhost:3000/api/exercises
```

**Expected Response:**
- 201 Created
- JSON object with created exercise
- `isCustom: true`, `userId: <your-user-id>`

**Valid Request (Cardio Exercise):**
```bash
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "Rowing Machine Intervals",
    "category": "Cardio",
    "type": "cardio"
  }' \
  http://localhost:3000/api/exercises
```

**Expected Response:**
- 201 Created
- Custom cardio exercise

**Error Cases:**

Missing name:
```bash
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "category": "Push",
    "type": "strength"
  }' \
  http://localhost:3000/api/exercises
```
Expected: 400 Bad Request - "Exercise name is required"

Invalid category:
```bash
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "Test Exercise",
    "category": "InvalidCategory",
    "type": "strength"
  }' \
  http://localhost:3000/api/exercises
```
Expected: 400 Bad Request - "Category must be one of: Push, Pull, Legs, Core, Cardio"

Invalid type:
```bash
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "Test Exercise",
    "category": "Push",
    "type": "invalid"
  }' \
  http://localhost:3000/api/exercises
```
Expected: 400 Bad Request - "Type must be either strength or cardio"

Duplicate name:
```bash
# First create an exercise
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "Duplicate Exercise",
    "category": "Push",
    "type": "strength"
  }' \
  http://localhost:3000/api/exercises

# Try to create again with same name
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "Duplicate Exercise",
    "category": "Pull",
    "type": "strength"
  }' \
  http://localhost:3000/api/exercises
```
Expected: 409 Conflict - "You already have a custom exercise with this name"

Missing CSRF token:
```bash
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Exercise",
    "category": "Push",
    "type": "strength"
  }' \
  http://localhost:3000/api/exercises
```
Expected: 403 Forbidden - CSRF token validation failed

Unauthenticated:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "Test Exercise",
    "category": "Push",
    "type": "strength"
  }' \
  http://localhost:3000/api/exercises
```
Expected: 401 Unauthorized

---

### 3. PATCH /api/exercises/:id - Update Custom Exercise

First, create a custom exercise to update:
```bash
EXERCISE_RESPONSE=$(curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "Exercise To Update",
    "category": "Push",
    "type": "strength"
  }' \
  http://localhost:3000/api/exercises)

# Extract the exercise ID from the response
EXERCISE_ID=$(echo $EXERCISE_RESPONSE | jq -r '.id')
```

**Update Exercise Name:**
```bash
curl -X PATCH -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "Updated Exercise Name"
  }' \
  http://localhost:3000/api/exercises/$EXERCISE_ID
```

**Expected Response:**
- 200 OK
- JSON object with updated exercise

**Update Category:**
```bash
curl -X PATCH -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "category": "Pull"
  }' \
  http://localhost:3000/api/exercises/$EXERCISE_ID
```

**Expected Response:**
- 200 OK
- Exercise category changed to "Pull"

**Update Type:**
```bash
curl -X PATCH -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "type": "cardio"
  }' \
  http://localhost:3000/api/exercises/$EXERCISE_ID
```

**Expected Response:**
- 200 OK
- Exercise type changed to "cardio"

**Update Multiple Fields:**
```bash
curl -X PATCH -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "Completely New Name",
    "category": "Legs",
    "type": "strength"
  }' \
  http://localhost:3000/api/exercises/$EXERCISE_ID
```

**Expected Response:**
- 200 OK
- All fields updated

**Error Cases:**

Attempt to update library exercise:
```bash
# Get a library exercise ID (e.g., Bench Press)
LIBRARY_EXERCISE_ID=$(curl -b cookies.txt "http://localhost:3000/api/exercises?search=Bench%20Press" | jq -r '.[0].id')

curl -X PATCH -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "Modified Bench Press"
  }' \
  http://localhost:3000/api/exercises/$LIBRARY_EXERCISE_ID
```
Expected: 403 Forbidden - "Library exercises cannot be modified or deleted"

Exercise not found:
```bash
curl -X PATCH -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "New Name"
  }' \
  http://localhost:3000/api/exercises/00000000-0000-0000-0000-000000000000
```
Expected: 404 Not Found

No fields provided:
```bash
curl -X PATCH -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{}' \
  http://localhost:3000/api/exercises/$EXERCISE_ID
```
Expected: 400 Bad Request - "At least one field (name, category, or type) must be provided for update"

Invalid category:
```bash
curl -X PATCH -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "category": "InvalidCategory"
  }' \
  http://localhost:3000/api/exercises/$EXERCISE_ID
```
Expected: 400 Bad Request - "Category must be one of: Push, Pull, Legs, Core, Cardio"

Duplicate name:
```bash
# Create two exercises
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "First Exercise",
    "category": "Push",
    "type": "strength"
  }' \
  http://localhost:3000/api/exercises

SECOND_EXERCISE=$(curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "Second Exercise",
    "category": "Push",
    "type": "strength"
  }' \
  http://localhost:3000/api/exercises)

SECOND_ID=$(echo $SECOND_EXERCISE | jq -r '.id')

# Try to rename second exercise to first exercise's name
curl -X PATCH -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "First Exercise"
  }' \
  http://localhost:3000/api/exercises/$SECOND_ID
```
Expected: 409 Conflict - "You already have a custom exercise with this name"

Missing CSRF token:
```bash
curl -X PATCH -b cookies.txt \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New Name"
  }' \
  http://localhost:3000/api/exercises/$EXERCISE_ID
```
Expected: 403 Forbidden - CSRF token validation failed

---

### 4. DELETE /api/exercises/:id - Delete Custom Exercise

First, create a custom exercise to delete:
```bash
DELETE_EXERCISE=$(curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "Exercise To Delete",
    "category": "Push",
    "type": "strength"
  }' \
  http://localhost:3000/api/exercises)

DELETE_EXERCISE_ID=$(echo $DELETE_EXERCISE | jq -r '.id')
```

**Delete Custom Exercise:**
```bash
curl -X DELETE -b cookies.txt \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  http://localhost:3000/api/exercises/$DELETE_EXERCISE_ID
```

**Expected Response:**
- 204 No Content
- Exercise is deleted

**Verify Deletion:**
```bash
curl -b cookies.txt http://localhost:3000/api/exercises/$DELETE_EXERCISE_ID
```
Expected: 404 Not Found (if GET by ID was implemented) or exercise not in list

**Error Cases:**

Attempt to delete library exercise:
```bash
# Get a library exercise ID
LIBRARY_EXERCISE_ID=$(curl -b cookies.txt "http://localhost:3000/api/exercises?search=Bench%20Press" | jq -r '.[0].id')

curl -X DELETE -b cookies.txt \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  http://localhost:3000/api/exercises/$LIBRARY_EXERCISE_ID
```
Expected: 403 Forbidden - "Library exercises cannot be modified or deleted"

Exercise not found:
```bash
curl -X DELETE -b cookies.txt \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  http://localhost:3000/api/exercises/00000000-0000-0000-0000-000000000000
```
Expected: 404 Not Found

Missing CSRF token:
```bash
curl -X DELETE -b cookies.txt \
  http://localhost:3000/api/exercises/$DELETE_EXERCISE_ID
```
Expected: 403 Forbidden - CSRF token validation failed

Unauthenticated:
```bash
curl -X DELETE \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  http://localhost:3000/api/exercises/$DELETE_EXERCISE_ID
```
Expected: 401 Unauthorized

---

## Integration Testing Scenarios

### Scenario 1: Create Custom Exercise and Use in Workout

```bash
# 1. Create custom exercise
CUSTOM_EXERCISE=$(curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "My Special Squat",
    "category": "Legs",
    "type": "strength"
  }' \
  http://localhost:3000/api/exercises)

CUSTOM_EXERCISE_ID=$(echo $CUSTOM_EXERCISE | jq -r '.id')

# 2. Create workout
WORKOUT=$(curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  http://localhost:3000/api/workouts)

WORKOUT_ID=$(echo $WORKOUT | jq -r '.id')

# 3. Add custom exercise to workout
curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d "{
    \"exerciseId\": \"$CUSTOM_EXERCISE_ID\",
    \"orderIndex\": 0
  }" \
  http://localhost:3000/api/workouts/$WORKOUT_ID/exercises

# 4. Verify custom exercise appears in workout
curl -b cookies.txt http://localhost:3000/api/workouts/$WORKOUT_ID
```

Expected: Workout includes custom exercise with full details

### Scenario 2: Delete Custom Exercise Used in Workout

```bash
# 1. Create custom exercise and add to workout (as above)
# ... (steps from Scenario 1)

# 2. Delete custom exercise
curl -X DELETE -b cookies.txt \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  http://localhost:3000/api/exercises/$CUSTOM_EXERCISE_ID

# 3. Verify workout still shows the exercise
curl -b cookies.txt http://localhost:3000/api/workouts/$WORKOUT_ID
```

Expected:
- Exercise deletion succeeds (204 No Content)
- Workout still contains the exercise data (preserved in WorkoutExercise)
- Exercise no longer appears in exercise list for new workouts

### Scenario 3: Update Custom Exercise After Adding to Workout

```bash
# 1. Create custom exercise
CUSTOM_EXERCISE=$(curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "Original Name",
    "category": "Push",
    "type": "strength"
  }' \
  http://localhost:3000/api/exercises)

CUSTOM_EXERCISE_ID=$(echo $CUSTOM_EXERCISE | jq -r '.id')

# 2. Create workout and add exercise
WORKOUT=$(curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  http://localhost:3000/api/workouts)

WORKOUT_ID=$(echo $WORKOUT | jq -r '.id')

curl -X POST -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d "{
    \"exerciseId\": \"$CUSTOM_EXERCISE_ID\",
    \"orderIndex\": 0
  }" \
  http://localhost:3000/api/workouts/$WORKOUT_ID/exercises

# 3. Update exercise name
curl -X PATCH -b cookies.txt \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: YOUR_CSRF_TOKEN_HERE" \
  -d '{
    "name": "Updated Name"
  }' \
  http://localhost:3000/api/exercises/$CUSTOM_EXERCISE_ID

# 4. Verify workout shows updated exercise name
curl -b cookies.txt http://localhost:3000/api/workouts/$WORKOUT_ID
```

Expected: Workout reflects updated exercise name (Exercise table update propagates to WorkoutExercise through foreign key relationship)

---

## Data Validation Summary

### Name Validation
- Required: Yes
- Min length: 1 character
- Max length: 100 characters
- Trimmed: Yes (whitespace removed from start/end)
- Duplicate check: Case-insensitive for user's custom exercises

### Category Validation
- Required: Yes
- Allowed values: `Push`, `Pull`, `Legs`, `Core`, `Cardio`
- Case-sensitive: Yes (must match exactly)

### Type Validation
- Required: Yes
- Allowed values: `strength`, `cardio`
- Case-sensitive: Yes (must match exactly)

### Query Parameter Validation (GET)
- category: Optional, must be one of: `Push`, `Pull`, `Legs`, `Core`, `Cardio`
- type: Optional, must be one of: `strength`, `cardio`
- search: Optional, min 1 character, max 100 characters

---

## Security Checklist

- [x] All endpoints require authentication (`requireAuth` middleware)
- [x] State-changing endpoints (POST, PATCH, DELETE) require CSRF token
- [x] Library exercises (isCustom=false) cannot be modified or deleted
- [x] Custom exercises can only be modified by their owner
- [x] User data segregation: Users can only see their own custom exercises
- [x] Input validation with Zod schemas
- [x] SQL injection protection via Prisma ORM
- [x] Proper HTTP status codes for all scenarios

---

## Quick Reference

### Endpoint Summary

| Method | Endpoint | Auth | CSRF | Description |
|--------|----------|------|------|-------------|
| GET | /api/exercises | Yes | No | List all exercises (library + custom) |
| POST | /api/exercises | Yes | Yes | Create custom exercise |
| PATCH | /api/exercises/:id | Yes | Yes | Update custom exercise |
| DELETE | /api/exercises/:id | Yes | Yes | Delete custom exercise |

### Status Codes

- 200 OK: Successful GET or PATCH
- 201 Created: Successful POST
- 204 No Content: Successful DELETE
- 400 Bad Request: Validation error
- 401 Unauthorized: Not authenticated
- 403 Forbidden: CSRF validation failed or attempting to modify library exercise
- 404 Not Found: Exercise not found
- 409 Conflict: Duplicate exercise name
- 500 Internal Server Error: Server error

---

## Frontend Integration Notes

All validation schemas are available in `packages/shared/validators/exercise.ts`:

```typescript
import {
  exerciseListQuerySchema,
  createExerciseSchema,
  updateExerciseSchema,
  type ExerciseListQuery,
  type CreateExerciseInput,
  type UpdateExerciseInput,
  type ExerciseCategory,
  type ExerciseType,
} from '@fitness-tracker/shared/validators';
```

Example frontend usage:
```typescript
// Validate before API call
const result = createExerciseSchema.safeParse({
  name: userInput.name,
  category: userInput.category,
  type: userInput.type,
});

if (!result.success) {
  // Handle validation errors
  console.error(result.error.errors);
  return;
}

// Make API call with validated data
const response = await fetch('/api/exercises', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken,
  },
  credentials: 'include',
  body: JSON.stringify(result.data),
});
```
