/**
 * Prisma Database Seed Script
 * Seeds the Exercise library with 60 pre-defined exercises
 * Reference: PROJECT_REQUIREMENTS.md lines 310-399
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ExerciseData {
  name: string;
  category: string;
  type: 'strength' | 'cardio';
}

const exercises: ExerciseData[] = [
  // ============================================================================
  // PUSH CATEGORY (Chest, Shoulders, Triceps) - 21 exercises
  // ============================================================================

  // Compound Push Exercises
  { name: 'Barbell Bench Press', category: 'Push', type: 'strength' },
  { name: 'Incline Barbell Bench Press', category: 'Push', type: 'strength' },
  { name: 'Decline Bench Press', category: 'Push', type: 'strength' },
  { name: 'Close-Grip Bench Press', category: 'Push', type: 'strength' },
  { name: 'Barbell Overhead Press', category: 'Push', type: 'strength' },
  { name: 'Push Press', category: 'Push', type: 'strength' },
  { name: 'Dips', category: 'Push', type: 'strength' },

  // Dumbbell Push Exercises
  { name: 'Dumbbell Bench Press', category: 'Push', type: 'strength' },
  { name: 'Incline Dumbbell Press', category: 'Push', type: 'strength' },
  { name: 'Dumbbell Overhead Press', category: 'Push', type: 'strength' },
  { name: 'Dumbbell Shoulder Press', category: 'Push', type: 'strength' },
  { name: 'Dumbbell Chest Fly', category: 'Push', type: 'strength' },

  // Push Isolation Exercises
  { name: 'Lateral Raise', category: 'Push', type: 'strength' },
  { name: 'Front Raise', category: 'Push', type: 'strength' },
  { name: 'Cable Fly', category: 'Push', type: 'strength' },
  { name: 'Tricep Pushdown', category: 'Push', type: 'strength' },
  { name: 'Overhead Tricep Extension', category: 'Push', type: 'strength' },
  { name: 'Skull Crusher', category: 'Push', type: 'strength' },

  // Bodyweight Push Exercises
  { name: 'Push-ups', category: 'Push', type: 'strength' },
  { name: 'Diamond Push-ups', category: 'Push', type: 'strength' },
  { name: 'Pike Push-ups', category: 'Push', type: 'strength' },

  // ============================================================================
  // PULL CATEGORY (Back, Biceps) - 18 exercises
  // ============================================================================

  // Compound Pull Exercises
  { name: 'Deadlift', category: 'Pull', type: 'strength' },
  { name: 'Romanian Deadlift', category: 'Pull', type: 'strength' },
  { name: 'Barbell Row', category: 'Pull', type: 'strength' },
  { name: 'T-Bar Row', category: 'Pull', type: 'strength' },
  { name: 'Pull-ups', category: 'Pull', type: 'strength' },
  { name: 'Chin-ups', category: 'Pull', type: 'strength' },

  // Dumbbell Pull Exercises
  { name: 'Dumbbell Row', category: 'Pull', type: 'strength' },
  { name: 'Dumbbell Romanian Deadlift', category: 'Pull', type: 'strength' },
  { name: 'Dumbbell Pullover', category: 'Pull', type: 'strength' },
  { name: 'Dumbbell Shrugs', category: 'Pull', type: 'strength' },

  // Pull Isolation Exercises
  { name: 'Barbell Bicep Curl', category: 'Pull', type: 'strength' },
  { name: 'Dumbbell Bicep Curl', category: 'Pull', type: 'strength' },
  { name: 'Hammer Curl', category: 'Pull', type: 'strength' },
  { name: 'Concentration Curl', category: 'Pull', type: 'strength' },
  { name: 'Preacher Curl', category: 'Pull', type: 'strength' },
  { name: 'Cable Curl', category: 'Pull', type: 'strength' },
  { name: 'Face Pull', category: 'Pull', type: 'strength' },
  { name: 'Rear Delt Fly', category: 'Pull', type: 'strength' },

  // ============================================================================
  // LEGS CATEGORY (Quads, Hamstrings, Glutes, Calves) - 15 exercises
  // ============================================================================

  // Compound Leg Exercises
  { name: 'Barbell Back Squat', category: 'Legs', type: 'strength' },
  { name: 'Front Squat', category: 'Legs', type: 'strength' },
  { name: 'Sumo Deadlift', category: 'Legs', type: 'strength' },
  { name: 'Leg Press', category: 'Legs', type: 'strength' },
  { name: 'Bulgarian Split Squat', category: 'Legs', type: 'strength' },
  { name: 'Lunges', category: 'Legs', type: 'strength' },
  { name: 'Barbell Hip Thrust', category: 'Legs', type: 'strength' },

  // Dumbbell Leg Exercises
  { name: 'Dumbbell Goblet Squat', category: 'Legs', type: 'strength' },
  { name: 'Dumbbell Lunges', category: 'Legs', type: 'strength' },
  { name: 'Dumbbell Step-ups', category: 'Legs', type: 'strength' },

  // Leg Isolation Exercises
  { name: 'Leg Extension', category: 'Legs', type: 'strength' },
  { name: 'Leg Curl', category: 'Legs', type: 'strength' },
  { name: 'Standing Calf Raise', category: 'Legs', type: 'strength' },
  { name: 'Seated Calf Raise', category: 'Legs', type: 'strength' },

  // Bodyweight Leg Exercises
  { name: 'Bodyweight Squat', category: 'Legs', type: 'strength' },

  // ============================================================================
  // CORE CATEGORY (Abs, Obliques) - 2 exercises
  // ============================================================================

  { name: 'Plank', category: 'Core', type: 'strength' },
  { name: 'Side Plank', category: 'Core', type: 'strength' },

  // ============================================================================
  // CARDIO CATEGORY - 4 exercises
  // ============================================================================

  { name: 'Running', category: 'Cardio', type: 'cardio' },
  { name: 'Cycling', category: 'Cardio', type: 'cardio' },
  { name: 'Rowing Machine', category: 'Cardio', type: 'cardio' },
  { name: 'Jump Rope', category: 'Cardio', type: 'cardio' },
];

async function main() {
  console.log('Starting database seed...');
  console.log(`Seeding ${exercises.length} exercises...`);

  // Use createMany for efficient bulk insert
  const result = await prisma.exercise.createMany({
    data: exercises.map((exercise) => ({
      ...exercise,
      isCustom: false,  // All seed exercises are library exercises
      userId: null,     // Library exercises have no user association
    })),
    skipDuplicates: true, // Skip if exercises already exist
  });

  console.log(`✓ Successfully seeded ${result.count} exercises`);

  // Display summary by category
  const summary = exercises.reduce((acc, ex) => {
    acc[ex.category] = (acc[ex.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nExercise Library Summary:');
  Object.entries(summary).forEach(([category, count]) => {
    console.log(`  - ${category}: ${count} exercises`);
  });
  console.log(`\nTotal: ${exercises.length} exercises`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
