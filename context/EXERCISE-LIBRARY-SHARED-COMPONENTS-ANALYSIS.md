# Exercise Library - Shared Components Analysis

**Date:** 2025-12-29
**Purpose:** Analyze existing ExerciseSelectionModal and identify components/logic to share with new Exercise Library page

---

## Executive Summary

The **ExerciseSelectionModal** (completed in Phase 4) has significant overlap with the planned **Exercise Library page**. To maintain DRY principles and ensure consistency, several components and utilities should be extracted and shared between the two features.

**Key Findings:**
- ✅ 60% of the Exercise Library page UI already exists in ExerciseSelectionModal
- ✅ `useExercises` hook is complete and ready to use
- ⚠️ Need to extract 5 components to avoid duplication
- ⚠️ Need to create shared utilities for filtering/sorting

---

## Current Implementation: ExerciseSelectionModal

### Location
`packages/frontend/src/components/ExerciseSelectionModal.tsx` (715 lines)

### Features Implemented
1. **Search Input** - Text search with live filtering
2. **Category Pills** - Horizontal scrolling pills (All, Push, Pull, Legs, Core, Cardio)
3. **Recent Exercises** - Top 3 recent exercises from localStorage
4. **Exercise List** - Scrollable list with ExerciseItem components
5. **Custom Exercise Creation** - Inline form (name, category, type)
6. **Exercise Selection** - Adds exercise to active workout and closes modal
7. **Loading & Empty States** - Proper UX for loading and no results

### State Management
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [selectedCategory, setSelectedCategory] = useState('All');
const [recentExerciseIds, setRecentExerciseIds] = useState<string[]>([]);
const [showCreateForm, setShowCreateForm] = useState(false);
```

### Data Fetching
```typescript
const { exercises, isLoading, refetch } = useExercises();

// Client-side filtering
const filteredExercises = useMemo(() => {
  return exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || exercise.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
}, [exercises, searchQuery, selectedCategory]);
```

---

## Planned Implementation: Exercise Library Page

### Location
`packages/frontend/src/pages/ExerciseLibrary/ExerciseLibraryPage.tsx` (to be created)

### Features Required
1. **Search Input** - Same as modal ✅ (reuse)
2. **Category Pills** - Same as modal ✅ (reuse)
3. **Type Filter** - NEW (All, Strength, Cardio) ❌
4. **Sort Dropdown** - NEW (Name, Recently Used, Category) ❌
5. **Active Workout Banner** - NEW (conditional, green gradient) ❌
6. **Exercise Cards** - Similar to modal, but with Edit/Delete buttons for custom exercises ⚠️ (adapt)
7. **Virtual Scrolling** - NEW (performance optimization) ❌
8. **Create/Edit/Delete Modals** - Separate modals instead of inline form ⚠️ (adapt)

### State Management (Additional)
```typescript
const [selectedType, setSelectedType] = useState<'all' | 'strength' | 'cardio'>('all');
const [sortBy, setSortBy] = useState<'name' | 'recent' | 'category'>('name');
```

---

## Shared Components to Extract

### 1. **ExerciseSearchBar** Component ✅ HIGH PRIORITY

**Current:** Embedded in ExerciseSelectionModal (lines 353-384)

**Extract to:** `packages/frontend/src/components/ExerciseSearchBar.tsx`

**Props:**
```typescript
interface ExerciseSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
```

**Usage:**
```tsx
// In ExerciseSelectionModal
<ExerciseSearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search exercises..."
/>

// In ExerciseLibraryPage
<ExerciseSearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search exercises..."
/>
```

---

### 2. **CategoryFilter** Component ✅ HIGH PRIORITY

**Current:** Embedded in ExerciseSelectionModal (lines 413-458)

**Extract to:** `packages/frontend/src/components/CategoryFilter.tsx`

**Props:**
```typescript
interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  showLabel?: boolean; // For Exercise Library page header
  showClearAll?: boolean; // For Exercise Library page "Clear All" button
}
```

**Design Notes:**
- Horizontal scrolling pills with 48px height
- Active state: primary-brand background
- Categories: All, Push, Pull, Legs, Core, Cardio

**Usage:**
```tsx
// In ExerciseSelectionModal
<CategoryFilter
  selectedCategory={selectedCategory}
  onCategoryChange={setSelectedCategory}
  showLabel={true}
  showClearAll={false}
/>

// In ExerciseLibraryPage
<CategoryFilter
  selectedCategory={selectedCategory}
  onCategoryChange={setSelectedCategory}
  showLabel={true}
  showClearAll={true}
/>
```

---

### 3. **ExerciseItem / ExerciseCard** Component ⚠️ MEDIUM PRIORITY

**Current:** ExerciseItem in ExerciseSelectionModal (lines 666-713)

**Extract to:** `packages/frontend/src/components/ExerciseCard.tsx`

**Challenge:** Modal needs simple click-to-select, Library page needs complex action buttons

**Solution:** Create flexible component with variants

**Props:**
```typescript
interface ExerciseCardProps {
  exercise: Exercise;
  variant: 'selectable' | 'actionable'; // Modal vs Library page
  onSelect?: () => void; // For modal (click to add)
  onAddToWorkout?: () => void; // For library page
  onEdit?: () => void; // For library page (custom exercises only)
  onDelete?: () => void; // For library page (custom exercises only)
  isDisabled?: boolean;
  isLoading?: boolean;
  showBadges?: boolean; // Show Custom/Strength/Cardio badges
}
```

**Variants:**

1. **Selectable** (for modal):
   - Click anywhere on card to select
   - Hover: blue background, white text
   - No action buttons, just right arrow icon

2. **Actionable** (for library page):
   - Library exercise: Single "Add to Workout" button (full width)
   - Custom exercise: "Add to Workout" button + Edit/Delete icon buttons (2-row layout)
   - Hover: border color changes to primary-brand
   - Badges: Custom, category, type (color-coded)

**Usage:**
```tsx
// In ExerciseSelectionModal
<ExerciseCard
  exercise={exercise}
  variant="selectable"
  onSelect={() => handleSelectExercise(exercise)}
  isDisabled={isAdding}
/>

// In ExerciseLibraryPage (library exercise)
<ExerciseCard
  exercise={exercise}
  variant="actionable"
  onAddToWorkout={() => handleAddToWorkout(exercise)}
  showBadges={true}
/>

// In ExerciseLibraryPage (custom exercise)
<ExerciseCard
  exercise={exercise}
  variant="actionable"
  onAddToWorkout={() => handleAddToWorkout(exercise)}
  onEdit={() => handleEdit(exercise)}
  onDelete={() => handleDelete(exercise)}
  showBadges={true}
/>
```

---

### 4. **CustomExerciseForm** Component ⚠️ MEDIUM PRIORITY

**Current:** Inline form in ExerciseSelectionModal (lines 511-647)

**Extract to:** `packages/frontend/src/components/CustomExerciseForm.tsx`

**Props:**
```typescript
interface CustomExerciseFormProps {
  mode: 'create' | 'edit';
  initialValues?: {
    name: string;
    category: string;
    type: string;
  };
  onSubmit: (values: { name: string; category: string; type: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  submitButtonText?: string;
}
```

**Design Notes:**
- Three fields: name (text input), category (select), type (radio buttons)
- Zod validation (already implemented)
- Form errors display
- Can be used inline (modal) or in a modal (library page)

**Usage:**
```tsx
// In ExerciseSelectionModal (inline)
<CustomExerciseForm
  mode="create"
  onSubmit={handleCreateCustomExercise}
  onCancel={() => setShowCreateForm(false)}
  isLoading={isAdding}
  submitButtonText="Create & Add"
/>

// In CreateExerciseModal (Exercise Library page)
<CustomExerciseForm
  mode="create"
  onSubmit={handleCreate}
  onCancel={onClose}
  isLoading={isCreating}
  submitButtonText="Create"
/>

// In EditExerciseModal (Exercise Library page)
<CustomExerciseForm
  mode="edit"
  initialValues={exercise}
  onSubmit={handleEdit}
  onCancel={onClose}
  isLoading={isUpdating}
  submitButtonText="Save Changes"
/>
```

---

### 5. **Validation Constants** ✅ HIGH PRIORITY

**Current:** Duplicated in ExerciseSelectionModal (lines 37-51)

**Extract to:** `packages/frontend/src/utils/exerciseValidation.ts`

**Reason:** Currently duplicated due to Vite/CommonJS compatibility issue with `@fitness-tracker/shared/validators`

**Contents:**
```typescript
import { z } from 'zod';

export const EXERCISE_CATEGORIES = ['Push', 'Pull', 'Legs', 'Core', 'Cardio'] as const;
export const EXERCISE_TYPES = ['strength', 'cardio'] as const;

export const createExerciseSchema = z.object({
  name: z.string()
    .min(1, { message: 'Exercise name is required' })
    .max(100, { message: 'Exercise name must be 100 characters or less' })
    .transform((val) => val.trim()),
  category: z.enum(EXERCISE_CATEGORIES, {
    errorMap: () => ({ message: 'Category must be one of: Push, Pull, Legs, Core, Cardio' }),
  }),
  type: z.enum(EXERCISE_TYPES, {
    errorMap: () => ({ message: 'Type must be either strength or cardio' }),
  }),
});

export type CreateExerciseInput = z.infer<typeof createExerciseSchema>;
```

**Usage:**
```typescript
import { EXERCISE_CATEGORIES, EXERCISE_TYPES, createExerciseSchema } from '../utils/exerciseValidation';
```

---

## Shared Utilities to Create

### 1. **filterExercises** Utility ✅ HIGH PRIORITY

**Create:** `packages/frontend/src/utils/filterExercises.ts`

**Purpose:** Centralize filtering logic for exercises

```typescript
import { Exercise } from '@fitness-tracker/shared';

export interface ExerciseFilters {
  search?: string;
  category?: string; // 'All' or category name
  type?: 'all' | 'strength' | 'cardio';
}

export function filterExercises(exercises: Exercise[], filters: ExerciseFilters): Exercise[] {
  return exercises.filter((exercise) => {
    // Search filter
    const matchesSearch = !filters.search ||
      exercise.name.toLowerCase().includes(filters.search.toLowerCase());

    // Category filter
    const matchesCategory = !filters.category ||
      filters.category === 'All' ||
      exercise.category === filters.category;

    // Type filter
    const matchesType = !filters.type ||
      filters.type === 'all' ||
      exercise.type === filters.type;

    return matchesSearch && matchesCategory && matchesType;
  });
}
```

**Usage:**
```tsx
// In ExerciseSelectionModal
const filteredExercises = useMemo(() => {
  return filterExercises(exercises, {
    search: searchQuery,
    category: selectedCategory,
  });
}, [exercises, searchQuery, selectedCategory]);

// In ExerciseLibraryPage
const filteredExercises = useMemo(() => {
  return filterExercises(exercises, {
    search: searchQuery,
    category: selectedCategory,
    type: selectedType,
  });
}, [exercises, searchQuery, selectedCategory, selectedType]);
```

---

### 2. **sortExercises** Utility ✅ MEDIUM PRIORITY

**Create:** `packages/frontend/src/utils/sortExercises.ts`

**Purpose:** Centralize sorting logic for Exercise Library page

```typescript
import { Exercise } from '@fitness-tracker/shared';

export type ExerciseSortBy = 'name' | 'recent' | 'category';

export function sortExercises(
  exercises: Exercise[],
  sortBy: ExerciseSortBy,
  recentExerciseIds?: string[]
): Exercise[] {
  const sorted = [...exercises];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));

    case 'recent':
      if (!recentExerciseIds) return sorted;
      return sorted.sort((a, b) => {
        const aIndex = recentExerciseIds.indexOf(a.id);
        const bIndex = recentExerciseIds.indexOf(b.id);
        // Recently used exercises first
        if (aIndex !== -1 && bIndex === -1) return -1;
        if (aIndex === -1 && bIndex !== -1) return 1;
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        // Then alphabetical
        return a.name.localeCompare(b.name);
      });

    case 'category':
      const categoryOrder = ['Push', 'Pull', 'Legs', 'Core', 'Cardio'];
      return sorted.sort((a, b) => {
        const catA = categoryOrder.indexOf(a.category);
        const catB = categoryOrder.indexOf(b.category);
        if (catA !== catB) return catA - catB;
        // Within category, alphabetical by name
        return a.name.localeCompare(b.name);
      });

    default:
      return sorted;
  }
}
```

---

### 3. **recentExercisesManager** Utility ✅ LOW PRIORITY

**Create:** `packages/frontend/src/utils/recentExercisesManager.ts`

**Purpose:** Centralize localStorage management for recent exercises

```typescript
const RECENT_EXERCISES_KEY = 'fitness-tracker:recent-exercises';
const MAX_RECENT_EXERCISES = 10;

export function getRecentExerciseIds(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_EXERCISES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load recent exercises:', error);
    localStorage.removeItem(RECENT_EXERCISES_KEY);
    return [];
  }
}

export function addRecentExerciseId(exerciseId: string): void {
  try {
    const current = getRecentExerciseIds();
    // Move to front, remove duplicates, limit to MAX_RECENT_EXERCISES
    const updated = [exerciseId, ...current.filter((id) => id !== exerciseId)]
      .slice(0, MAX_RECENT_EXERCISES);
    localStorage.setItem(RECENT_EXERCISES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recent exercise:', error);
    localStorage.removeItem(RECENT_EXERCISES_KEY);
  }
}

export function clearRecentExercises(): void {
  localStorage.removeItem(RECENT_EXERCISES_KEY);
}
```

**Usage:**
```tsx
import { getRecentExerciseIds, addRecentExerciseId } from '../utils/recentExercisesManager';

// Load on mount
const [recentExerciseIds, setRecentExerciseIds] = useState<string[]>(() => getRecentExerciseIds());

// Add to recent
const handleSelectExercise = async (exercise: Exercise) => {
  // ... add to workout logic
  addRecentExerciseId(exercise.id);
  setRecentExerciseIds(getRecentExerciseIds()); // Refresh state
};
```

---

## New Components for Exercise Library Page Only

### 1. **TypeFilter** Component ❌ NEW

**Create:** `packages/frontend/src/components/TypeFilter.tsx`

**Purpose:** 3-button segmented control for filtering by exercise type

**Props:**
```typescript
interface TypeFilterProps {
  selectedType: 'all' | 'strength' | 'cardio';
  onTypeChange: (type: 'all' | 'strength' | 'cardio') => void;
}
```

**Design:** Segmented control with 3 equal-width buttons (All, Strength, Cardio)

---

### 2. **ActiveWorkoutBanner** Component ❌ NEW

**Create:** `packages/frontend/src/components/ActiveWorkoutBanner.tsx`

**Purpose:** Show active workout info at top of Exercise Library page

**Props:**
```typescript
interface ActiveWorkoutBannerProps {
  workoutName: string;
  duration: string; // e.g., "23:45"
  onQuickAdd: () => void; // Opens ExerciseSelectionModal
}
```

**Design:** Green gradient background, workout info, "Quick Add" button

---

### 3. **CreateExerciseModal** / **EditExerciseModal** / **DeleteConfirmationModal** ❌ NEW

**Create:**
- `packages/frontend/src/components/CreateExerciseModal.tsx`
- `packages/frontend/src/components/EditExerciseModal.tsx`
- `packages/frontend/src/components/DeleteConfirmationModal.tsx`

**Design:** Bottom sheet modals (CreateExerciseModal, EditExerciseModal) or standard dialog (DeleteConfirmationModal)

**Uses:** `CustomExerciseForm` component (extracted from ExerciseSelectionModal)

---

## Hooks - Already Complete ✅

### useExercises Hook
**Location:** `packages/frontend/src/hooks/useExercises.ts`

**Status:** ✅ Complete and ready to use

**Features:**
- Fetches all exercises (library + custom) via SWR
- 1-minute caching with deduplication
- No revalidation on focus/reconnect (exercises rarely change)
- Helper functions: `useExercisesByCategory`, `useExerciseSearch`

**No changes needed** - Works perfectly for both modal and page

---

## Implementation Strategy

### Phase 1: Extract Shared Components (1-2 days)

**Priority Order:**
1. ✅ **ExerciseSearchBar** - Simple, used in both
2. ✅ **CategoryFilter** - Simple, used in both
3. ✅ **Validation Constants** - Extract to utils
4. ✅ **filterExercises** utility - Centralize logic
5. ⚠️ **ExerciseCard** - Requires thoughtful design for two variants
6. ⚠️ **CustomExerciseForm** - Extract and make reusable

**Refactor:** Update ExerciseSelectionModal to use extracted components

**Test:** Ensure ExerciseSelectionModal still works after refactoring

---

### Phase 2: Create Exercise Library Page (2-3 days)

**Build new components:**
1. TypeFilter
2. ActiveWorkoutBanner
3. CreateExerciseModal, EditExerciseModal, DeleteConfirmationModal
4. ExerciseLibraryPage (main page)

**Reuse extracted components:**
- ExerciseSearchBar
- CategoryFilter
- ExerciseCard (variant="actionable")
- CustomExerciseForm (in modals)
- useExercises hook

**Add new utilities:**
- sortExercises
- recentExercisesManager (optional - can reuse existing localStorage code)

---

### Phase 3: Integration & Testing (1 day)

**Tasks:**
1. Add Exercise Library route to React Router
2. Add "Exercises" tab to BottomNav
3. Test filtering, sorting, search
4. Test CRUD operations for custom exercises
5. Test Add to Workout functionality
6. Test keyboard navigation and accessibility

---

## Potential Issues & Solutions

### Issue 1: Vite/CommonJS Compatibility

**Problem:** Cannot import from `@fitness-tracker/shared/validators` due to CommonJS issue

**Current Workaround:** Validation constants duplicated in ExerciseSelectionModal

**Solution:** Extract to `src/utils/exerciseValidation.ts` as single source of truth for frontend

**Long-term Fix:** Convert shared package to ESM (tracked in Phase 4 technical debt)

---

### Issue 2: ExerciseCard Component Complexity

**Problem:** Modal needs simple selectable card, Library page needs complex actionable card

**Solution:** Use `variant` prop with two distinct rendering modes

**Alternative:** Create two separate components (`ExerciseSelectableCard`, `ExerciseActionableCard`)
- **Pros:** Simpler, more explicit
- **Cons:** Code duplication for shared UI (name, category, badges)

**Recommendation:** Single component with variants (more maintainable)

---

### Issue 3: Recent Exercises Tracking

**Problem:** Both modal and page track recent exercises, could diverge

**Solution:** Centralize in `recentExercisesManager` utility

**Benefit:** Consistent recent exercises across modal and page

---

## Benefits of Shared Components

1. **DRY Principle:** Reduce code duplication by ~300-400 lines
2. **Consistency:** Identical UI/UX for search, filters, forms
3. **Maintainability:** Bug fixes and improvements apply to both features
4. **Testing:** Test shared components once, benefit everywhere
5. **Performance:** Shared bundle size, no duplicate code shipped to browser

---

## Estimated Code Savings

| Component | Current Lines (Modal) | Extracted Lines | Savings in Library Page |
|-----------|----------------------|-----------------|------------------------|
| ExerciseSearchBar | ~32 | ~40 | ~32 lines |
| CategoryFilter | ~46 | ~60 | ~46 lines |
| ExerciseCard | ~48 | ~120 (with variants) | ~100 lines |
| CustomExerciseForm | ~137 | ~150 | ~137 lines |
| Validation Constants | ~15 | ~20 | ~15 lines |
| filterExercises utility | N/A (inline) | ~30 | ~20 lines |
| **Total** | **~278 lines** | **~420 lines** | **~350 lines saved** |

**Net Result:** By extracting ~420 lines to shared components, we save ~350 lines in Exercise Library page implementation, and improve maintainability significantly.

---

## Updated TODO.md Tasks

### Update Phase 4 Implementation Plan:

**Add before "Create Exercise Library page structure":**

```markdown
### Refactor: Extract Shared Components from ExerciseSelectionModal

- [ ] **Extract ExerciseSearchBar component** [@frontend-typescript-dev]
  - Extract search input from ExerciseSelectionModal (lines 353-384)
  - Create `components/ExerciseSearchBar.tsx` with props for value, onChange, placeholder
  - Update ExerciseSelectionModal to use extracted component
  - Test that modal still works

- [ ] **Extract CategoryFilter component** [@frontend-typescript-dev]
  - Extract category pills from ExerciseSelectionModal (lines 413-458)
  - Create `components/CategoryFilter.tsx` with props for selectedCategory, onCategoryChange, showLabel, showClearAll
  - Update ExerciseSelectionModal to use extracted component
  - Test horizontal scrolling, active states

- [ ] **Extract validation constants to shared utility** [@frontend-typescript-dev]
  - Create `utils/exerciseValidation.ts`
  - Move EXERCISE_CATEGORIES, EXERCISE_TYPES, createExerciseSchema from modal
  - Update ExerciseSelectionModal to import from utility
  - Remove duplication, single source of truth

- [ ] **Create filterExercises utility** [@frontend-typescript-dev]
  - Create `utils/filterExercises.ts`
  - Implement filtering logic for search, category, type
  - Update ExerciseSelectionModal to use utility
  - Prepare for Exercise Library page usage

- [ ] **Extract ExerciseCard component with variants** [@frontend-typescript-dev]
  - Create `components/ExerciseCard.tsx`
  - Implement 'selectable' variant (for modal - click to select)
  - Implement 'actionable' variant (for library page - action buttons)
  - Support badges (Custom, category, type with color coding)
  - Update ExerciseSelectionModal to use ExerciseCard with variant="selectable"
  - Test hover states, disabled states

- [ ] **Extract CustomExerciseForm component** [@frontend-typescript-dev]
  - Create `components/CustomExerciseForm.tsx`
  - Support 'create' and 'edit' modes
  - Support initialValues prop for edit mode
  - Update ExerciseSelectionModal to use extracted form
  - Test validation, form submission
```

---

## Conclusion

The Exercise Library page can leverage ~60% of the ExerciseSelectionModal's existing implementation through shared components. By extracting 5-6 components and 2-3 utilities, we'll achieve:

- ✅ Consistent UI/UX across modal and page
- ✅ DRY codebase with ~350 lines saved
- ✅ Easier maintenance and testing
- ✅ Faster Exercise Library implementation (2-3 days vs 4-5 days)

**Recommendation:** Proceed with extraction strategy before building Exercise Library page.
