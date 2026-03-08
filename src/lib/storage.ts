import { Workout, ExerciseHistory } from "@/types/workout";

const WORKOUTS_KEY = "iron-log-workouts";
const BODY_WEIGHT_KEY = "iron-log-body-weight";

export function getBodyWeight(): number {
  try {
    const data = localStorage.getItem(BODY_WEIGHT_KEY);
    return data ? parseFloat(data) : 0;
  } catch {
    return 0;
  }
}

export function saveBodyWeight(weight: number) {
  localStorage.setItem(BODY_WEIGHT_KEY, String(weight));
}

export function getWorkouts(): Workout[] {
  try {
    const data = localStorage.getItem(WORKOUTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveWorkouts(workouts: Workout[]) {
  localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts));
}

export function addWorkout(workout: Workout) {
  const workouts = getWorkouts();
  workouts.unshift(workout);
  saveWorkouts(workouts);
}

export function updateWorkout(workout: Workout) {
  const workouts = getWorkouts();
  const idx = workouts.findIndex((w) => w.id === workout.id);
  if (idx !== -1) {
    workouts[idx] = workout;
    saveWorkouts(workouts);
  }
}

export function deleteWorkout(id: string) {
  const workouts = getWorkouts().filter((w) => w.id !== id);
  saveWorkouts(workouts);
}

export function getExerciseNames(): string[] {
  const workouts = getWorkouts();
  const namesMap = new Map<string, string>();
  workouts.forEach((w) =>
    w.exercises.forEach((e) => {
      if (e.name.trim() && !namesMap.has(e.name.toLowerCase())) {
        namesMap.set(e.name.toLowerCase(), e.name.trim());
      }
    })
  );
  return Array.from(namesMap.values());
}

export function getExerciseIsGravitron(name: string): boolean {
  const workouts = getWorkouts();
  const lowerName = name.toLowerCase();
  for (let i = 0; i < workouts.length; i++) {
    for (const e of workouts[i].exercises) {
      if (e.name.toLowerCase() === lowerName) {
        return !!e.isGravitron;
      }
    }
  }
  return false;
}

export function getExercisePR(name: string): { weight: number; reps: number; isGravitron: boolean; allSets: { weight: number; reps: number }[] } {
  const workouts = getWorkouts();
  const lowerName = name.toLowerCase();
  
  const isGravitron = getExerciseIsGravitron(name);
  
  let prWeight = -1;
  let repsAtPr = 0;
  let prSets: { weight: number; reps: number }[] = [];

  workouts.forEach((w) =>
    w.exercises.forEach((e) => {
      if (e.name.toLowerCase() === lowerName) {
        e.sets.forEach((s) => {
          if (s.weight <= 0) return;
          if (prWeight === -1) {
            prWeight = s.weight;
            repsAtPr = s.reps;
            prSets = e.sets.map((set) => ({ weight: set.weight, reps: set.reps }));
          } else if (isGravitron ? s.weight < prWeight : s.weight > prWeight) {
            prWeight = s.weight;
            repsAtPr = s.reps;
            prSets = e.sets.map((set) => ({ weight: set.weight, reps: set.reps }));
          } else if (s.weight === prWeight && s.reps > repsAtPr) {
            repsAtPr = s.reps;
            prSets = e.sets.map((set) => ({ weight: set.weight, reps: set.reps }));
          }
        });
      }
    })
  );
  return { weight: prWeight === -1 ? 0 : prWeight, reps: repsAtPr, isGravitron, allSets: prSets };
}

export function getExerciseHistory(name: string): ExerciseHistory {
  const workouts = getWorkouts();
  const lowerName = name.toLowerCase();
  const entries: ExerciseHistory["entries"] = [];

  const isGravitron = getExerciseIsGravitron(name);
  const bodyWeight = getBodyWeight();

  workouts.forEach((w) => {
    w.exercises.forEach((e) => {
      if (e.name.toLowerCase() === lowerName) {
        let maxWeight = 0;
        let totalVolume = 0;
        e.sets.forEach((s) => {
          if (s.weight > maxWeight) maxWeight = s.weight;
          if (isGravitron && bodyWeight > 0) {
            const effectiveWeight = Math.max(0, bodyWeight - s.weight);
            totalVolume += effectiveWeight * s.reps;
          } else {
            totalVolume += s.weight * s.reps;
          }
        });
        if (e.sets.length > 0) {
          entries.push({ date: w.date, maxWeight, totalVolume });
        }
      }
    });
  });

  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let prWeight = 0;
  let prReps = 0;
  entries.forEach((e) => {
    if (e.maxWeight > prWeight) {
      prWeight = e.maxWeight;
    }
  });

  // Find reps at PR weight from raw data
  const prData = getExercisePR(name);

  return {
    name,
    pr: prData.weight,
    prReps: prData.reps,
    isGravitron: prData.isGravitron,
    prAllSets: prData.allSets,
    entries,
  };
}

export function getAllExerciseNames(): string[] {
  return getExerciseNames().sort();
}

export function generateId(): string {
  return crypto.randomUUID();
}
