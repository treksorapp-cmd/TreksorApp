import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/ui/Button";
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
  const normalizedHeadline = headline.toLowerCase().split("\n").map(line => line.trim()).filter(Boolean).map(line => line.charAt(0).toUpperCase() + line.slice(1)).join("\n");
  return <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
    <ImageBackground source={image} contentFit="cover" style={StyleSheet.absoluteFill} cachePolicy="memory-disk" transition={0} />
    <LinearGradient colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.08)", "#050505", "#050505"]} locations={[0, 0.32, 0.7, 1]} style={StyleSheet.absoluteFill} />
    <View style={styles.header}>
      <View style={styles.back} />
      <Text style={styles.title}>{title.charAt(0).toUpperCase() + title.slice(1)}</Text><View style={styles.pillarSymbol}><Ionicons name={pillarIcon} color={GOLD} size={22}/></View>
    </View>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={{ flex: align === "middle" ? 0.8 : 1, minHeight: align === "middle" ? 160 : 240 }} />
      <Text style={styles.headline}>{normalizedHeadline}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.actions}>{actions.map(action => <Button key={action.label} onPress={() => router.push(action.href)} buttonStyle={styles.action}>
        <View style={styles.actionContents}>
          <Ionicons name={action.icon} color={GOLD} size={23} />
          <Text style={styles.actionText}>{action.label}</Text>
          <Ionicons name="chevron-forward" size={19} color={GOLD} />
        </View>
      </Button>)}</View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050505" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 21, height: 57 },
  back: { width: 35, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "700", letterSpacing: 0.2, color: "#F5F1E8", textAlign: "center" },
  pillarSymbol: { width: 38,height:38,borderRadius:12,borderWidth:1,borderColor:"#796035",backgroundColor:"#191712",alignItems:"center",justifyContent:"center" },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 },
  headline: { fontSize: 30, lineHeight: 37, fontWeight: "700", letterSpacing: -0.45, color: "#F5F1E8", maxWidth: 340 },
  subtitle: { fontSize: 14, lineHeight: 22, color: "#D1CDC5", marginTop: 10, marginBottom: 24 },
  actions: { gap: 12 },
  action: { width: "100%", height: 64, borderRadius: 18, marginVertical: 0 },
  actionContents: { width: "100%", flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 18 },
  actionText: { color: "#F5F1E8", fontSize: 16, flex: 1, fontWeight: "600", letterSpacing: 0.1 },
});