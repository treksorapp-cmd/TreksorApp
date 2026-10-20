import { workoutContent, WorkoutsData } from "@/mock/workouts";
import { Exercise, Workout, WorkoutContent } from "@/types/workout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type TrainingPlan = { days:number; location:"Gym"|"Home"; savedAt:string };
interface WorkoutState {
    trainingPlan: TrainingPlan | null;
    checkIns: Record<string,string[]>;
    saveTrainingPlan: (plan:TrainingPlan)=>void;
    resetTrainingPlan: ()=>void;
    checkIn: (week:string)=>void;
    undoCheckIn: (week:string)=>void;
    workouts: Workout[];
    workoutContent: WorkoutContent;
    getWorkoutExercies:(id:string)=>Exercise[] | undefined;
    markExerciseAsRead:(workoutId: string, exerciseId: string) => void;
    resetProgress: (workoutId: string) => void;
    clearData: () => void;
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set,get) => ({
        trainingPlan: null,
        checkIns: {},
        saveTrainingPlan: plan=>set({trainingPlan:plan}),
        resetTrainingPlan: ()=>set({trainingPlan:null,checkIns:{}}),
        checkIn: week=>set(state=>({checkIns:{...state.checkIns,[week]:[...(state.checkIns[week]||[]),new Date().toISOString()]}})),
        undoCheckIn: week=>set(state=>({checkIns:{...state.checkIns,[week]:(state.checkIns[week]||[]).slice(0,-1)}})),
        workouts: WorkoutsData,
        workoutContent: workoutContent,

        getWorkoutExercies: (id) => {
          const workout = get().workouts.find(workout => workout.id === id);
          return workout?.exercises;
        },

        markExerciseAsRead: (workoutId: string, exerciseId: string) => {
          const existingWorkouts = get().workouts;
          const existingWorkoutIndex = existingWorkouts.findIndex((workout) => workout.id === workoutId);
          if (existingWorkoutIndex < 0) return;
          const updatedExercises = existingWorkouts[existingWorkoutIndex].exercises.map((exercise) => {
            if (exercise.id === exerciseId) {
              return { ...exercise, completed: true };
            }
            return exercise;
          });
          existingWorkouts[existingWorkoutIndex].exercises = updatedExercises;
          set({workouts: existingWorkouts});
        },
        
        clearData: () => {
          set({
            workouts: WorkoutsData,
            workoutContent: workoutContent,
          })
        },

        resetProgress: (workoutId: string) => {
            const updatedWorkouts = get().workouts.map(workout => {
              if(workout.id !== workoutId) return workout;
              return {
                ...workout,
                exercises: workout.exercises.map(exercise => ({
                  ...exercise,
                  completed: false,
                })),
              };
            });
            set({ workouts: updatedWorkouts });
        },
    }),
    {
      name: "workout-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
