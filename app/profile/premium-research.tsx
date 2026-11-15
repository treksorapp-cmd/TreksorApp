import PremiumInterestCard from "@/components/PremiumInterestCard";
import BodyPageHeading from "@/components/BodyPageHeading";
import { colors } from "@/theme/architect";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PremiumResearchScreen(){
 const insets=useSafeAreaInsets();
 return <ScrollView style={{flex:1,backgroundColor:colors.background}} contentContainerStyle={{paddingHorizontal:20,paddingTop:insets.top+10,paddingBottom:insets.bottom+42}}>
   <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to profile" onPress={()=>router.back()} style={{height:44,width:44,justifyContent:"center"}}>
     <Ionicons name="arrow-back" color={colors.text} size={24}/>
   </TouchableOpacity>
   <BodyPageHeading title="Shape Treksor" trail="OPTIONAL FEEDBACK" subtitle="Tell us what would earn a place in your daily routine." style={{paddingHorizontal:0}}/>
   <Text style={{color:colors.muted,fontSize:13,lineHeight:20,marginTop:14,marginBottom:8}}>This is product research, not a subscription or purchase. Nothing is charged.</Text>
   <PremiumInterestCard/>
 </ScrollView>;
}
