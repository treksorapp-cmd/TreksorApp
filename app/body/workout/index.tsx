import Header from "@/components/ui/Header";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {useWorkoutStore} from "@/store/workout-store";
import {Alert} from "react-native";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const Selection = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const plan=useWorkoutStore(s=>s.trainingPlan);
  const checkIns=useWorkoutStore(s=>s.checkIns);
  const checkIn=useWorkoutStore(s=>s.checkIn);
  const now=new Date();const monday=new Date(now);monday.setDate(now.getDate()-(now.getDay()+6)%7);monday.setHours(0,0,0,0);
  const week=monday.toISOString().slice(0,10);
  const completed=(checkIns[week]||[]).length;
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ImageBackground
        source={require("@/assets/images/Gym_2.png")}
        contentFit="cover"
        style={styles.backgroundImage}
        imageStyle={styles.imageStyle}
      >
        {/* Header */}
        {!user?.plan && <Header showTitle={false} showBackButton={false} showAvatar={false} />}
        <View style={[styles.header, { paddingTop: user?.plan ? insets.top + 10 : 0, position: !user?.plan ? "relative" : "absolute" }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Gym</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
          {plan&&<View style={{width:width-40,padding:16,borderRadius:15,backgroundColor:"rgba(10,12,12,.88)",borderWidth:1,borderColor:"#9B793F",marginBottom:12}}><Text style={{color:"#E8B44D",fontWeight:"800",letterSpacing:1.5}}>YOUR WEEKLY GOAL</Text><Text style={{color:"white",fontSize:21,fontWeight:"700",marginTop:8}}>{completed} / {plan.days} sessions completed</Text><Text style={{color:"#CFC8BB",marginTop:5}}>{plan.location} · Monday to Sunday</Text><TouchableOpacity disabled={completed>=plan.days} onPress={()=>{checkIn(week);Alert.alert(completed+1>=plan.days?"🏆 WEEKLY GOAL ACHIEVED!":"✨ SESSION COMPLETE",completed+1>=plan.days?"You did it! Every session counts.":"Great work. Keep your momentum going!")}} style={{backgroundColor:completed>=plan.days?"#26362C":"#E8B44D",padding:13,borderRadius:11,marginTop:14,alignItems:"center"}}><Text style={{color:completed>=plan.days?"#B7DCC0":"#17130B",fontWeight:"800"}}>{completed>=plan.days?"✓ WEEK COMPLETE":"✓ CHECK IN · SESSION DONE"}</Text></TouchableOpacity></View>}
          <TouchableOpacity onPress={()=>router.push("/body/workout/guide")} style={styles.gymButtonContainer}><Text style={styles.gymButtonText}>BUILD MY PLAN</Text></TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/body/workout/exercises",
                params: { workoutId: "push" },
              })
            }
            style={styles.gymButtonContainer}
          >
            <Text style={styles.gymButtonText}>PUSH</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/body/workout/exercises",
                params: { workoutId: "pull" },
              })
            }
            style={styles.gymButtonContainer}
          >
            <Text style={styles.gymButtonText}>PULL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/body/workout/exercises",
                params: { workoutId: "legs" },
              })
            }
            style={styles.gymButtonContainer}
          >
            <Text style={styles.gymButtonText}>LEGS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.otherButtonContainer}>
            <Text style={styles.otherButtonText}>REST</Text>
          </TouchableOpacity>
          <Text style={{ color: "#fff", textAlign: "center", marginTop: 20 }}>
            Disclaimer: These workouts are intended for general fitness purposes
            only. Always consult your doctor before starting any new exercise
            program
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
};

export default Selection;

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    width,
    height,
  },
  imageStyle: {
    opacity: 1,
  },
  scrollView: {
    flex: 1,
    justifyContent: "center",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  gymButtonContainer: {
    width: width - 40, // Full width minus margins
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 10,
    backgroundColor: "#E8B44D",
    alignItems: "center",
    justifyContent: "center",
  },
  otherButtonContainer: {
    width: width - 40, // Full width minus margins
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    marginVertical: 10,
    backgroundColor: "#303030",
    alignItems: "center",
    justifyContent: "center",
  },
  gymButtonText: {
    color: "#000000",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1,
    lineHeight: 24,
  },
  otherButtonText: {
    color: "#E8B44D",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 1,
    lineHeight: 24,
  },
  otherButtonSubText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 1,
    lineHeight: 24,
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
