import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import { colors, surface, type } from "@/theme/architect";
import { displayLabel } from "@/lib/pillar-navigation";
interface Props {
    title?: string;
    showAvatar?: boolean;
    showBackButton?: boolean;
    headerRightButton?: React.ReactNode;
    onBackPress?: () => void;
    showTitle?: boolean;
}
export default function Header({ title, showAvatar = true, showBackButton = false, headerRightButton, onBackPress, showTitle = true }: Props) {
    const insets = useSafeAreaInsets();
    const user = useAuthStore(s => s.user);
    const name = user?.name?.trim().split(" ")[0] || "there";
    const avatar = user?.avatar ? (user.avatar.startsWith("http") ? user.avatar : `https://app.treksor.com/${user.avatar.replace(/^\//, "")}`) : undefined;
    return <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
    <View style={styles.topRow}>
      <Text style={styles.eyebrow}>TREKSOR / {title ? displayLabel(title).toUpperCase() : "YOUR JOURNEY"}</Text>
      <View style={styles.actions}>
        {showBackButton && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" style={styles.icon} onPress={() => onBackPress ? onBackPress() : router.canGoBack() ? router.back() : router.replace("/(tabs)/home")}><Ionicons name="arrow-back" size={22} color={colors.text}/></TouchableOpacity>}
        {headerRightButton}
        {showAvatar && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open profile" style={styles.icon} onPress={() => router.push("/profile")}>{avatar ? <Image source={{ uri: avatar }} style={styles.avatar}/> : <Ionicons name="person-outline" size={22} color={colors.gold}/>}</TouchableOpacity>}
      </View>
    </View>
    {showTitle && <Text accessibilityRole="header" style={styles.title}>{title ? displayLabel(title) : `Welcome, ${name}`}</Text>}
  </View>;
}
const styles = StyleSheet.create({ header: { paddingHorizontal: 22, paddingBottom: 18, backgroundColor: colors.background }, topRow: { flexDirection: "row", gap: 12, alignItems: "center", marginBottom: 10 }, eyebrow: { ...type.eyebrow, flex: 1 }, actions: { flexDirection: "row", gap: 8 }, icon: surface.icon, avatar: { width: 44, height: 44, borderRadius: 13 }, title: type.page });
