# Fitness Tracker - UI Mockups

**Version:** 1.0
**Created:** 2025-11-24
**Status:** Ready for Implementation

---

## Overview

This directory contains comprehensive UI mockups for the Fitness Tracker mobile-first web application. All designs are optimized for the <30 second workout logging goal and meet WCAG 2.1 Level AA accessibility standards.

---

## Contents

### HTML Mockups (`/html`)

Interactive HTML mockups with inline CSS. Open directly in browser for pixel-perfect reference.

| File | Screen | Purpose |
|------|--------|---------|
| `01-dashboard-home.html` | Dashboard / Home | Primary landing screen with "Start Workout" CTA, weekly stats, and recent workouts |
| `02-active-workout.html` | Active Workout Logging | Real-time workout logging interface with exercise cards and set inputs |
| `03-exercise-selection.html` | Exercise Selection Modal | Three-tier exercise selection (Recent → Categories → Search) |
| `04-workout-history.html` | Workout History List | Chronological list of completed workouts with monthly stats |
| `05-workout-detail.html` | Workout Detail View | Read-only view of completed workout with full exercise details |
| `06-authentication.html` | Authentication / Login | OAuth sign-in screen with Google authentication |

### Screenshots (`/screenshots`)

Mobile viewport (375×667px) screenshots of each mockup for quick visual reference.

- `01-dashboard-home-v1.png`
- `02-active-workout-v1.png`
- `03-exercise-selection-v1.png`
- `04-workout-history-v1.png`
- `05-workout-detail-v1.png`
- `06-authentication-v1.png`

### Documentation

- **`DESIGN-DOCUMENTATION.md`**: Complete design specification with:
  - Design system (colors, typography, spacing, components)
  - Screen-by-screen specifications
  - Component library reference
  - Responsive behavior guidelines
  - Accessibility compliance checklist
  - Implementation guidelines for React/Chakra UI

---

## Key Design Principles

### 1. Mobile-First
- Designed at 375×667px viewport (iPhone SE)
- Single-column layouts throughout
- Thumb-zone optimized (bottom navigation, fixed CTAs)
- All touch targets ≥44×44px (most are 48-56px)

### 2. Speed-Optimized
- Prominent primary CTAs
- Smart defaults (current time, 3 sets/10 reps)
- Progressive disclosure (show only what's needed)
- Minimal steps from start to finish

### 3. Accessibility (WCAG 2.1 AA)
- Color contrast ratios: 4.5:1 minimum for text
- Touch targets: 44×44px minimum
- Keyboard navigation: All interactive elements focusable
- Screen reader compatible: Semantic HTML structure

### 4. Consistency
- Unified design system (colors, typography, spacing)
- Reusable component patterns
- Predictable layouts across screens

---

## Design System Quick Reference

### Colors

**Primary Brand**: `#3B82F6` (Blue)

**Neutrals**: 7-step scale from `#0F172A` (darkest) to `#F8FAFC` (lightest)

**Semantic**:
- Success: `#10B981` (green)
- Error: `#EF4444` (red)
- Warning: `#F59E0B` (amber)

### Typography

**Font**: System font stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter')

**Sizes**: 28px (h1) → 24px (h2) → 20px (h3) → 18px (large) → 16px (body) → 14px (small) → 12px (caption)

**Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

### Spacing

**Base unit**: 8px

**Scale**: 4px (xs) → 8px (sm) → 12px (md) → 16px (lg) → 24px (xl) → 32px (2xl) → 48px (3xl)

### Components

- **Buttons**: Primary (blue), Secondary (gray), Icon-only
- **Inputs**: Text, Number, Search
- **Cards**: Standard white card with border
- **Navigation**: Bottom nav (mobile), Top nav (headers)
- **Badges/Pills**: Status indicators, category filters

---

## User Flows

### 1. New User Sign-Up & First Workout
```
Authentication → Dashboard → Start Workout → Add Exercise (search/select) →
Enter Sets/Reps/Weight → Add more exercises → Finish Workout → View Summary
```

**Target Time**: <30 seconds (workout logging only)

### 2. Returning User - Quick Workout
```
Dashboard → Resume In-Progress Workout (if exists) OR Start New Workout →
Add Exercises (Recent picks) → Log Sets → Finish
```

### 3. View Workout History
```
Dashboard → History (bottom nav) → Select Workout → View Details → Back to History
```

---

## Implementation Notes

### Technology Stack
- **Framework**: React + TypeScript + Vite
- **UI Library**: Chakra UI (recommended per project research)
- **Mobile Viewport**: 375×667px primary target
- **Breakpoints**: Mobile (320-767px), Tablet (768-1023px), Desktop (1024px+)

### Component Mapping

| Mockup Element | Chakra Component | Notes |
|----------------|------------------|-------|
| Primary Button | `<Button colorScheme="blue" size="lg">` | Height 56px |
| Card | `<Box bg="white" borderWidth="1px" borderRadius="md">` | Padding 16px |
| Input | `<Input size="md" />` | Height 44px minimum |
| Search | `<InputGroup>` with `<InputLeftElement>` | Icon left-aligned |
| Bottom Nav | Custom component with `<HStack>` | Sticky bottom |
| Modal | `<Modal>` with `placement="bottom"` for mobile | Slide-up animation |

### Development Workflow

1. **Setup**: Configure Chakra UI theme with design tokens from DESIGN-DOCUMENTATION.md
2. **Components**: Build UI component library (Button, Input, Card, etc.)
3. **Layouts**: Create layout components (BottomNav, TopNav, PageContainer)
4. **Features**: Implement feature screens (Auth → Dashboard → Workout → History)
5. **Testing**: Lighthouse mobile audit (target: >90%), accessibility testing, user flow validation

---

## Design Validation

### ✅ Design Principles Checklist (from DESIGN-PRINCIPLES.md)

**Section I: Core Philosophy**
- [x] Users First
- [x] Speed & Performance
- [x] Simplicity & Clarity
- [x] Accessibility (WCAG AA)

**Section II: Design System**
- [x] Color palette defined & validated
- [x] Typography scale established
- [x] Spacing system (8px base)
- [x] Component library designed

**Section III: Layout & Hierarchy**
- [x] Mobile-first responsive grid
- [x] Strategic white space
- [x] Clear visual hierarchy

**Section IV: Interactions**
- [x] Purposeful micro-interactions
- [x] Immediate feedback (hover/focus states)
- [x] Quick animations (150-300ms)

### Accessibility Compliance

- [x] Color contrast: All combinations ≥4.5:1 (WCAG AA)
- [x] Touch targets: All interactive elements ≥44×44px
- [x] Keyboard navigation: All elements focusable, logical tab order
- [x] Focus indicators: Visible 3px outline on all interactive elements
- [x] Semantic HTML: Proper heading hierarchy (h1 → h2 → h3)

### Performance Targets

- [x] System fonts (no web font downloads)
- [x] Minimal animations (CSS only, no heavy JS)
- [x] Optimized for 3G networks
- [x] Lighthouse mobile usability: Target >90%

---

## Key Design Decisions & Rationale

### 1. Three-Tier Exercise Selection Pattern
**Decision**: Recent exercises → Category pills → Search
**Rationale**: UX research shows users prefer quick access to frequent actions. Recent exercises provide fastest path (0 scrolling), categories enable exploration, search serves as backup.

### 2. Fixed Bottom Actions
**Decision**: Primary CTAs (Add Exercise, Finish) fixed at bottom of active workout screen
**Rationale**: Thumb-zone optimization for one-handed mobile use. Always visible regardless of scroll position.

### 3. Card-Based Layouts
**Decision**: All content (workouts, exercises, stats) uses white card on light gray background
**Rationale**: Mobile scannability, clear visual grouping, consistent with modern mobile UI patterns.

### 4. Progressive Disclosure
**Decision**: Show only relevant information at each step (e.g., active workout shows only current exercises, not full history)
**Rationale**: Reduces cognitive load, faster task completion, cleaner mobile screens.

### 5. System Font Stack
**Decision**: Use -apple-system, BlinkMacSystemFont instead of web fonts
**Rationale**: Instant rendering (no font download), smaller bundle size, native feel, better performance on mobile networks.

---

## Testing Requirements

### Pre-Launch Checklist

**Mobile Usability**
- [ ] Test at 375px viewport (iPhone SE)
- [ ] Test at 414px viewport (iPhone 12/13)
- [ ] Test at 360px viewport (Android standard)
- [ ] Lighthouse mobile score >90%
- [ ] All touch targets ≥44×44px verified

**Accessibility**
- [ ] Screen reader testing (VoiceOver on iOS, TalkBack on Android)
- [ ] Keyboard navigation (tab through entire app, no traps)
- [ ] Color contrast validation (axe DevTools, no violations)
- [ ] Focus indicators visible and meet 3:1 contrast ratio
- [ ] Form labels properly associated with inputs

**Performance**
- [ ] Page load time <3 seconds on 3G
- [ ] Time to Interactive (TTI) <5 seconds
- [ ] First Contentful Paint (FCP) <2 seconds
- [ ] Workout logging time <30 seconds (user testing)

**Cross-Browser**
- [ ] Chrome (Android)
- [ ] Safari (iOS)
- [ ] Chrome (Desktop)
- [ ] Firefox (Desktop)

---

## Next Steps

1. **Review**: Stakeholder review of mockups and documentation
2. **Setup**: Initialize Chakra UI theme with design tokens
3. **Build**: Implement component library and layout components
4. **Test**: User testing with 5-10 target users on mobile devices
5. **Iterate**: Refine based on testing feedback

---

## Resources

- **Design Principles**: `fitness_tracker/context/DESIGN-PRINCIPLES.md`
- **Project Requirements**: `fitness_tracker/PROJECT_REQUIREMENTS.md`
- **Chakra UI Documentation**: https://chakra-ui.com/docs
- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

---

## Questions or Feedback?

For questions about these designs or to request iterations, please reference:
- **Mockup file names** (e.g., "01-dashboard-home.html")
- **Specific screen sections** (e.g., "Bottom navigation on Dashboard")
- **Design system elements** (e.g., "Primary button hover state")

---

**Version History**
- v1.0 (2025-11-24): Initial design system and 6 core screens
