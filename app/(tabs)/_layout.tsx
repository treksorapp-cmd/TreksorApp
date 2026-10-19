"use client";

import { useArticleStore } from "@/store/article-store";
import { useAuthStore } from "@/store/auth-store";
import {
  AntDesign,
  MaterialIcons,
  Octicons,
  SimpleLineIcons,
} from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  Platform,
  StyleSheet,
  View
} from "react-native";

export default function TabLayout() {
  const { isAuthenticated, isVerified } = useAuthStore();
  const [badge, setBadge] = React.useState<number>(0);
  const [offerings, setOfferings] = React.useState<any>([]);


  useEffect(() => {
    setBadge(useArticleStore.getState().unreadArticlesCount);
  }, [useArticleStore.getState().unreadArticlesCount]);

  if (!isAuthenticated || !isVerified) return <Redirect href="/" />;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* pricing popup/modal */}
  

      {/* tabs */}
      <Tabs
        key={badge}
        screenOptions={{
          animation: "shift",
          sceneStyle: {
            backgroundColor: "#050505",
          },
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
              backgroundColor: "#02050C",
            },
            default: {
              backgroundColor: "#02050C",
            },
          }),
          tabBarActiveTintColor: "#F5BC4F",
          tabBarInactiveTintColor: "#888888",
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
            title: "Tracking",
            tabBarIcon: ({ color }) => (
              <SimpleLineIcons name="graph" size={24} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="articles"
          options={() => {
            const badge = useArticleStore.getState().unreadArticlesCount;
            return {
              title: "Articles",
              tabBarIcon: ({ color }) => (
                <MaterialIcons name="article" size={24} color={color} />
              ),
              tabBarBadge: badge > 0 ? badge : undefined,
            };
          }}
        />

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
