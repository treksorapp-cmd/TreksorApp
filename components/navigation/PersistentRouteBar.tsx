import BrandIcon from "@/components/ui/BrandIcon";
import { routeBarContext } from "@/lib/route-bar-context";
import { colors } from "@/theme/architect";
import { router, useLocalSearchParams, usePathname, type Href } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * A single fixed header for authenticated navigation, rendered by the root
 * Stack rather than placed inside an individual scrolling screen.
 * All icons are derived from the existing Treksor brand/pillar identity map.
 */
export default function PersistentRouteBar() {
  const pathname = usePathname();
  const params = useLocalSearchParams<{ origin?: string }>();
  const route = useMemo(
    () => routeBarContext(pathname, typeof params.origin === "string" ? params.origin : undefined),
    [pathname, params.origin]
  );

  const goBack = () => {
    if (route.isHome) return;
    if (router.canGoBack()) router.back();
    else router.replace(route.parentRoute as Href);
  };
  const goHome = () => router.navigate("/(tabs)/home");
  const goSection = () => router.navigate(route.sectionRoute as Href);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.bar}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityState={{ disabled: route.isHome }}
          disabled={route.isHome}
          activeOpacity={0.75}
          onPress={goBack}
          style={[styles.iconButton, route.isHome && styles.disabled]}
        >
          <BrandIcon name="arrow-back" color={colors.gold} size={20} />
        </TouchableOpacity>

        <Text
          accessible
          accessibilityRole="header"
          accessibilityLabel={"Current location: " + route.breadcrumb}
          numberOfLines={1}
          ellipsizeMode="middle"
          style={styles.breadcrumb}
        >
          {route.breadcrumb}
        </Text>

        <View style={styles.trailing}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go to Home"
            activeOpacity={0.75}
            onPress={goHome}
            style={styles.iconButton}
          >
            <BrandIcon name="home-outline" color={colors.gold} size={20}/>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={"Open " + route.breadcrumb.split(" / ")[0]}
            activeOpacity={0.75}
            onPress={goSection}
            style={[styles.iconButton, styles.pillarButton]}
          >
            <BrandIcon name={route.icon} color={colors.gold} size={20}/>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    minHeight: 50,
    gap: 7,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 11,
    borderColor: colors.border,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  disabled: { opacity: 0.35 },
  breadcrumb: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontWeight: "600",
    fontSize: 13,
    letterSpacing: 0.1,
  },
  trailing: { flexDirection: "row", alignItems: "center", gap: 7 },
  pillarButton: {
    borderColor: colors.gold,
    backgroundColor: colors.goldSoft,
  },
});
