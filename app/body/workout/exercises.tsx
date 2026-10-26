import BodyPageHeading from "@/components/BodyPageHeading";
"use client";

import { useWorkoutStore } from "@/store/workout-store";
import { Exercise } from "@/types/workout";
import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useLayoutEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WorkoutDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { workoutId } = useLocalSearchParams();
  const { workouts, getWorkoutExercies, resetProgress } = useWorkoutStore();
  const [workout, setWorkout] = useState<Exercise[]>();

  useFocusEffect(useCallback(() => {
    const id = Array.isArray(workoutId) ? workoutId[0] : workoutId;
    if (id) setWorkout(getWorkoutExercies(id) ?? []);
  }, [workoutId, getWorkoutExercies]));

  useLayoutEffect(() => {
    navigation.setOptions({
      header: () => (
        <></>
        // <Header
        //   title={(workoutId as string)?.charAt(0).toUpperCase() + (workoutId as string)?.slice(1)}
        //   showBackButton={true}
        //   onBackPress={() => router.back()}
        //   headerRightButton={
        //     <TouchableOpacity onPress={_resetProgress}>
        //         <Ionicons name="refresh" size={24} color="white" />
        //     </TouchableOpacity>
        //   }
        //   showAvatar={false}
        // />
      ),
    });
  }, [navigation, workoutId]);

  const _resetProgress = () => {
    Alert.alert(
      "Reset Progress",
      "Are you sure you want to reset progress?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => resetProgress(workoutId as string),
        },
      ],
      { cancelable: true }
    );
  };

  const handleExercisePress = (workoutId: string, exerciseId: string) => {
    if (!workout) return;
    router.push({
      pathname: "/body/workout/details",
      params: { id: exerciseId, workoutId },
    });
  };

  const renderExerciseCard = (
    exercise: Exercise,
    workoutId: string,
    index: number
  ) => {
    return (
      <TouchableOpacity
        style={styles.exerciseCard}
        onPress={() => handleExercisePress(workoutId, exercise.id)}
        key={index}
      >
        <LinearGradient
          colors={["rgba(183,221,240,0.085)", "rgba(183,221,240,0.06)"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.borderGradient}
        >
          <LinearGradient
            colors={["rgba(183,221,240,0.075)", "rgba(183,221,240,0.045)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.innerGradient}
          >
            <View style={styles.cardContent}>
              <View style={styles.checkboxContainer}>
                {exercise.completed ? (
                  <View style={styles.completedCheckbox}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                ) : (
                  <View style={styles.uncompletedCheckbox} />
                )}
              </View>

              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.title}</Text>
                <Text style={styles.exerciseDetails}>
                  {exercise.description}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  if (!workout) {
    return (
      <View style={[styles.container, { paddingTop: 0 }]}>
        <ImageBackground
          source={require("@/assets/images/Rutine_2.png")}
          contentFit="cover"
          style={styles.backgroundImage}
          imageStyle={styles.imageStyle}
        >
          <StatusBar style="light" />
          <BodyPageHeading trail="BODY / WORKOUT / GYM / EXERCISE LIBRARY" title={String(Array.isArray(workoutId)?workoutId[0]:workoutId || "EXERCISES")} style={{paddingTop:insets.top+12,paddingBottom:18}} />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Choose a workout from the exercise library.</Text>
          </View>
        </ImageBackground>
      </View>
    );
  }

  let exerciseIndex = 0;


  return (
    <View style={[styles.container]}>
      <ImageBackground
        source={require("@/assets/images/Rutine_2.png")}
        contentFit="cover"
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        <StatusBar style="light" />
        <BodyPageHeading trail="BODY / WORKOUT / GYM / EXERCISE LIBRARY" title={String(Array.isArray(workoutId)?workoutId[0]:workoutId || "EXERCISES")} style={{paddingTop:insets.top+12,paddingBottom:18}} />
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {workout.map((exercise, index) => (
            <View key={index} style={styles.section}>
              {/* <Text style={styles.sectionTitle}>{sectionTitle}</Text> */}
              <View style={styles.exercisesList}>
                {/* {exercises.map((exercise) => {
                const cardIndex = exerciseIndex++; */}
                {renderExerciseCard(exercise, workoutId as string, index)}
                {/* })} */}
              </View>
            </View>
          ))}
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

// const { width } = Dimensions.get("window");
const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  content: {
    flex: 1,
    marginTop: 0,
    paddingTop: 0,
  },
  scrollContent: {
    padding: 20,
    justifyContent: "flex-start",
    flexGrow: 1,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 34,
    fontWeight: "600",
    color: "#F5F4F1",
    marginBottom: 15,
    marginLeft: 4, lineHeight: 42, letterSpacing: -0.6, includeFontPadding: false, },
  exercisesList: {
    gap: 0,
  },
  exerciseCard: {
    width: "100%", // Full width minus margins
    minHeight: 70,
    borderRadius: 12,
    flexGrow: 1, // Allow the card to grow dynamically
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: "100%",
  },
  checkboxContainer: {
    marginRight: 16,
  },
  completedCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  uncompletedCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "transparent",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
    lineHeight: 22,
  },
  exerciseDetails: {
    fontSize: 14,
    lineHeight:21,
    color: "#C8C3BA",
    fontWeight: "500",
  },
  borderGradient: {
    flex: 1,
    borderRadius: 12,
    padding: 0,
  },
  innerGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 11, // Slightly smaller than outer radius
  },
  backgroundImage: {
    flex: 1,
  },
  imageStyle: {
    opacity: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSpacer: {
    width: 34,
  },
});
