export interface WorkoutSet {
  id: string;
  weight: number;
  reps: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  isGravitron?: boolean;
}

export interface Workout {
  id: string;
  name?: string;
  date: string; // ISO string
  exercises: Exercise[];
  durationMinutes?: number;
}

export interface ExerciseHistory {
  name: string;
  pr: number;
  prReps: number;
  isGravitron: boolean;
  prAllSets: { weight: number; reps: number }[];
  entries: {
    date: string;
    maxWeight: number;
    totalVolume: number;
  }[];
}
