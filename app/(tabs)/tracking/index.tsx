"use client";

import ActivityLogModal from "@/components/ActivityLogModal";
import { getEntries, moodAverage } from "@/lib/mood-journal";
import { useAuthStore } from "@/store/auth-store";
import AddTrackerModal from "@/components/AddTrackerModal";
import TrackingCard from "@/components/TrackingCard";
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
        <ActivityIndicator size="large" color="#F39C12" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.premiumTitle}>Your progress</Text>
      <Text style={styles.periodNote}>Small steps. Real momentum.</Text>
      {/* Streak Section */}
      <View style={styles.streakContainer}>
        <View style={styles.streakContent}>
          <Text style={{color:"#E8B44D",fontWeight:"700",fontSize:13}}>LOG YOUR DAY</Text>
        </View>
        <View style={{ flexDirection: "row", gap: 5 }}>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={() => setShowAddTracker(true)}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.calendarButton}
            onPress={openCalendar}
          >
            <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tracking Cards */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.push("/mind/journal")} style={{backgroundColor:"#1A1D22",borderColor:"#E8B44D",borderWidth:1,borderRadius:15,padding:18,marginBottom:20}}><Text style={{color:"#E8B44D",fontWeight:"700",letterSpacing:1}}>DAILY CHECK-IN</Text><Text style={{color:"#fff",fontSize:19,fontWeight:"700",marginTop:8}}>How are you feeling today? →</Text><Text style={{color:"#aaa",marginTop:6}}>Reflect, record and see your progress over time</Text></TouchableOpacity>
        <Text style={styles.sectionHeading}>Your progress</Text>
        {trackingData.map((data, index) => (
          <TrackingCard
            key={index}
            title={data.title}
            percentage={data.percentage}
            items={data.items}
            custom={data.custom}
          />
        ))}
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
  premiumTitle: { color: "#fff", fontSize: 28, fontWeight: "700", textAlign: "left", marginHorizontal: 20, marginTop: 20, marginBottom: 4 },
  periodRow: { flexDirection: "row", marginHorizontal: 18, backgroundColor: "#1D1D1D", borderRadius: 10, padding: 4 },
  periodButton: { flex: 1, paddingVertical: 11, alignItems: "center", borderRadius: 8 },
  periodActive: { backgroundColor: "#F5BC4F" },
  periodText: { color: "#aaa", fontWeight: "600" },
  periodTextActive: { color: "#111" },
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
