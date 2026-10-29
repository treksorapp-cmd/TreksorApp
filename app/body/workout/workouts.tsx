import BodyPageHeading from "@/components/BodyPageHeading";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Workout from "@/components/Workout";
import { useWorkoutStore } from "@/store/workout-store";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const WorkoutHome = () => {
  const { workouts } = useWorkoutStore();
  const insets=useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={{
          flexGrow: 1,
          alignItems: "stretch",
          paddingTop:insets.top+12,
          paddingHorizontal: 20,
          paddingBottom:28,
        }}
        showsVerticalScrollIndicator={false}
      >
        <BodyPageHeading trail="BODY / WORKOUT / GYM" title="WORKOUTS" style={{paddingHorizontal:0,marginBottom:22}} />
        {workouts.map((workout) => (
          <Workout
            key={workout.id}
            onPress={() => router.push({ pathname: "/body/workout/exercises", params: { workoutId:workout.id }})}
            icon=""
            title={workout.title}
            description={workout.description}
            percentage={workout.exercises.length ? workout.exercises.filter(exercise=>exercise.completed).length/workout.exercises.length*100 : 0}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default WorkoutHome;

const styles = StyleSheet.create({
  container: {
    flex: 1,backgroundColor:"#02050C",
  },
  content: {
    flex: 1,
    paddingTop:0
  },
});
