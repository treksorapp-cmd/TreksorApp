"use client";

import ActivityLogModal from "@/components/ActivityLogModal";
import AddTrackerModal from "@/components/AddTrackerModal";
import TrackingCard from "@/components/TrackingCard";
import CalendarModal from "@/components/ui/CalendarModal";
import { useTrackingStore } from "@/store/tracking-store";
import { Ionicons } from "@expo/vector-icons";
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

  const [period, setPeriod] = useState<"Week" | "Month" | "Year">("Week");
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

      <Text style={styles.premiumTitle}>Tracking</Text>
      <View style={styles.periodRow}>{(["Week", "Month", "Year"] as const).map(item => <TouchableOpacity key={item} onPress={() => setPeriod(item)} style={[styles.periodButton, period === item && styles.periodActive]}><Text style={[styles.periodText, period === item && styles.periodTextActive]}>{item}</Text></TouchableOpacity>)}</View>
      <Text style={styles.periodNote}>{period} overview · your recorded activities</Text>
      {/* Streak Section */}
      <View style={styles.streakContainer}>
        <View style={styles.streakContent}>
          {/* <Ionicons name="flame" size={24} color="#EFB33F" /> */}
          {/* <Text style={styles.streakText}>4-Day Streak</Text> */}
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
        <Text style={styles.sectionHeading}>Pillars</Text>
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
  premiumTitle: { color: "#fff", fontSize: 25, fontWeight: "800", textAlign: "center", marginTop: 12, marginBottom: 20 },
  periodRow: { flexDirection: "row", marginHorizontal: 18, backgroundColor: "#1D1D1D", borderRadius: 10, padding: 4 },
  periodButton: { flex: 1, paddingVertical: 11, alignItems: "center", borderRadius: 8 },
  periodActive: { backgroundColor: "#F5BC4F" },
  periodText: { color: "#aaa", fontWeight: "600" },
  periodTextActive: { color: "#111" },
  periodNote: { color: "#999", fontSize: 12, textAlign: "center", marginTop: 15 },
  sectionHeading: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 16 },
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
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
    paddingHorizontal: 10,
    paddingBottom: 100,
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
