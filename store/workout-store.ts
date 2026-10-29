import { workoutContent, WorkoutsData } from "@/mock/workouts";
import { Exercise, Workout, WorkoutContent } from "@/types/workout";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type GymSet = { id:string; exerciseId:string; exerciseName:string; day:number; kg:number; reps:number; recordedAt:string; sessionId?:string; setNumber?:number; setType?:string; metric?:"reps"|"seconds" };
export type ActiveGymWorkout = { id:string; day:number; dayName:string; exerciseIds:string[]; completedSetIds:string[]; startedAt:string; restEndsAt?:string|null; restDuration?:number };
export type TrainingPlan = { days:number; location:"Gym"|"Home"; savedAt:string; age?:number; heightCm?:number; weightKg?:number; goal?:"strength"|"muscle"|"definition"; experience?:"beginner"|"intermediate"|"advanced" };
interface WorkoutState {
    trainingPlan: TrainingPlan | null;
    gymSets: GymSet[];
    activeGymWorkout: ActiveGymWorkout | null;
    startGymWorkout: (day:number, dayName:string, exerciseIds:string[])=>string;
    completeGymSet: (entry:GymSet)=>void;
    setGymRestEnd: (value:string|null)=>void;
    extendGymRest: (seconds:number)=>void;
    finishGymWorkout: (week:string)=>void;
    discardGymWorkout: ()=>void;
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
        activeGymWorkout: null,
        startGymWorkout: (day,dayName,exerciseIds) => {
          const existing = get().activeGymWorkout;
          if (existing) return existing.id;
          const workout = { id:Date.now().toString()+"-"+Math.random().toString(36).slice(2), day, dayName, exerciseIds, completedSetIds:[], startedAt:new Date().toISOString(), restEndsAt:null };
          set({activeGymWorkout:workout});
          return workout.id;
        },
        completeGymSet: entry => set(state => {
          const existing = state.gymSets.some(item=>item.id===entry.id);
          const key = entry.exerciseId+":"+entry.setNumber;
          const active = state.activeGymWorkout;
          return {
            gymSets: existing ? state.gymSets : [...(state.gymSets||[]),entry],
            activeGymWorkout: active ? {...active,completedSetIds:active.completedSetIds.includes(key)?active.completedSetIds:[...active.completedSetIds,key]} : active,
          };
        }),
        setGymRestEnd: restEndsAt => set(state=>({activeGymWorkout:state.activeGymWorkout?{...state.activeGymWorkout,restEndsAt,restDuration:restEndsAt?Math.max(0,Math.ceil((Date.parse(restEndsAt)-Date.now())/1000)):0}:null})),
        extendGymRest: seconds => set(state=>{const active=state.activeGymWorkout,end=Date.parse(active?.restEndsAt||"");if(!active||!Number.isFinite(end)||end<=Date.now()||seconds<=0||seconds>60)return {};return {activeGymWorkout:{...active,restEndsAt:new Date(end+seconds*1000).toISOString(),restDuration:(active.restDuration||Math.ceil((end-Date.now())/1000))+seconds}}}),
        finishGymWorkout: week => set(state=>state.activeGymWorkout?({checkIns:{...state.checkIns,[week]:[...(state.checkIns[week]||[]),new Date().toISOString()]},activeGymWorkout:null}):{}),
        discardGymWorkout: ()=>set({activeGymWorkout:null}),
        addGymSet: entry=>set(state=>({gymSets:[...(state.gymSets||[]),entry]})),
        removeGymSet: id=>set(state=>{
          const removed=(state.gymSets||[]).find(e=>e.id===id);
          const key=removed?.exerciseId+":"+removed?.setNumber;
          return {gymSets:(state.gymSets||[]).filter(e=>e.id!==id),activeGymWorkout:removed?.sessionId&&state.activeGymWorkout?{...state.activeGymWorkout,completedSetIds:state.activeGymWorkout.completedSetIds.filter(value=>value!==key)}:state.activeGymWorkout};
        }),
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
            trainingPlan: null, gymSets: [], activeGymWorkout:null, checkIns: {}, exerciseOverrides: {},
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
