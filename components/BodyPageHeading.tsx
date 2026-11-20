import React from "react";
import { useFixedRouteHeader } from '@/lib/navigation-frame-context';
import Ionicons, { HOME_ICON } from '@/components/ui/BrandIcon';
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
    goldTitle?: boolean;
    compactSubtitle?: boolean;
};
// Controls occupy a separate row; long titles always retain the full text width.
export default function BodyPageHeading({ title, trail, subtitle, pillar, navigation, onBack, style, goldTitle=false, compactSubtitle=false }: Props) {
    const fixed = useFixedRouteHeader();
    const pathname = usePathname();
    const params = useLocalSearchParams<{
        pillar?: string;
    }>();
    const key = pillar ?? resolvePillar(pathname, params.pillar);
    const destination = key ? pillars[key] : undefined;
    const goBack = onBack ?? (typeof router.canGoBack === "function" && router.canGoBack() && !["/body","/mental","/spiritual","/purpose"].includes(pathname) ? () => router.back() : undefined);
    const showNavigation = navigation ?? Boolean(destination);
    return <View style={[styles.container, fixed && styles.withFixedHeader, style]}>
    {!fixed && <View style={styles.topRow}>
      <Text style={styles.trail}>{trail.toUpperCase()}</Text>
      {showNavigation && <View style={styles.actions}>
        {goBack && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" style={styles.icon} onPress={goBack}><Ionicons name="arrow-back" size={21} color={colors.text}/></TouchableOpacity>}
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go to Home" style={styles.icon} onPress={() => router.dismissTo("/(tabs)/home")}><Ionicons name={HOME_ICON} size={21} color={colors.text}/></TouchableOpacity>
        {destination && <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Return to ${destination.name}`} style={styles.icon} onPress={() => router.dismissTo(destination.route as Href)}>{key === "mind" ? <Ionicons name="brain" size={22} color={colors.gold}/> : <Ionicons name={destination.icon as "barbell-outline" | "leaf-outline" | "compass-outline"} size={22} color={colors.gold}/>}</TouchableOpacity>}
      </View>}
    </View>}
    <Text accessibilityRole="header" style={[styles.title,goldTitle&&styles.goldTitle]}>{displayLabel(title)}</Text>
    {subtitle ? <Text style={[styles.subtitle,compactSubtitle&&styles.compactSubtitle]}>{subtitle}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
    container: { paddingHorizontal: 22 },
    withFixedHeader: { paddingTop: 0, marginTop: 0 },
    goldTitle: { color: colors.gold },
    compactSubtitle: { marginTop:2, lineHeight:20, includeFontPadding:false },
    topRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
    trail: { ...type.eyebrow, flex: 1, minWidth: 0 },
    actions: { flexDirection: "row", gap: 8, flexShrink: 0 },
    icon: surface.icon, title: type.page, subtitle: { ...type.body, marginTop: 6 },
});
