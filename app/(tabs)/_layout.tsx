"use client";

import { useAuthStore } from "@/store/auth-store";
import {
  AntDesign,
  MaterialIcons,
  Octicons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { Redirect, Tabs, usePathname } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions
} from "react-native";

export default function TabLayout() {
  const { isAuthenticated, isVerified } = useAuthStore();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const activeIndex = pathname.startsWith("/chat") ? 1 : pathname.startsWith("/tracking") ? 2 : pathname.startsWith("/community") ? 3 : 0;
  const glowPosition = useRef(new Animated.Value(activeIndex)).current;
  useEffect(() => {
    Animated.timing(glowPosition, { toValue: activeIndex, duration: 260, useNativeDriver: true }).start();
  }, [activeIndex, glowPosition]);

  if (!isAuthenticated || !isVerified) return <Redirect href="/" />;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* pricing popup/modal */}
  

      {/* tabs */}
      <Tabs
        screenOptions={{
          animation: "shift",
          sceneStyle: {
            backgroundColor: "#050505",
          },
          tabBarBackground: () => (
            <View pointerEvents="none" style={StyleSheet.absoluteFill}>
              <View style={styles.goldDivider} />
              <Animated.View style={[styles.glowTrack, { width: width / 4, transform: [{ translateX: glowPosition.interpolate({ inputRange: [0, 3], outputRange: [0, width * 0.75] }) }] }]}>
                <LinearGradient colors={["transparent", "rgba(232,180,77,0.24)", "transparent"]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.glowHalo} />
                <LinearGradient colors={["transparent", "#E8B44D", "#FFF0BC", "#E8B44D", "transparent"]} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.glowLine} />
              </Animated.View>
            </View>
          ),
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
              backgroundColor: "#02050C",
              borderTopWidth: 0,
              elevation: 0,
            },
            default: {
              backgroundColor: "#02050C",
            },
          }),
          tabBarActiveTintColor: "#E8B44D",
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
              <AntDesign name="home" size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ color }) => (
              <Octicons name="dependabot" size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="tracking"
          options={{
            title: "Progress",
            tabBarIcon: ({ color }) => (
              <SimpleLineIcons name="graph" size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen name="articles" options={{href:null}} />

        <Tabs.Screen name="community" options={{title:"Community",tabBarIcon:({color})=><MaterialIcons name="groups" size={24} color={color}/>}} />
        <Tabs.Screen name="index" redirect />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
  goldDivider: { position: "absolute", top: 0, left: 0, right: 0, height: 1, backgroundColor: "rgba(232,180,77,0.32)" },
  glowTrack: { position: "absolute", top: -8, height: 24, alignItems: "center" },
  glowHalo: { position: "absolute", top: 0, width: "100%", height: 23, opacity: 0.95 },
  glowLine: { position: "absolute", top: 8, width: "92%", height: 2, borderRadius: 3 },
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
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
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
    borderColor: "#EFB33F",
  },
  proPackageCard: {
    backgroundColor: "#EFB33F",
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 5,
  },
  packagePrice: {
    fontSize: 16,
    color: "#fff",
  },
  subscribeButton: {
    backgroundColor: "#EFB33F",
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
