import {colors} from "@/theme/architect";
"use client";

import { useAuthStore } from "@/store/auth-store";
import {
  AntDesign,
  MaterialIcons,
  Octicons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { Redirect, Tabs, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Platform,
  StyleSheet,
  View,
} from "react-native";

export default function TabLayout() {
  const { isAuthenticated, isVerified } = useAuthStore();

  if (!isAuthenticated || !isVerified) return <Redirect href="/(auth)" />;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* pricing popup/modal */}
  

      {/* tabs */}
      <Tabs
        initialRouteName="home"
        screenOptions={{
          animation: "shift",
          sceneStyle: {
            backgroundColor: colors.background,
          },
          tabBarBackground: () => <View pointerEvents="none" style={StyleSheet.absoluteFill}><View style={styles.goldDivider}/></View>,
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
              backgroundColor: colors.background,
              borderTopWidth: 0,
              elevation: 0,
            },
            default: {
              backgroundColor: colors.background,
            },
          }),
          tabBarActiveTintColor: "#D7B877",
          tabBarInactiveTintColor: "#BABABA",
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600", marginTop: 2 },
          tabBarItemStyle: { paddingVertical: 3 },
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <View style={styles.iconContainer}><AntDesign name="home" size={24} color={color} /></View>
            ),
          }}
        />

        <Tabs.Screen
          name="chat"
          options={{
            title: "Mentor",
            tabBarIcon: ({ color }) => (
              <View style={styles.iconContainer}><Octicons name="dependabot" size={24} color={color} /></View>
            ),
          }}
        />

        <Tabs.Screen
          name="tracking"
          options={{
            title: "Progress",
            tabBarIcon: ({ color }) => (
              <View style={styles.iconContainer}><SimpleLineIcons name="graph" size={24} color={color} /></View>
            ),
          }}
        />

        <Tabs.Screen name="articles" options={{href:null}} />

        <Tabs.Screen name="community" options={{title:"Community",tabBarIcon:({color})=><View style={styles.iconContainer}><MaterialIcons name="groups" size={24} color={color} /></View>}} />
        <Tabs.Screen name="index" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  goldDivider: { position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundColor: "rgba(215,184,119,0.14)" },
  iconContainer: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 99999999,
    flexGrow: 1,
    height: "100%",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#F5F4F1",
    marginBottom: 8,
    textAlign: "center", lineHeight: 29, letterSpacing: -0.2, includeFontPadding: false, },
  modalSubtitle: {
    fontSize: 14,
    color: "#ddd",
    textAlign: "center",
    marginBottom: 20,
  },
  packagesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  packageCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    paddingVertical: 20,
    marginHorizontal: 8,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D7B877",
  },
  proPackageCard: {
    backgroundColor: "#D7B877",
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#F5F4F1",
    marginBottom: 5, lineHeight: 23, letterSpacing: -0.2, includeFontPadding: false, },
  packagePrice: {
    fontSize: 16,
    color: "#fff",
  },
  subscribeButton: {
    backgroundColor: "#D7B877",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 25,
  },
  subscribeText: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },
});
