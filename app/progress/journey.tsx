import BodyPageHeading from "@/components/BodyPageHeading";
import ConnectedJourney from "@/components/ConnectedJourney";
import GoalProgressCard from "@/components/GoalProgressCard";
import WeeklyReview from "@/components/WeeklyReview";
import { colors } from "@/theme/architect";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function JourneyDetailScreen() {
  const insets=useSafeAreaInsets();
  return <ScrollView style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{paddingHorizontal:20,paddingTop:insets.top+10,paddingBottom:insets.bottom+50}}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to Progress" onPress={()=>router.back()} style={{height:44,width:44,justifyContent:"center",marginBottom:6}}>
      <Ionicons name="arrow-back" size={24} color={colors.text}/>
    </TouchableOpacity>
    <BodyPageHeading title="Your journey" trail="PROGRESS" subtitle="Your goals, connected actions and weekly direction." style={{paddingHorizontal:0}}/>
    <View style={{marginTop:12}}>
      <GoalProgressCard />
      <ConnectedJourney />
      <WeeklyReview />
    </View>
  </ScrollView>;
}
