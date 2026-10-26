import {colors} from "@/theme/architect";
import BodyPageHeading from "@/components/BodyPageHeading";
import { Nutritions } from "@/mock/nutrition";
import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GOLD = "#D7B877";
const supplements = Nutritions.supplements.data;

export default function SupplementDetails() {
  const { id } = useLocalSearchParams<{ id?: string | string[] }>();
  const selectedId = Array.isArray(id) ? id[0] : id;
  const supplement = supplements.find(item => item.id === selectedId);

  if (!supplement) {
    return <SafeAreaView style={styles.screen}>
      <BodyPageHeading title="Supplement unavailable" trail="BODY / NUTRITION" style={{paddingTop:12}} />
      <View style={styles.empty}>
        <Ionicons name="nutrition-outline" size={30} color={GOLD} />

        <Text style={styles.description}>Choose Creatine, Omega-3 or B12 from Nutrition.</Text>
      </View>
    </SafeAreaView>;
  }

  const openReference = async () => {
    try {
      const supported = await Linking.canOpenURL(supplement.url);
      if (supported) await Linking.openURL(supplement.url);
    } catch (error) {
      console.warn("Unable to open supplement reference", error);
    }
  };

  return (
    <View style={styles.screen}>
      <ImageBackground source={supplement.backgroundImage} contentFit="cover" style={StyleSheet.absoluteFill} />
      <LinearGradient colors={["rgba(5,5,5,0.58)", "rgba(5,5,5,0.84)", "#050505"]} locations={[0,0.48,1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe}>
        <BodyPageHeading trail="BODY / NUTRITION / SUPPLEMENTS" title={supplement.name} style={{marginTop:12}} />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.glassCard}>
            <LinearGradient pointerEvents="none" colors={["rgba(255,255,255,0.10)", "rgba(255,255,255,0.025)"]} style={StyleSheet.absoluteFill} />
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.description}>{supplement.description}</Text>
          </View>
          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={21} color={GOLD} />
            <Text style={styles.noteText}>{supplement.warning}</Text>
          </View>
          <TouchableOpacity onPress={openReference} activeOpacity={0.78} accessibilityRole="link" style={styles.source}>
            <Text style={styles.sourceText}>{supplement.source}</Text>
            <Ionicons name="open-outline" size={17} color={GOLD} />
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  header: { height: 62, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24 },
  headerTitle: { color: "#F5F1E8", fontSize: 22, fontWeight: "600", lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
  scroll: { flexGrow: 1, justifyContent: "flex-start", paddingHorizontal: 22, paddingTop: 24, paddingBottom: 54 },
  eyebrow: { color: GOLD, fontSize: 11, letterSpacing: 2, fontWeight: "700", marginBottom: 14 },
  title: { color: "#F5F1E8", fontSize: 34, fontWeight: "600", marginBottom: 24, lineHeight: 42, letterSpacing: -0.6, includeFontPadding: false, },
  glassCard: { overflow: "hidden", borderRadius: 20,  backgroundColor: "rgba(255,255,255,0.05)", padding: 22 },
  sectionTitle: { color: "#F5F1E8", fontSize: 18, fontWeight: "600", marginBottom: 14, lineHeight: 23, letterSpacing: -0.2, includeFontPadding: false, },
  description: { color: "#E4E0D8", fontSize: 16, lineHeight: 25 },
  note: { marginTop: 22, flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 4 },
  noteText: { flex: 1, color: "#D5C9B7", fontSize: 13, lineHeight: 20 },
  source: { marginTop: 22, flexDirection: "row", alignItems: "center", gap: 8, padding: 15, borderRadius: 14,  backgroundColor: "rgba(215,184,119,0.07)" },
  sourceText: { flex: 1, color: "#D7B877", fontSize: 13, lineHeight: 19 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, gap: 16 },
  heading: { color: "#F5F1E8", fontSize: 22, fontWeight: "600", lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
});
