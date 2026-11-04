"use client";

import { useAuthStore } from "@/store/auth-store";
import { useUserStore } from "@/store/user-store";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import type React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderProps {
  title?: string;
  showAvatar?: boolean;
  showBackButton?: boolean;
  headerRightButton?: React.ReactNode;
  onBackPress?: () => void;
  showTitle?: boolean
}

const Header: React.FC<HeaderProps> = ({
  title,
  showAvatar = true,
  showBackButton = false,
  headerRightButton = null,
  onBackPress,
  showTitle = true
}) => {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const {setShowPackages} = useUserStore();



  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const displayName = user?.name ? user.name.split(" ")[0] : "there";
  const imageUrl = `https://app.treksor.com/${user?.avatar}`;

  return (
    <LinearGradient
      colors={["rgba(0,0,0,0.9)", "rgba(0,0,0,0.7)"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {!user?.plan && (
        <View style={styles.trialBanner}>
          <Ionicons name="sparkles-outline" size={18} color="#02050C" />
          <Text style={styles.trialText} numberOfLines={2}>
            {user?.daysLeft != null && Number.isFinite(Number(user.daysLeft))
              ? `Premium trial · ${Math.max(0, Number(user.daysLeft))} ${Number(user.daysLeft) === 1 ? "day" : "days"} left`
              : "Discover Treksor Premium"}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Explore premium plans"
            onPress={() => setShowPackages(true)}
            activeOpacity={0.85}
            style={styles.trialAction}
          >
            <Text style={styles.trialActionText}>Explore</Text>
          </TouchableOpacity>
        </View>
      )}
      {/* Header Content */}
      {showTitle && <View style={styles.headerContent}>
        {showBackButton ? (
          <TouchableOpacity style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back" onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}

        <View style={title ? styles.absoluteTitleWrapper : {}}>
          <View style={styles.titleContainer}>
            {!title ? (
              <Text style={styles.title} numberOfLines={1}>{getGreeting()}, {displayName}</Text>
            ) : (
              <Text style={styles.title}>{title}</Text>
            )}
          </View>
        </View>

        {headerRightButton && (
          <View style={styles.headerRightButtonContainer}>
            {headerRightButton}
          </View>
        )}

        {showAvatar && (
          <TouchableOpacity
            style={styles.avatarContainer}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => router.push("/profile")}
            activeOpacity={0.8}
          >
            {user?.avatar ? (
              <Image source={{ uri: imageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{displayName.charAt(0)}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  trialBanner: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: "#EFB33F",
  },
  trialText: {
    flex: 1,
    color: "#02050C",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
  },
  trialAction: {
    minHeight: 36,
    paddingHorizontal: 14,
    backgroundColor: "#02050C",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  trialActionText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  container: {
    width: "100%",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  backButton: {
    padding: 5,
  },
  greeting: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
    opacity: 0.9,
  },
  name: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#17212F",
    borderColor: "rgba(239,179,63,0.45)",
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerRightButtonContainer: {
    width: "auto",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    minHeight: 64,
    position: "relative",
  },
  absoluteTitleWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 0,
    paddingHorizontal: 64,
  },
  titleContainer: {
    flexShrink: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontWeight: "700",
    fontSize: 21,
    letterSpacing: 0.2,
    color: "#FFFFFF",
    textAlign: "center",
  },
});

export default Header;
