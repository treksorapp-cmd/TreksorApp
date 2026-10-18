import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GOLD = "#F5BC4F";
type Action = { label: string; icon: React.ComponentProps<typeof Ionicons>["name"]; href: Href };
type Props = { title: string; headline: string; subtitle: string; image: number; actions: Action[]; align?: "bottom" | "middle" };

export default function PremiumPillarScreen({ title, headline, subtitle, image, actions, align = "bottom" }: Props) {
  return <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
    <ImageBackground source={image} contentFit="cover" style={StyleSheet.absoluteFill} />
    <LinearGradient colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.08)", "#050505", "#050505"]} locations={[0, 0.32, 0.7, 1]} style={StyleSheet.absoluteFill} />
    <View style={styles.header}>
      <TouchableOpacity accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={25} color="white" /></TouchableOpacity>
      <Text style={styles.title}>{title}</Text><View style={{ width: 35 }} />
    </View>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={{ flex: align === "middle" ? 0.8 : 1, minHeight: align === "middle" ? 160 : 240 }} />
      <Text style={[styles.headline, align === "middle" && styles.poetic]}>{headline}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.actions}>{actions.map(action => <TouchableOpacity key={action.label} onPress={() => router.push(action.href)} style={styles.action}>
        <Ionicons name={action.icon} color={GOLD} size={23} /><Text style={styles.actionText}>{action.label}</Text><Ionicons name="chevron-forward" size={19} color="#D3B176" />
      </TouchableOpacity>)}</View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050505" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 21, height: 57 },
  back: { width: 35, justifyContent: "center" },
  title: { fontSize: 19, fontWeight: "700", color: "white" },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 },
  headline: { fontSize: 31, lineHeight: 35, fontWeight: "800", color: "white", maxWidth: 330, textTransform: "uppercase" },
  poetic: { fontFamily: "serif", fontSize: 28, lineHeight: 34, fontWeight: "400", textTransform: "none" },
  subtitle: { fontSize: 14, lineHeight: 22, color: "#E2DEDA", marginTop: 8, marginBottom: 23 },
  actions: { gap: 9 },
  action: { minHeight: 60, flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 17, borderRadius: 12, backgroundColor: "rgba(17,18,18,0.91)", borderWidth: 1, borderColor: "#353535" },
  actionText: { color: "#F8F8F8", fontSize: 15, flex: 1, fontWeight: "500" },
});