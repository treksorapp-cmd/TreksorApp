import Button from "@/components/ui/Button";
import { playCompletionFeedback } from "@/lib/completion-feedback";
import { useWorkoutStore } from "@/store/workout-store";
import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import { Alert, Animated, Easing, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const GOLD = "#D7B877";

export default function GymScreen() {
  const insets = useSafeAreaInsets();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => { const loop = Animated.loop(Animated.sequence([Animated.timing(pulse,{toValue:1,duration:1450,easing:Easing.inOut(Easing.sin),useNativeDriver:true}),Animated.timing(pulse,{toValue:0,duration:1450,easing:Easing.inOut(Easing.sin),useNativeDriver:true})]));loop.start();return()=>loop.stop(); },[pulse]);
  const plan = useWorkoutStore(s => s.trainingPlan);
  const checkIns = useWorkoutStore(s => s.checkIns);
  const checkIn = useWorkoutStore(s => s.checkIn);
  const resetTrainingPlan = useWorkoutStore(s => s.resetTrainingPlan);
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (now.getDay() + 6) % 7);
  monday.setHours(0, 0, 0, 0);
  const week = [monday.getFullYear(), String(monday.getMonth() + 1).padStart(2, "0"), String(monday.getDate()).padStart(2, "0")].join("-");
  const completed = (checkIns[week] || []).length;
  const goal = plan?.days ?? 0;
  const progress = goal ? Math.min(1, completed / goal) : 0;

  const completeSession = () => {
    if (!plan || completed >= goal) return;
    checkIn(week);
    void playCompletionFeedback();
    Alert.alert(completed + 1 >= goal ? "WEEKLY GOAL ACHIEVED" : "SESSION COMPLETE", completed + 1 >= goal ? "You reached your weekly training goal." : "Your session has been added to this week.");
  };

  const confirmReset = () => Alert.alert(
    "Reset your training plan?",
    "Your current plan and custom exercise selections will be removed. Your recorded sessions and progress will remain saved.",
    [{ text: "CANCEL", style: "cancel" }, { text: "RESET PLAN", style: "destructive", onPress: () => { resetTrainingPlan(); router.push("/body/workout/guide"); } }]
  );

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 18) + 44 }} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ImageBackground source={require("@/assets/images/Gym_2.png")} contentFit="cover" style={StyleSheet.absoluteFill} />
          <LinearGradient colors={["rgba(2,5,12,0.22)", "rgba(2,5,12,0.68)", "#02050C"]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
          <View style={[styles.heroContent, { paddingTop: insets.top + 12 }]}>
            <Text style={styles.eyebrow}>BODY / WORKOUT</Text>
            <Text style={styles.heroTitle}>Gym</Text>
            <Text style={styles.heroSubtitle}>Train with intention. Progress with purpose.</Text>
          </View>
        </View>

        <View style={styles.content}>
          {plan ? (
            <>
              <View style={styles.sectionHeading}>
                <View><Text style={styles.eyebrow}>YOUR TRAINING</Text><Text style={styles.sectionTitle}>My plan</Text></View>
                <View style={styles.activeTag}><View style={styles.pulseShell}><Animated.View style={[styles.pulseHalo,{opacity:pulse.interpolate({inputRange:[0,1],outputRange:[0.06,0.24]}),transform:[{scale:pulse.interpolate({inputRange:[0,1],outputRange:[1,1.65]})}]}]}/><Animated.View style={[styles.activeDot,{opacity:pulse.interpolate({inputRange:[0,1],outputRange:[0.70,1]})}]}/></View><Text style={styles.activeText}>ACTIVE</Text></View>
              </View>
              <View style={styles.planCard}>
                <View style={styles.planStats}>
                  <View><Text style={styles.statNumber}>{plan.days}</Text><Text style={styles.statLabel}>DAYS / WEEK</Text></View>
                  <View style={styles.statDivider}/>
                  <View><Text style={styles.statNumber}>{plan.location.toUpperCase()}</Text><Text style={styles.statLabel}>TRAINING LOCATION</Text></View>
                </View>
                <View style={styles.rule}/>
                <Text style={styles.cardEyebrow}>THIS WEEK'S PROGRESS</Text>
                <View style={styles.progressHeader}><Text style={styles.progressValue}>{completed} <Text style={styles.progressMuted}>/ {goal} sessions</Text></Text><Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text></View>
                <View style={styles.track}><View style={[styles.trackFill,{width:`${progress * 100}%`}]}/></View>
                <Text style={styles.weekCaption}>Monday – Sunday · Every session counts</Text>
              </View>
              <Button borderless iconName="calendar-outline" onPress={() => router.push("/body/workout/my-plan")}>OPEN MY PLAN</Button>
              <TouchableOpacity accessibilityRole="button" disabled={completed >= goal} onPress={completeSession} style={[styles.checkIn, completed >= goal && styles.checkInDone]}>
                <Ionicons name={completed >= goal ? "checkmark-circle" : "checkmark-circle-outline"} size={21} color="#FFFFFF"/>
                <Text style={styles.checkInText}>{completed >= goal ? "WEEKLY GOAL COMPLETE" : "MARK SESSION COMPLETE"}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.eyebrow}>GET STARTED</Text>
              <Text style={styles.sectionTitle}>Your training starts here.</Text>
              <Text style={styles.intro}>Choose your schedule, goals and exercises to create a plan that fits your life.</Text>
              <Button iconName="options-outline" onPress={() => router.push("/body/workout/guide")}>BUILD MY PLAN</Button>
            </>
          )}

          <View style={styles.sectionHeadingSecondary}><Text style={styles.sectionTitle}>Explore</Text><Text style={styles.sectionNote}>TOOLS & INSIGHTS</Text></View>
          <Button iconName="book-outline" onPress={() => router.push("/body/workout/library")}>EXERCISE LIBRARY</Button>
          <Button iconName="stats-chart-outline" onPress={() => router.push("/body/workout/progress")}>GYM PROGRESS</Button>

          {plan && <View style={styles.management}>
            <Text style={styles.managementTitle}>PLAN SETTINGS</Text>
            <TouchableOpacity accessibilityRole="button" onPress={confirmReset} style={styles.resetRow}>
              <Ionicons name="refresh-outline" size={19} color="#C8C3BA"/>
              <View style={{flex:1}}><Text style={styles.resetTitle}>RESET MY PLAN</Text><Text style={styles.resetSubtitle}>Start again with a new training plan</Text></View>
              <Ionicons name="chevron-forward" size={17} color="#A7A19A"/>
            </TouchableOpacity>
          </View>}

          <Text style={styles.disclaimer}>Training guidance is for general fitness. Consult a healthcare professional before beginning a new exercise program.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:"#02050C"},
  hero:{height:280,justifyContent:"flex-end",overflow:"hidden"},
  heroContent:{paddingHorizontal:24,paddingBottom:27,flex:1,justifyContent:"flex-end"},
  eyebrow:{color:"#D7B877",fontSize:11,fontWeight:"700",letterSpacing:2},
  heroTitle: {color:"#FFFFFF",fontSize: 34,fontWeight: "600",letterSpacing: -0.6,marginTop:7, lineHeight: 42, includeFontPadding: false, },
  heroSubtitle:{color:"#DDD7CB",fontSize:13,marginTop:8},
  content:{paddingHorizontal:20},
  sectionHeading:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:16},
  sectionTitle: {color:"#FFFFFF",fontSize: 22,fontWeight: "600",marginTop:5, lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
  activeTag:{flexDirection:"row",alignItems:"center",gap:7,backgroundColor:"rgba(214,184,116,0.1)",paddingHorizontal:12,paddingVertical:8,borderRadius:20,borderWidth:0},
  pulseShell:{width:9,height:9,alignItems:"center",justifyContent:"center"},
  pulseHalo:{position:"absolute",width:9,height:9,borderRadius:5,backgroundColor:GOLD},
  activeDot:{height:9,width:9,borderRadius:5,backgroundColor:GOLD},
  activeText:{color:"#E8D0A0",fontSize:10,fontWeight:"800",letterSpacing:1},
  planCard:{backgroundColor:"rgba(184,221,239,0.055)",borderWidth:0,borderRadius:20,padding:20,marginBottom:8},
  planStats:{flexDirection:"row",alignItems:"center",gap:26},
  statNumber:{color:"#FFFFFF",fontSize:23,fontWeight:"700"},
  statLabel:{color:"#B8B7B5",fontSize:10,fontWeight:"700",letterSpacing:1,marginTop:6},
  statDivider:{height:35,width:1,backgroundColor:"rgba(255,255,255,0.17)"},
  rule:{height:1,backgroundColor:"rgba(255,255,255,0.12)",marginVertical:19},
  cardEyebrow:{color:"#D5C4A2",fontSize:11,fontWeight:"700",letterSpacing:1.3},
  progressHeader:{flexDirection:"row",justifyContent:"space-between",alignItems:"baseline",marginTop:11,marginBottom:11},
  progressValue:{color:"#FFFFFF",fontSize:22,fontWeight:"700"},
  progressMuted:{fontSize:14,fontWeight:"400",color:"#B8B7B5"},
  progressPercent:{color:"#D7B877",fontWeight:"700",fontSize:13},
  track:{height:7,borderRadius:7,backgroundColor:"rgba(255,255,255,0.11)",overflow:"hidden"},
  trackFill:{height:"100%",backgroundColor:GOLD,borderRadius:7},
  weekCaption:{color:"#A9A9A8",fontSize:11,marginTop:12},
  checkIn:{height:54,marginTop:5,marginBottom:16,borderRadius:16,backgroundColor:"rgba(188,223,240,0.085)",borderWidth:0,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:10},
  checkInDone:{opacity:0.65},
  checkInText:{color:"#FFFFFF",fontSize:13,fontWeight:"700",letterSpacing:0.8},
  intro:{color:"#B9B9B9",fontSize:14,lineHeight:21,marginTop:10,marginBottom:16},
  sectionHeadingSecondary:{flexDirection:"row",alignItems:"baseline",justifyContent:"space-between",marginTop:23,marginBottom:7},
  sectionNote:{color:"#A9A39A",fontSize:10,letterSpacing:1.1},
  management:{marginTop:27,borderTopWidth:1,borderTopColor:"rgba(255,255,255,0.12)",paddingTop:21},
  managementTitle:{color:"#AAA8A5",fontSize:11,fontWeight:"700",letterSpacing:1.5,marginBottom:8},
  resetRow:{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:14,paddingHorizontal:12,borderRadius:15,backgroundColor:"rgba(255,255,255,0.035)"},
  resetTitle:{color:"#E5E3E0",fontSize:13,fontWeight:"700",letterSpacing:0.8},
  resetSubtitle:{color:"#999794",fontSize:11,marginTop:5},
  disclaimer:{color:"#878787",fontSize:11,textAlign:"center",lineHeight:17,marginTop:28},
});
