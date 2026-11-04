import { useArticleStore } from "@/store/article-store";
import { useAuthStore } from "@/store/auth-store";
import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet, View } from "react-native";

const BACKGROUND = "#02050C";
const ACCENT = "#EFB33F";
const MUTED = "#9AA4B3";

export default function TabLayout() {
  const { isAuthenticated, isVerified } = useAuthStore();
  // Subscribe to updates without remounting all tabs when the badge changes.
  const unreadArticles = useArticleStore((state) => state.unreadArticlesCount);

  if (!isAuthenticated || !isVerified) {
    return <Redirect href="/" />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: BACKGROUND },
          tabBarActiveTintColor: ACCENT,
          tabBarInactiveTintColor: MUTED,
          tabBarHideOnKeyboard: true,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
          tabBarStyle: styles.tabBar,
          tabBarBadgeStyle: styles.tabBadge,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarAccessibilityLabel: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={23} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarAccessibilityLabel: "AI companion chat",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} size={23} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tracking"
          options={{
            title: "Progress",
            tabBarAccessibilityLabel: "Progress tracking",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={23} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="articles"
          options={{
            title: "Articles",
            tabBarAccessibilityLabel: "Articles",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? "newspaper" : "newspaper-outline"} size={23} color={color} />
            ),
            tabBarBadge: unreadArticles > 0 ? (unreadArticles > 99 ? "99+" : unreadArticles) : undefined,
          }}
        />
        <Tabs.Screen name="index" redirect />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  tabBar: {
    backgroundColor: BACKGROUND,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.14)",
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 6 : 8,
    minHeight: Platform.OS === "ios" ? 61 : 64,
    elevation: 0,
  },
  tabItem: {
    paddingVertical: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  tabBadge: {
    backgroundColor: ACCENT,
    color: BACKGROUND,
    fontSize: 10,
    fontWeight: "700",
  },
});
