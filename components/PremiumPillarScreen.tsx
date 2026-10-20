import { Ionicons } from "@expo/vector-icons";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, type Href } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const GOLD = "#E8B44D";
type Action = { label: string; icon: React.ComponentProps<typeof Ionicons>["name"]; href: Href };
type Props = { title: string; headline: string; subtitle: string; image: number; actions: Action[]; align?: "bottom" | "middle" };

export default function PremiumPillarScreen({ title, headline, subtitle, image, actions, align = "bottom" }: Props) {
  const pillarIcon: React.ComponentProps<typeof Ionicons>["name"] = title.toLowerCase()==="body"?"barbell-outline":title.toLowerCase()==="mind"?"book-outline":title.toLowerCase()==="balance"?"shield-outline":"compass-outline";
  return <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
    <ImageBackground source={image} contentFit="cover" style={StyleSheet.absoluteFill} cachePolicy="memory-disk" transition={0} />
    <LinearGradient colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.08)", "#050505", "#050505"]} locations={[0, 0.32, 0.7, 1]} style={StyleSheet.absoluteFill} />
    <View style={styles.header}>
      <TouchableOpacity accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={25} color="white" /></TouchableOpacity>
      <Text style={styles.title}>{title.toUpperCase()}</Text><View style={styles.pillarSymbol}><Ionicons name={pillarIcon} color={GOLD} size={22}/></View>
    </View>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={{ flex: align === "middle" ? 0.8 : 1, minHeight: align === "middle" ? 160 : 240 }} />
      <Text style={[styles.headline, align === "middle" && styles.poetic]}>{headline}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.actions}>{actions.map(action => <TouchableOpacity key={action.label} onPress={() => router.push(action.href)} style={styles.action}>
        <Ionicons name={action.icon} color={GOLD} size={23} /><Text style={styles.actionText}>{action.label}</Text><Ionicons name="chevron-forward" size={19} color="#E8B44D" />
      </TouchableOpacity>)}</View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050505" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 21, height: 57 },
  back: { width: 35, justifyContent: "center" },
  title: { fontSize: 21, fontWeight: "800", letterSpacing: 3.4, color: "white" },
  pillarSymbol: { width: 38,height:38,borderRadius:12,borderWidth:1,borderColor:"#796035",backgroundColor:"#191712",alignItems:"center",justifyContent:"center" },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 },
  headline: { fontSize: 30, lineHeight: 36, fontWeight: "600", color: "white", maxWidth: 330, textTransform: "uppercase" },
  poetic: { fontSize: 28, lineHeight: 34, fontWeight: "400", textTransform: "none" },
  subtitle: { fontSize: 14, lineHeight: 22, color: "#E2DEDA", marginTop: 8, marginBottom: 23 },
  actions: { gap: 9 },
  action: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 17, borderRadius: 12, backgroundColor: "rgba(17,18,18,0.91)", borderWidth: 1, borderColor: "#494238" },
  actionText: { color: "#F8F8F8", fontSize: 15, flex: 1, fontWeight: "600" },
});