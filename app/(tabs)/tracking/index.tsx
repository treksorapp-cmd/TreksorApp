"use client";

import ActivityLogModal from "@/components/ActivityLogModal";
import { getEntries, moodAverage } from "@/lib/mood-journal";
import { useAuthStore } from "@/store/auth-store";
import AddTrackerModal from "@/components/AddTrackerModal";
import CalendarModal from "@/components/ui/CalendarModal";
import { useTrackingStore } from "@/store/tracking-store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function TrackingScreen() {
  const { trackingData, fetchTrackingData, loading } = useTrackingStore();
  const userId = useAuthStore(s => s.user?.id);
  const [moodPeriod, setMoodPeriod] = useState<"week"|"month"|"year">("week");
  const [moodSummary, setMoodSummary] = useState<{average:number|null;days:number}>({average:null,days:0});

  const [showAddTracker, setShowAddTracker] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  
  const [selectedCategory, setSelectedCategory] = useState<
    string | undefined
  >();

  useFocusEffect(
    useCallback(() => {
      fetchTrackingData();
    }, [])
  );

  useFocusEffect(useCallback(() => { let active = true; if (userId) { getEntries(userId).then(entries => { if (active) setMoodSummary(moodAverage(entries,moodPeriod)); }).catch(() => { if (active) setMoodSummary({average:null,days:0}); }); } return () => { active=false; }; }, [userId,moodPeriod]));

  const customTrackers=trackingData.filter(d=>d.custom && !["BODY","MIND","SPIRITUAL","BALANCE","PURPOSE","ARTICLES"].includes(d.title.toUpperCase()));
  const pillarProgress = [
    {name:"BODY",icon:"barbell-outline" as const,keys:["body","physical","fitness","workout","exercise"]},
    {name:"MIND",icon:"book-outline" as const,keys:["mind","mental","journal","mood"]},
    {name:"BALANCE",icon:"shield-outline" as const,keys:["balance","spiritual","meditation","recovery"]},
    {name:"PURPOSE",icon:"compass-outline" as const,keys:["purpose","habit","goal","vision"]}
  ].map(p=>{const matches=trackingData.filter(d=>p.keys.some(k=>d.title.toLowerCase().includes(k)));const pct=matches.length?Math.round(matches.reduce((sum,d)=>sum+Math.max(0,Math.min(100,Number(d.percentage)||0)),0)/matches.length):null;return {...p,pct}});
  const handleDateSelect = (date: string) => {   
    setSelectedDate(date);
    setShowActivityLog(true);
  };

  const handleCategoryLog = (categoryTitle: string) => {
    setSelectedCategory(categoryTitle);
    setShowActivityLog(true);
  };

  const openCalendar = () => {
    setSelectedCategory(undefined);
    setShowCalendar(true);
  };

  if(loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5BD4F" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.premiumTitle}>Progress</Text>
      <Text style={styles.trackingSubtitle}>TRACKING</Text>
      <Text style={styles.periodNote}>Small steps. Real momentum.</Text>
      <Text style={styles.periodHeading}>{moodPeriod==="week"?"Progreso semanal":moodPeriod==="month"?"Progreso mensual":"Progreso anual"}</Text>
      <View style={styles.periodRow}>{(["week","month","year"] as const).map(period=><TouchableOpacity key={period} onPress={()=>setMoodPeriod(period)} style={[styles.periodButton,moodPeriod===period&&styles.periodActive]}><Text style={[styles.periodText,moodPeriod===period&&styles.periodTextActive]}>{period==="week"?"SEMANAL":period==="month"?"MENSUAL":"ANUAL"}</Text></TouchableOpacity>)}</View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={{backgroundColor:"rgba(67,72,72,0.28)",borderWidth:1,borderColor:"rgba(239,214,169,0.30)",borderRadius:18,padding:20,marginTop:17}}>
          <Text style={{color:"#F6F2EA",fontSize:18,fontWeight:"700"}}>The four pillars</Text>
          <Text style={{color:"#BBB5A9",fontSize:12,marginTop:6,marginBottom:23}}>Your progress, all in one place.</Text>
          {pillarProgress.map((p,i)=><View key={p.name} style={{marginBottom:i===3?0:23}}>
            <View style={{flexDirection:"row",alignItems:"center",marginBottom:11,gap:10}}>
              <Ionicons name={p.icon} size={19} color="#F5BD4F"/>
              <Text style={{color:"#F3EFE8",fontSize:13,fontWeight:"700",letterSpacing:1,flex:1}}>{p.name}</Text>
              <Text style={{color:p.pct===null?"#8C8983":"#F5BD4F",fontWeight:"800",fontSize:14}}>{p.pct===null?"—":p.pct+"%"}</Text>
            </View>
            <View style={{height:8,backgroundColor:"#383831",borderRadius:6,overflow:"hidden"}}>
              <View style={{height:"100%",width:`${p.pct??0}%`,backgroundColor:"#F5BD4F",borderRadius:6}}/>
            </View>
          </View>)}
          <Text style={{color:"#928D83",fontSize:11,marginTop:20,lineHeight:17}}>— means there is no tracking data for that pillar yet.</Text>
        </View>
        {customTrackers.length>0&&<View style={{marginTop:20,backgroundColor:"rgba(67,72,72,0.28)",borderWidth:1,borderColor:"rgba(239,214,169,0.28)",borderRadius:16,padding:19}}>
          <Text style={{color:"#F5F1E8",fontWeight:"700",fontSize:17,marginBottom:15}}>Your trackers</Text>
          {customTrackers.map(t=><TouchableOpacity key={t.id} onPress={()=>{setSelectedCategory(t.id);setShowActivityLog(true)}} style={{flexDirection:"row",alignItems:"center",gap:13,paddingVertical:12,borderBottomWidth:1,borderBottomColor:"#34332F"}}>
            <View style={{height:35,width:35,borderRadius:10,backgroundColor:"#30281C",alignItems:"center",justifyContent:"center"}}><Ionicons name="bookmark-outline" size={20} color="#F5BD4F"/></View>
            <View style={{flex:1}}><Text style={{color:"#F5F1E8",fontSize:15,fontWeight:"700"}}>{t.title}</Text><Text style={{color:"#BEB8AD",fontSize:12,marginTop:3}}>{t.items.length} tracking {t.items.length===1?"item":"items"}</Text></View>
            <Ionicons name="chevron-forward" color="#F5BD4F" size={18}/>
          </TouchableOpacity>)}
        </View>}
        <View style={{flexDirection:"row",gap:12,marginTop:16}}>
          <TouchableOpacity onPress={()=>setShowAddTracker(true)} style={{flex:1,padding:15,borderRadius:12,backgroundColor:"rgba(103,107,105,0.25)",flexDirection:"row",justifyContent:"center",alignItems:"center",gap:8}}><Ionicons name="add" size={19} color="#F5BD4F"/><Text style={{color:"#F5BD4F",fontWeight:"700"}}>Add tracker</Text></TouchableOpacity>
          <TouchableOpacity onPress={openCalendar} style={{flex:1,padding:15,borderRadius:12,backgroundColor:"#24231E",flexDirection:"row",justifyContent:"center",alignItems:"center",gap:8}}><Ionicons name="calendar-outline" size={18} color="#F5BD4F"/><Text style={{color:"#F5BD4F",fontWeight:"700"}}>Calendar</Text></TouchableOpacity>
        </View>
      </ScrollView>
      <AddTrackerModal
        visible={showAddTracker}
        onClose={() => setShowAddTracker(false)}
      />

      <ActivityLogModal
        visible={showActivityLog}
        onClose={() => {
          setShowActivityLog(false);
          setSelectedCategory(undefined);
        }}
        selectedDate={selectedDate}
      />

      <CalendarModal
        visible={showCalendar}
        onClose={() => setShowCalendar(false)}
        onDateSelect={handleDateSelect}
        selectedDate={selectedDate}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  premiumTitle: { color: "#F5F1E8", fontSize: 28, fontWeight: "700", textAlign: "left", marginHorizontal: 20, marginTop: 20, marginBottom: 4 },
  trackingSubtitle: { color:"#F5F1E8",fontSize:16,fontWeight:"700",letterSpacing:2,marginHorizontal:20,marginBottom:3 },
  periodHeading: { color:"#F5F1E8",fontSize:20,fontWeight:"700",marginHorizontal:20,marginTop:18,marginBottom:12 },
  periodRow: { flexDirection: "row", marginHorizontal: 18, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 4 },
  periodButton: { flex: 1, paddingVertical: 11, alignItems: "center", borderRadius: 8 },
  periodActive: { backgroundColor: "rgba(255,255,255,0.18)" },
  periodText: { color: "#aaa", fontWeight: "600" },
  periodTextActive: { color: "#FFFFFF" },
  periodNote: { color: "#999", fontSize: 12, textAlign: "left", marginHorizontal: 20, marginTop: 4, marginBottom: 12 },
  sectionHeading: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 16 },
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  streakContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  streakText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  calendarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#AAAAAA",
    fontSize: 16,
    marginTop: 10,
  },
});
