import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useDiscovery } from "@/components/discovery/DiscoveryProvider";
import { goals, profileNextStep } from "@/lib/journey-profile";
import { colors, surface, type } from "@/theme/architect";

export default function JourneyFocus({ settings = false }: { settings?: boolean }) {
  const { profile, openProfile } = useDiscovery();
  const next = profileNextStep(profile?.goal ?? null);
  const goal = goals.find((item) => item.id === profile?.goal);
  if (!settings && !next) return null;
  return (
    <TouchableOpacity accessibilityRole="button"
      onPress={() => settings || !next ? openProfile() : router.push(next.route)} style={styles.card}>
      <View style={surface.icon}><Ionicons name="compass-outline" color={colors.gold} size={23} /></View>
      <View style={styles.copy}>
        <Text style={type.eyebrow}>{settings ? "PERSONALISE TREKSOR" : "BASED ON YOUR FOCUS"}</Text>
        <Text style={type.card}>{settings ? "Your focus & preferences" : next?.title}</Text>
        <Text style={type.caption}>{settings ? goal?.label ?? "Choose what matters to you right now." : next?.detail}</Text>
      </View>
      <Ionicons name="chevron-forward" color={colors.gold} size={18} />
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({
  card: { ...surface.card, marginTop: 16, padding: 16, flexDirection: "row", alignItems: "center", gap: 12 },
  copy: { flex: 1, gap: 4, minWidth: 0 },
});
