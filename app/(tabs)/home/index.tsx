import { useNotifications } from "@/hooks/useNotifications";
import { useAuthStore } from "@/store/auth-store";
import { usePowerThoughtStore } from "@/store/thought-store";
import { useArticleStore } from "@/store/article-store";
import { useUserStore } from "@/store/user-store";
import { Ionicons } from "@expo/vector-icons";
import { Image, ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const pillars: { name: string; route: Href; image: number; caption: string }[] = [
  { name: "BODY", route: "/body", image: require("@/assets/images/body-ritual.png"), caption: "Train your strength" },
  { name: "MIND", route: "/mental", image: require("@/assets/images/mental-ritual.png"), caption: "Build your focus" },
  { name: "BALANCE", route: "/spiritual", image: require("@/assets/images/spiritual-ritual.png"), caption: "Find your balance" },
  { name: "PURPOSE", route: "/purpose", image: require("@/assets/images/purpose-home.png"), caption: "Live with intention" },
];
export default function HomeScreen() {
  const { user, getCurrentUser } = useAuthStore();
  const { powerThoughts, fetchPowerThoughts } = usePowerThoughtStore();
  const { getUnreadArticlesCount } = useArticleStore();
  const { pushToken } = useNotifications();
  const { savePushToken, setShowPackages } = useUserStore();
  useEffect(() => { fetchPowerThoughts(); getUnreadArticlesCount(); }, []);

  const thought = powerThoughts?.find(item => item.isToday)?.thought ?? powerThoughts?.[0]?.thought;
  const firstName = user?.name?.split(" ")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return <SafeAreaView style={styles.screen} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.top}><View style={styles.brand}><Image source={require("@/assets/images/appicon-treksor.png")} style={styles.logo} /><Text style={styles.brandText}>Treksor</Text></View>
        <TouchableOpacity onPress={() => router.push("/profile")} accessibilityLabel="Profile and notifications"><Ionicons name="notifications-outline" color="white" size={24} /></TouchableOpacity></View>
      {!user?.plan && <TouchableOpacity onPress={() => setShowPackages(true)} style={styles.premium}><Text style={styles.premiumText}>🔥 Explore Treksor Premium</Text><View style={styles.premiumPill}><Text style={styles.premiumPillText}>Go Premium</Text></View></TouchableOpacity>}
      <Text style={styles.greeting}>{greeting},{"\n"}{firstName}</Text><Text style={styles.tagline}>Small steps. Big changes.</Text>
      <View style={styles.grid}>{pillars.map(pillar => <TouchableOpacity key={pillar.name} onPress={() => router.push(pillar.route)} style={styles.tile}>
        <ImageBackground source={pillar.image} contentFit="cover" style={StyleSheet.absoluteFill} />
        <LinearGradient colors={["transparent", "rgba(0,0,0,0.94)"]} style={StyleSheet.absoluteFill} />
        <View style={styles.tileBottom}><Text style={styles.tileTitle}>{pillar.name}</Text><Text style={styles.tileCaption}>{pillar.caption}</Text></View>
      </TouchableOpacity>)}</View>
      <TouchableOpacity style={styles.thought} onPress={() => router.push("/mental/thoughts")}><Ionicons name="flash-outline" color="#F5BC4F" size={23} /><View style={{ flex: 1 }}><Text style={styles.thoughtText} numberOfLines={2}>{thought || "Discipline today creates the freedom you want tomorrow."}</Text><Text style={styles.thoughtHint}>Your daily Power Thought</Text></View><Ionicons name="chevron-forward" color="#F5BC4F" size={18} /></TouchableOpacity>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050505" }, content: { paddingHorizontal: 18, paddingBottom: 110 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 9, marginBottom: 17 },
  brand: { flexDirection: "row", alignItems: "center", gap: 9 }, logo: { width: 37, height: 37, borderRadius: 9 }, brandText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  premium: { backgroundColor: "#F5BC4F", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  premiumText: { color: "#17120A", fontSize: 12, fontWeight: "700", flexShrink: 1 },
  premiumPill: { backgroundColor: "#090909", borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7 },
  premiumPillText: { color: "#F5BC4F", fontSize: 10, fontWeight: "700" },
  greeting: { color: "#fff", fontSize: 27, lineHeight: 31, fontWeight: "800" },
  tagline: { color: "#AAA", fontSize: 13, marginTop: 5, marginBottom: 21 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "48%", aspectRatio: 0.91, borderRadius: 14, overflow: "hidden", borderWidth: 1, borderColor: "#303030", backgroundColor: "#151515" },
  tileBottom: { flex: 1, justifyContent: "flex-end", padding: 12 },
  tileTitle: { color: "#fff", fontSize: 19, fontWeight: "800" },
  tileCaption: { color: "#F5BC4F", fontSize: 11, marginTop: 4 },
  thought: { flexDirection: "row", gap: 12, alignItems: "center", backgroundColor: "#161616", borderWidth: 1, borderColor: "#4B3921", borderRadius: 13, marginTop: 16, padding: 16 },
  thoughtText: { color: "#F5F5F5", fontSize: 13, lineHeight: 19 }, thoughtHint: { color: "#B99553", fontSize: 10, marginTop: 5 },
});