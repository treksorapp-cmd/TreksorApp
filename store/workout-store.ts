import { workoutContent, WorkoutsData } from "@/mock/workouts";
import { Exercise, Workout, WorkoutContent } from "@/types/workout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type GymSet = { id:string; exerciseId:string; exerciseName:string; day:number; kg:number; reps:number; recordedAt:string };
export type TrainingPlan = { days:number; location:"Gym"|"Home"; savedAt:string; age?:number; heightCm?:number; weightKg?:number; goal?:"strength"|"muscle"|"definition"; experience?:"beginner"|"intermediate"|"advanced" };
interface WorkoutState {
    trainingPlan: TrainingPlan | null;
    gymSets: GymSet[];
    addGymSet: (entry:GymSet)=>void;
    removeGymSet: (id:string)=>void;
    checkIns: Record<string,string[]>;
    exerciseOverrides: Record<string,string[]>;
    setDayExercises: (day:number,exerciseIds:string[])=>void;
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
        gymSets: [],
        addGymSet: entry=>set(state=>({gymSets:[...(state.gymSets||[]),entry]})),
        removeGymSet: id=>set(state=>({gymSets:(state.gymSets||[]).filter(e=>e.id!==id)})),
        checkIns: {},
        exerciseOverrides: {},
        setDayExercises: (day,exerciseIds)=>set(state=>({exerciseOverrides:{...state.exerciseOverrides,[String(day)]:exerciseIds}})),
        saveTrainingPlan: plan=>set({trainingPlan:plan}),
        resetTrainingPlan: ()=>set({trainingPlan:null,exerciseOverrides:{}}),
        checkIn: week=>set(state=>({checkIns:{...state.checkIns,[week]:[...(state.checkIns[week]||[]),new Date().toISOString()]}})),
        undoCheckIn: week=>set(state=>({checkIns:{...state.checkIns,[week]:(state.checkIns[week]||[]).slice(0,-1)}})),
        workouts: WorkoutsData,
        workoutContent: workoutContent,

        getWorkoutExercies: (id) => {
          const workout = get().workouts.find(workout => workout.id === id);
          return workout?.exercises;
        },

        markExerciseAsRead: (workoutId: string, exerciseId: string) => {
          set(state => ({
            workouts: state.workouts.map(workout =>
              workout.id !== workoutId ? workout : {
                ...workout,
                exercises: workout.exercises.map(exercise =>
                  exercise.id === exerciseId ? {...exercise,completed:true} : exercise
                )
              }
            )
          }));
        },
        
        clearData: () => {
          set({
            trainingPlan: null, gymSets: [], checkIns: {}, exerciseOverrides: {},
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
