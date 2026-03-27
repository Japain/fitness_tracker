# UI Polish — Design Spec

**Date:** 2026-03-23
**Branch:** `uiPolish`
**Status:** Approved for implementation

## Scope

Four areas of UI polish for the fitness tracker frontend:

1. Empty states — Dashboard and Exercise Library
2. ActiveWorkout skeleton screen
3. Micro-animations — buttons, cards, modals
4. Accessibility fixes — contextual labels, icon aria-hidden, modal focus

Accessibility (item 4) was added to the original Phase 6 scope during brainstorming.

---

## 1. Empty States

### 1a. Dashboard — Recent Workouts (`packages/frontend/src/pages/Dashboard.tsx:263`)

**Trigger:** `recentWorkouts.length === 0` after loading completes (condition at line 254).

**Current:** Plain `<Text>` — "No workouts yet. Start your first workout!" inside a white border box.

**New design:** Minimal style — same outer `Box` (white bg, `border="1px solid"`, `borderColor="neutral.200"`, `borderRadius="md"`, `p="xl"`, `textAlign="center"`), containing:
- Dumbbell SVG icon (24×24px, `color="neutral.400"`, `aria-hidden="true"`)
- Heading: "No workouts yet" (`fontSize="sm"`, `fontWeight="semibold"`, `color="neutral.700"`, `mt="sm"`)
- Subtext: `Hit "Start New Workout" above to begin.` (`fontSize="xs"`, `color="neutral.500"`, `mt="xs"`)
- No CTA button — the primary "Start New Workout" button is already at the top of the page

### 1b. Exercise Library — No Results (`packages/frontend/src/pages/ExerciseLibrary/ExerciseLibraryPage.tsx:319`)

**Trigger:** `filteredAndSortedExercises.length === 0` when filters are active.

**Current:** `<Text color="neutral.600" textAlign="center" py="xl">No exercises found. Try adjusting your filters.</Text>`

**New design:** Same minimal style as 1a, inside a `Box` with `bg="white"`, `border="1px solid"`, `borderColor="neutral.200"`, `borderRadius="md"`, `p="xl"`, `textAlign="center"`:
- Search/magnifier SVG icon (24×24px, `color="neutral.400"`, `aria-hidden="true"`)
- Heading: "No exercises found" (`fontSize="sm"`, `fontWeight="semibold"`, `color="neutral.700"`, `mt="sm"`)
- Subtext line: `Try a different search or` + inline `<Button variant="link" size="sm" colorScheme="primary" onClick={handleClearFilters}>clear filters</Button>`

**`handleClearFilters` does not yet exist** — create it in `ExerciseLibraryPage` to reset all three filter state values to their defaults:
```tsx
const handleClearFilters = () => {
  setSearchQuery('');
  setSelectedCategory('All');
  setSelectedType('all');
};
```
The exact state setter names and default values must be confirmed against the actual state declarations in `ExerciseLibraryPage.tsx`.

---

## 2. ActiveWorkout Skeleton Screen (`packages/frontend/src/pages/ActiveWorkout.tsx:125-131`)

**Current:** `<Center h="50vh"><Spinner size="xl" color="primary.500" thickness="4px" /></Center>`

**New:** Replace with a page-structure skeleton mirroring the scrollable page body. Uses `Skeleton` and `SkeletonText` from Chakra UI — add to the import block.

**Note:** The Finish Workout and Add Exercise buttons live in a fixed bottom bar (always rendered), not in the scrollable content area. The skeleton only needs to represent the page title/timer area and one exercise card. Do not add skeleton placeholders for the bottom bar.

**Structure:**

```
Box (p="xl", maxW="600px", mx="auto", w="full")
├── Skeleton — workout title    (h="32px", w="180px", borderRadius="md")
├── Skeleton — timer line       (h="20px", w="120px", mt="xs", borderRadius="md")
└── Box (mt="2xl") — one exercise card skeleton
    └── Box (bg="white", border="1px solid", borderColor="neutral.200",
             borderRadius="md", p="lg", boxShadow="sm")
        ├── HStack (justify="space-between")
        │   ├── Skeleton — exercise name   (h="24px", w="160px")
        │   └── Skeleton — action icons   (h="24px", w="64px")
        ├── Skeleton — category badge     (h="18px", w="60px", mt="sm")
        └── SkeletonText — set rows       (noOfLines={3}, spacing="3", mt="md")
```

No new component needed. Inline Skeleton/SkeletonText in the existing conditional block.

---

## 3. Micro-animations

No animation library required. All effects use Chakra UI's `transition` prop and `_hover` / `_active` style props.

### 3a. Primary button lift — theme-level (`packages/frontend/src/theme/index.ts`)

The existing `solid` variant already defines `_hover: { bg: 'primary.600' }`. Merge `transform` and `boxShadow` into the existing `_hover` block — Chakra's deep merge will combine them correctly:

```ts
Button: {
  variants: {
    solid: {
      transition: 'all 150ms ease-in-out',
      _hover: {
        transform: 'translateY(-1px)',
        boxShadow: 'md',
        // existing bg: 'primary.600' remains via deep merge
      },
      _active: {
        transform: 'translateY(0)',
        boxShadow: 'sm',
      },
    },
  },
},
```

**Remove the manual `_hover` from "Start New Workout" in `Dashboard.tsx` (lines 190–194).** The manual version uses `boxShadow: 'lg'` — the theme default of `boxShadow: 'md'` is intentionally slightly more restrained and will apply consistently across all primary buttons.

### 3b. Card hover effects

**WorkoutCard and ExerciseListItem already have correct hover effects** (`transition`, `borderColor: 'primary.500'`, `boxShadow: 'md'`, `cursor: 'pointer'`). No changes needed to these. Verify during implementation that both Dashboard and WorkoutHistory workout cards are consistent.

**StatCard (`Dashboard.tsx`, inline component)** — the only card needing hover added. It is not clickable, so apply only a subtle tactile effect:
- Add `transition="all 150ms ease-in-out"` to the outer `Box`
- Add `_hover={{ boxShadow: 'sm' }}`

### 3c. Modal slide-up

Add `motionPreset="slideInBottom"` to the `<Modal>` element. `ExerciseSelectionModal`, `CreateExerciseModal`, and `EditExerciseModal` **already have this** — do not change them.

**Files that need the change (4 total):**
- `packages/frontend/src/components/DeleteConfirmationModal.tsx`
- `packages/frontend/src/components/ExerciseCard.tsx` (notes modal — inline `<Modal>`)
- `packages/frontend/src/pages/ActiveWorkout.tsx` (workout notes modal — inline `<Modal>`)
- `packages/frontend/src/pages/Dashboard.tsx` (conflict modal — inline `<Modal>`)

### 3d. Checkbox animation

Chakra UI's `Checkbox` component already transitions the checkmark via built-in CSS. No code changes needed. Verify visually in the running app (`SetRow` component).

---

## 4. Accessibility Fixes

### 4a. Contextual aria-labels on icon buttons (HIGH IMPACT)

Icon-only buttons use generic labels that don't identify which item they act on. Screen readers announce multiple identical "Delete exercise" buttons with no way to distinguish them.

**Changes:**

| File | Current label | New label |
|---|---|---|
| `ExerciseCard.tsx:236` | `"Edit exercise notes"` | `` `Edit notes for ${exercise.name}` `` |
| `ExerciseCard.tsx:260` | `"Delete exercise"` | `` `Delete ${exercise.name}` `` |
| `ExerciseListItem.tsx:194` | `"Delete exercise"` | `` `Delete ${exercise.name}` `` |

The `exercise` object is already in scope at all three locations.

### 4b. Logo icon aria-hidden (LOW IMPACT)

Logo icons in `TopNav.tsx` and `AuthPage.tsx` have `aria-label` on the `<Icon>` element. Decorative SVGs should be hidden from the accessibility tree.

**TopNav.tsx:**
- The logo icon and "FitTrack" text are currently inside a `<Flex>` with no link wrapper. Wrap the entire logo section in `<Box as={Link} to="/" aria-label="FitTrack home" ...>` to make it a navigable landmark.
- Add `import { Link } from 'react-router-dom'` to `TopNav.tsx` — this import does not currently exist in the file.
- Add `aria-hidden="true"` to the `<Icon>` and remove its `aria-label`.
- The visible "FitTrack" text beside the icon already provides a label, so `aria-label` on the link is a fallback for icon-only contexts — include it for robustness.

**AuthPage.tsx:**
- Remove `aria-label="FitTrack Logo"` from `<Icon>`
- Add `aria-hidden="true"` to `<Icon>`
- No link wrapper needed here — the icon is purely decorative on the login screen

### 4c. `initialFocusRef` on create/edit modals (MEDIUM IMPACT)

When `CreateExerciseModal` and `EditExerciseModal` open, focus should land on the exercise name input immediately.

The name `Input` is rendered inside `CustomExerciseForm` (a child component), so a ref must be threaded through:

**`CustomExerciseForm.tsx`:**
- Add an optional `nameInputRef?: React.RefObject<HTMLInputElement>` prop
- Pass it to the name `<Input ref={nameInputRef} ...>`

**`CreateExerciseModal.tsx` and `EditExerciseModal.tsx`:**
```tsx
const nameInputRef = useRef<HTMLInputElement>(null);

<Modal initialFocusRef={nameInputRef} ...>
  ...
  <CustomExerciseForm nameInputRef={nameInputRef} ... />
```

---

## 5. Verification Plan

After implementation, run the following checks before marking tasks complete:

| Change | Verification method |
|---|---|
| Empty states | Exercise Library: type `zzzzzz` in search. Dashboard: temporarily hardcode `recentWorkouts = []` |
| Skeleton screen | Chrome DevTools → Network → Slow 3G throttle → navigate to `/workout/:id` |
| Animations | Run app, hover buttons/cards, open modals — visual check |
| Checkbox animation | Open active workout, check/uncheck a set — visual check |
| Contextual aria-labels | Chrome DevTools → Elements → Accessibility tab → click each icon button, verify computed name includes exercise name |
| Logo aria-hidden | Same DevTools panel — verify logo icon shows `role: none` |
| Modal focus | Playwright `browser_snapshot` after implementation to dump accessibility tree and confirm `initialFocusRef` targets |

Playwright `browser_snapshot` is used as the sign-off step for accessibility — run it against the live dev app after all changes are in, review the output for any unexpected labels or missing roles before manual pass.
