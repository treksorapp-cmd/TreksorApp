import { useAuthStore } from "@/store/auth-store";
import { usePowerThoughtStore } from "@/store/thought-store";
import { Ionicons } from "@expo/vector-icons";
import { Image, ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GOLD = "#F3BF64";
const pillars: { name: string; subtitle: string; route: Href; image: number; icon: keyof typeof Ionicons.glyphMap; index: string }[] = [
  { name: "BODY", subtitle: "Strength & movement", route: "/body", image: require("@/assets/images/body-ritual.png"), icon: "barbell-outline", index: "01" },
  { name: "MIND", subtitle: "Clarity & focus", route: "/mental", image: require("@/assets/images/mental-ritual.png"), icon: "sparkles-outline", index: "02" },
  { name: "BALANCE", subtitle: "Calm & wellbeing", route: "/spiritual", image: require("@/assets/images/spiritual-ritual.png"), icon: "leaf-outline", index: "03" },
  { name: "PURPOSE", subtitle: "Direction & growth", route: "/purpose", image: require("@/assets/images/purpose-home.png"), icon: "compass-outline", index: "04" },
];

export default function HomeScreen() {
  const user = useAuthStore(state => state.user);
  const powerThoughts = usePowerThoughtStore(state => state.powerThoughts);
  const fetchPowerThoughts = usePowerThoughtStore(state => state.fetchPowerThoughts);
  useEffect(() => { fetchPowerThoughts(); }, [fetchPowerThoughts]);

  const firstName = user?.name?.trim().split(" ")[0] || "Explorer";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const thought = powerThoughts?.find(item => item.isToday)?.thought || powerThoughts?.[0]?.thought || "Small steps, taken consistently, create extraordinary change.";

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.top}>
          <View style={styles.brand}>
            <Image source={require("@/assets/images/appicon-treksor.png")} style={styles.logo} />
            <View>
              <Text style={styles.brandText}>TREKSOR</Text>
              <Text style={styles.brandCaption}>BECOME MORE</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push("/profile")} style={styles.profile} accessibilityLabel="Open profile">
            <Text style={styles.profileLetter}>{firstName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>YOUR SPACE TO GROW</Text>
          <Text style={styles.greeting}>{greeting},{"\n"}<Text style={styles.name}>{firstName}.</Text></Text>
          <Text style={styles.subtitle}>Every day is a chance to become more.</Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>THE TREKSOR METHOD</Text>
            <Text style={styles.sectionTitle}>Explore your pillars</Text>
          </View>
          <View style={styles.fourBadge}><Text style={styles.fourBadgeText}>04</Text></View>
        </View>

        <View style={styles.grid}>
          {pillars.map(pillar => (
            <TouchableOpacity key={pillar.name} activeOpacity={0.84} style={styles.tile} onPress={() => router.push(pillar.route)} accessibilityRole="button" accessibilityLabel={pillar.name + ": " + pillar.subtitle}>
              <ImageBackground source={pillar.image} contentFit="cover" style={StyleSheet.absoluteFill} />
              <LinearGradient colors={["rgba(0,0,0,0.20)", "rgba(0,0,0,0.22)", "rgba(0,0,0,0.95)"]} locations={[0, 0.34, 1]} style={StyleSheet.absoluteFill} />
              <View style={styles.tileTop}>
                <View style={styles.tileIcon}><Ionicons name={pillar.icon} color="#FFFFFF" size={18} /></View>
                <Text style={styles.tileIndex}>{pillar.index}</Text>
              </View>
              <View style={styles.tileBottom}>
                <Text style={styles.tileTitle}>{pillar.name}</Text>
                <Text style={styles.tileCaption}>{pillar.subtitle}</Text>
                <View style={styles.tileFooter}><Text style={styles.explore}>EXPLORE</Text><Ionicons name="arrow-forward" size={16} color={GOLD} /></View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.thoughtSection}>
          <View style={styles.thoughtHeading}><Ionicons name="sunny-outline" color={GOLD} size={19} /><Text style={styles.thoughtLabel}>A MOMENT OF INSPIRATION</Text></View>
          <TouchableOpacity style={styles.thoughtCard} activeOpacity={0.85} onPress={() => router.push("/mental/thoughts")}>
            <Text style={styles.quoteMark}>“</Text>
            <Text style={styles.thoughtText} numberOfLines={4}>{thought}</Text>
            <View style={styles.thoughtFooter}><Text style={styles.thoughtLink}>TODAY'S THOUGHT</Text><Ionicons name="arrow-forward" color={GOLD} size={18} /></View>
          </TouchableOpacity>
        </View>
        <Text style={styles.footer}>YOUR JOURNEY. YOUR PACE.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#08090B" },
  content: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 118 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 32 },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 11 },
  brandText: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", letterSpacing: 3 },
  brandCaption: { color: "#947F5A", fontSize: 8, fontWeight: "700", letterSpacing: 2.4, marginTop: 3 },
  profile: { height: 42, width: 42, borderRadius: 21, backgroundColor: "#25201A", borderColor: "#685131", borderWidth: 1, alignItems: "center", justifyContent: "center" },
  profileLetter: { color: GOLD, fontWeight: "800", fontSize: 17 },
  intro: { marginBottom: 34 },
  eyebrow: { color: GOLD, fontSize: 10, fontWeight: "800", letterSpacing: 2.7, marginBottom: 12 },
  greeting: { color: "#F8F7F5", fontSize: 38, lineHeight: 44, fontWeight: "800", letterSpacing: -1.1 },
  name: { color: GOLD },
  subtitle: { color: "#A9A7A4", fontSize: 14, lineHeight: 21, marginTop: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 17 },
  sectionEyebrow: { color: "#96876D", fontSize: 9, letterSpacing: 2, fontWeight: "800", marginBottom: 7 },
  sectionTitle: { color: "#FFFFFF", fontSize: 23, fontWeight: "800", letterSpacing: -0.5 },
  fourBadge: { width: 37, height: 37, borderRadius: 19, borderWidth: 1, borderColor: "#514332", alignItems: "center", justifyContent: "center" },
  fourBadgeText: { color: GOLD, fontSize: 12, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 13 },
  tile: { width: "48.3%", aspectRatio: 0.76, borderRadius: 21, overflow: "hidden", backgroundColor: "#191919", borderWidth: 1, borderColor: "#34302B" },
  tileTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 13 },
  tileIcon: { height: 34, width: 34, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.40)", borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", alignItems: "center", justifyContent: "center" },
  tileIndex: { color: "#FFFFFF", fontSize: 10, fontWeight: "700", opacity: 0.85 },
  tileBottom: { flex: 1, justifyContent: "flex-end", padding: 13 },
  tileTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "900", letterSpacing: 0.5 },
  tileCaption: { color: "#E4DBCA", fontSize: 11, marginTop: 5 },
  tileFooter: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.25)", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  explore: { color: GOLD, fontSize: 9, fontWeight: "800", letterSpacing: 1.6 },
  thoughtSection: { marginTop: 33 },
  thoughtHeading: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 14 },
  thoughtLabel: { color: GOLD, fontSize: 10, fontWeight: "800", letterSpacing: 1.8 },
  thoughtCard: { borderRadius: 20, borderWidth: 1, borderColor: "#493C29", backgroundColor: "#171512", padding: 22 },
  quoteMark: { color: GOLD, fontSize: 42, fontWeight: "700", height: 38 },
  thoughtText: { color: "#F4EEE5", fontSize: 18, lineHeight: 28, fontWeight: "600", marginTop: 4 },
  thoughtFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 22 },
  thoughtLink: { color: GOLD, fontSize: 9, fontWeight: "800", letterSpacing: 1.6 },
  footer: { color: "#71695D", textAlign: "center", marginTop: 29, fontSize: 9, fontWeight: "700", letterSpacing: 2.2 },
});
