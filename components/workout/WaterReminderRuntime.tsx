import { useEffect } from "react";
import { Platform } from "react-native";
import { useAuthStore } from "@/store/auth-store";
import { useWorkoutStore } from "@/store/workout-store";
import { cancelWaterReminder } from "@/lib/workout-water";

export default function WaterReminderRuntime() {
  useEffect(() => {
    if (Platform.OS === "web") return;
    const cancel = (id?: string) => {
      if (id) void cancelWaterReminder(id).catch(() => {});
    };
    const offWorkout = useWorkoutStore.subscribe((next, previous) => {
      const prior = previous.activeGymWorkout?.id;
      if (prior !== next.activeGymWorkout?.id) cancel(prior);
    });
    const offAuth = useAuthStore.subscribe((next, previous) => {
      if (previous.isAuthenticated && (!next.isAuthenticated || previous.user?.id !== next.user?.id)) {
        cancel(useWorkoutStore.getState().activeGymWorkout?.id);
      }
    });
    return () => { offWorkout(); offAuth(); };
  }, []);
  return null;
}
