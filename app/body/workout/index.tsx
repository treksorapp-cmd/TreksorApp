import Header from "@/components/ui/Header";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {useWorkoutStore} from "@/store/workout-store";
import {Alert} from "react-native";
import {playCompletionFeedback} from "@/lib/completion-feedback";
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
  const week=[monday.getFullYear(),String(monday.getMonth()+1).padStart(2,"0"),String(monday.getDate()).padStart(2,"0")].join("-");
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
          <View style={styles.backButton} />
          <Text style={styles.headerTitle}>Gym</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={[styles.content, { paddingBottom: insets.bottom + 30 }]}>
          {plan&&<View style={{width:width-40,padding:16,borderRadius:15,backgroundColor:"rgba(10,12,12,.88)",borderWidth:1,borderColor:"#9B793F",marginBottom:12}}><Text style={{color:"#E8B44D",fontWeight:"800",letterSpacing:1.5}}>YOUR WEEKLY GOAL</Text><Text style={{color:"white",fontSize:21,fontWeight:"700",marginTop:8}}>{completed} / {plan.days} sessions completed</Text><Text style={{color:"#CFC8BB",marginTop:5}}>{plan.location} · Monday to Sunday</Text><TouchableOpacity disabled={completed>=plan.days} onPress={()=>{checkIn(week);void playCompletionFeedback();Alert.alert(completed+1>=plan.days?"🏆 WEEKLY GOAL ACHIEVED!":"✨ SESSION COMPLETE",completed+1>=plan.days?"You did it! Every session counts.":"Great work. Keep your momentum going!")}} style={{backgroundColor:completed>=plan.days?"#26362C":"#E8B44D",padding:13,borderRadius:11,marginTop:14,alignItems:"center"}}><Text style={{color:completed>=plan.days?"#B7DCC0":"#17130B",fontWeight:"800"}}>{completed>=plan.days?"✓ WEEK COMPLETE":"✓ CHECK IN · SESSION DONE"}</Text></TouchableOpacity></View>}
          <View style={{width:width-40,backgroundColor:"rgba(12,13,13,.94)",padding:14,borderRadius:17,borderWidth:1,borderColor:"#665334"}}>
            <Text style={{color:"#F4F0E8",fontWeight:"800",fontSize:17,marginBottom:12,letterSpacing:1}}>GYM</Text>
            {[
              {title:"BUILD MY PLAN",sub:"Create your personal training plan",url:"/body/workout/guide",color:"#F5C562",icon:"options-outline"},
              {title:"MY PLAN",sub:"Your weekly sessions and exercises",url:"/body/workout/my-plan",color:"#DDAE49",icon:"calendar-outline"},
              {title:"EXERCISE LIBRARY",sub:"Explore movements and technique",url:"/body/workout/library",color:"#BB8D37",icon:"book-outline"}
            ].map(item=><TouchableOpacity key={item.title} onPress={()=>router.push(item.url as any)} style={{backgroundColor:item.color,borderRadius:11,padding:14,marginBottom:9,flexDirection:"row",alignItems:"center",gap:12}}>
              <Ionicons name={item.icon as any} size={21} color="#1C160B"/>
              <View style={{flex:1}}><Text style={{color:"#1C160B",fontWeight:"800",fontSize:15}}>{item.title}</Text><Text style={{color:"#46371D",fontSize:11,marginTop:4}}>{item.sub}</Text></View>
              <Ionicons name="chevron-forward" size={19} color="#1C160B"/>
            </TouchableOpacity>)}
            <TouchableOpacity onPress={()=>router.push("/body/workout/progress")} style={{padding:13,flexDirection:"row",alignItems:"center",gap:12}}><Ionicons name="stats-chart-outline" color="#F5C562" size={20}/><Text style={{color:"#F5C562",fontWeight:"700",flex:1}}>Gym Progress</Text><Ionicons name="chevron-forward" color="#F5C562" size={17}/></TouchableOpacity>
          </View>
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

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    width: "100%",
    flex: 1,
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
    fontSize: 17,
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
