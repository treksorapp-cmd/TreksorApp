import JourneyCard from "@/components/JourneyCard";
import WeeklyHabits from "@/components/WeeklyHabits";
import {getSharedTodayDates} from "@/lib/shared-today";
import {localDay} from "@/lib/weekly-habits";
import {useAuthStore} from "@/store/auth-store";
import { colors } from "@/theme/architect";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, {useCallback,useState} from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TodayScreen() {
  const userId=useAuthStore(s=>s.isAuthenticated?s.user?.id:undefined);
  const [shared,setShared]=useState<boolean|null>(null);
  const [syncError,setSyncError]=useState(false);
  const [revision,setRevision]=useState(0);
  useFocusEffect(useCallback(()=>{
    let active=true;
    setShared(null);setSyncError(false);
    if(userId){void getSharedTodayDates(userId).then(days=>{if(active)setShared(days.includes(localDay()))}).catch(()=>{if(active)setSyncError(true)});}
    return()=>{active=false};
  },[userId,revision]));
  return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 38 }}>
      {shared===true&&<View accessibilityRole="text" style={{backgroundColor:colors.surface,borderColor:colors.gold,borderWidth:1,borderRadius:12,padding:13,flexDirection:"row",gap:9,alignItems:"center",marginBottom:10}}><Ionicons name="cloud-done-outline" size={20} color={colors.gold}/><Text style={{color:colors.text,flex:1,fontSize:13}}>Today completion is recorded in your Treksor account. Your private notes remain on this device.</Text></View>}
      <JourneyCard />
      <TouchableOpacity accessibilityRole="button" onPress={()=>setRevision(v=>v+1)} style={{alignSelf:"flex-end",paddingVertical:10,paddingHorizontal:3,flexDirection:"row",gap:6,alignItems:"center"}}><Ionicons name="sync-outline" color={colors.gold} size={15}/><Text style={{color:colors.gold,fontSize:12}}>{syncError?"Retry shared Today":"Refresh shared Today"}</Text></TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open Quick Notes and tasks" onPress={()=>router.push("/notes" as any)} style={{flexDirection:"row",alignItems:"center",gap:12,padding:15,borderRadius:14,borderColor:colors.border,borderWidth:1,backgroundColor:colors.surface,marginTop:15}}>
        <Ionicons name="create-outline" size={22} color={colors.gold}/><View style={{flex:1}}><Text style={{color:colors.text,fontWeight:"600",fontSize:15}}>Quick Notes</Text><Text style={{color:colors.muted,fontSize:12,marginTop:4}}>Write it down. Get it done.</Text></View><Ionicons name="chevron-forward" size={19} color={colors.gold}/>
      </TouchableOpacity>
      <WeeklyHabits />
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Explore goals and weekly review" activeOpacity={0.82}
        onPress={() => router.push("/progress/journey" as any)}
        style={{ minHeight: 60, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, marginTop: 22 }}>
        <Ionicons name="analytics-outline" size={23} color={colors.gold}/>
        <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: "600", fontSize: 15 }}>Your journey</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>Goals, connections & weekly review</Text></View>
        <Ionicons name="chevron-forward" size={19} color={colors.gold}/>
      </TouchableOpacity>
    </ScrollView>
  </SafeAreaView>;
}
