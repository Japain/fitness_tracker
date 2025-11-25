/**
 * Exercise entity - pre-defined library or user-created custom exercise
 */
export interface Exercise {
  id: string;                  // UUID
  name: string;
  category?: string;           // e.g., "Push", "Pull", "Legs", "Core", "Cardio"
  type: 'strength' | 'cardio'; // REQUIRED - indicates which fields are valid in WorkoutSet
  isCustom: boolean;           // false for library exercises, true for user-created
  userId?: string;             // Set if isCustom = true (foreign key to User)
  createdAt: Date;
}
