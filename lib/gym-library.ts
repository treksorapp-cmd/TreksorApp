import { WorkoutsData, workoutContent } from "@/mock/workouts";
import type { Workout } from "@/types/workout";

export type GymExercise = {
  id: string;
  name: string;
  muscle_group: string;
  location: string;
  equipment: string;
  instructions: string;
  sets: number;
  reps: string;
  rest_seconds: number;
  videoUrl?: string;
  video_path?: string | null;
  metric: "reps" | "seconds";
};

const muscleFor: Record<string, string> = {
  push: "Chest",
  pull: "Back",
  legs: "Legs",
};
const exerciseMuscles: Record<string, string> = {
  "cable-middle-fly": "Chest",
  "dumbbell-lateral-raises": "Shoulders",
  "standing-dumbbell-shoulder-press": "Shoulders",
  "dumbbell-incline-triceps-extension": "Arms",
  "cable-triceps-pushdown-ez-bar-close-grip": "Arms",
  "cable-seated-supine-grip-row": "Back",
  "preacher-curl-ez-bar-wide-grip": "Arms",
  "dumbbell-hammer-curl": "Arms",
  "captains-chair-leg-raise": "Core",
  "dumbbell-side-bend": "Core",
  "lying-leg-curl-machine": "Legs",
  "dumbbell-rear-lunge-stretch": "Glutes",
  "alternate-arm-leg-plank": "Core",
};
const readRange = (description: string) => description.match(/(\d+\s*[-–]\s*\d+)\s*(?:reps|sec(?:onds)?)/i)?.[1]?.replace(/\s/g, "") ?? "8-12";
const readSets = (description: string) => Number(description.match(/(\d+)\s*(?:-|–)\s*\d+\s*sets/i)?.[1] ?? description.match(/(\d+)\s*sets/i)?.[1] ?? 3);

export const builtInGymExercises: GymExercise[] = WorkoutsData.flatMap((workout: Workout) => workout.exercises.map(exercise => {
  const info = workoutContent[exercise.id];
  return {
    id: exercise.id,
    name: exercise.title,
    muscle_group: exerciseMuscles[exercise.id] ?? muscleFor[workout.id] ?? "Core",
    location: "Gym",
    equipment: exercise.id === "alternate-arm-leg-plank" || exercise.id === "captains-chair-leg-raise" ? "Bodyweight" : "",
    instructions: exercise.tip,
    sets: readSets(exercise.description),
    reps: readRange(exercise.description),
    metric: /sec(?:onds)?/i.test(exercise.description) ? "seconds" : "reps",
    rest_seconds: 90,
    videoUrl: info?.videoUrl,
  };
}));

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Published dashboard exercises extend the video-backed Treksor starter library. */
export function mergeGymExercises(remote: Partial<GymExercise>[]): GymExercise[] {
  const merged = [...builtInGymExercises];
  for (const item of remote) {
    if (!item || typeof item.id !== "string" || typeof item.name !== "string") continue;
    const index = merged.findIndex(exercise => normalize(exercise.name) === normalize(item.name!));
    const next: GymExercise = {
      id: item.id,
      name: item.name,
      muscle_group: item.muscle_group ?? "Core",
      location: item.location ?? "Both",
      equipment: item.equipment ?? "",
      metric: item.metric ?? (index >= 0 ? merged[index].metric : "reps"),
      instructions: item.instructions ?? "",
      sets: item.sets ?? 3,
      reps: item.reps ?? "8-12",
      rest_seconds: item.rest_seconds ?? 90,
      video_path: item.video_path ?? null,
      videoUrl: item.video_path ? undefined : (item.videoUrl ?? (index >= 0 ? merged[index].videoUrl : undefined)),
    };
    if (index >= 0) merged[index] = next;
    else merged.push(next);
  }
  return merged;
}

export function exercisesForMuscles(exercises: GymExercise[], muscles: string[], location: string) {
  return exercises.filter(exercise => (exercise.location === location || exercise.location === "Both") && muscles.includes(exercise.muscle_group));
}
