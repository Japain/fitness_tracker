export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface Exercise {
  id: string;
  name: string;
  weight?: number;
  weightUnit?: 'lbs' | 'kg' | 'bodyweight';
  repetitions?: number;
  sets?: number;
  category: 'cardio' | 'strength' | 'flexibility' | 'other';
  isCustom: boolean;
}

export interface WorkoutSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  notes?: string;
}

export interface WorkoutExercise {
  id: string;
  workoutSessionId: string;
  exerciseId: string;
  orderIndex: number;
  weight?: number;
  weightUnit?: 'lbs' | 'kg' | 'bodyweight';
  repetitions?: number;
  sets?: number;
  duration?: number;
  notes?: string;
}
