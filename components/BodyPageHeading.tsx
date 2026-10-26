import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, usePathname, type Href } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, surface, type } from "@/theme/architect";
import { displayLabel, pillars, resolvePillar, type PillarKey } from "@/lib/pillar-navigation";
type Props = {
    title: string;
    trail: string;
    subtitle?: string;
    pillar?: PillarKey;
    navigation?: boolean;
    onBack?: () => void;
    style?: StyleProp<ViewStyle>;
};
// Controls occupy a separate row; long titles always retain the full text width.
export default function BodyPageHeading({ title, trail, subtitle, pillar, navigation, onBack, style }: Props) {
    const pathname = usePathname();
    const params = useLocalSearchParams<{
        pillar?: string;
    }>();
    const key = pillar ?? resolvePillar(pathname, params.pillar);
    const destination = key ? pillars[key] : undefined;
    const showNavigation = navigation ?? Boolean(destination);
    return <View style={[styles.container, style]}>
    <View style={styles.topRow}>
      <Text style={styles.trail}>{trail.toUpperCase()}</Text>
      {showNavigation && <View style={styles.actions}>
        {onBack && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" style={styles.icon} onPress={onBack}><Ionicons name="arrow-back" size={21} color={colors.text}/></TouchableOpacity>}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go to Home" style={styles.icon} onPress={() => router.dismissTo("/(tabs)/home")}><Ionicons name="home-outline" size={21} color={colors.text}/></TouchableOpacity>
        {destination && <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Return to ${destination.name}`} style={styles.icon} onPress={() => router.dismissTo(destination.route as Href)}><Ionicons name={destination.icon} size={22} color={colors.gold}/></TouchableOpacity>}
      </View>}
    </View>
    <Text accessibilityRole="header" style={styles.title}>{displayLabel(title)}</Text>
    {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
    container: { paddingHorizontal: 22 },
    topRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10 },
    trail: { ...type.eyebrow, flex: 1, minWidth: 0 },
    actions: { flexDirection: "row", gap: 8, flexShrink: 0 },
    icon: surface.icon, title: type.page, subtitle: { ...type.body, marginTop: 8 },
});
