import JourneyCard from "@/components/JourneyCard";
import { colors } from "@/theme/architect";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TodayScreen() {
  return <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 38 }}>
      <JourneyCard />
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
