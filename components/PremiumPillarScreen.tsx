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
  const eyebrow = title.toLowerCase()==="body"?"BODY / YOUR FOUNDATION":title.toLowerCase()==="mind"?"MIND / CLARITY":title.toLowerCase()==="balance"?"BALANCE / PRESENCE":"PURPOSE / DIRECTION";
  const normalizedHeadline = headline.toLowerCase().split("\n").map(line => line.trim()).filter(Boolean).map(line => line.charAt(0).toUpperCase() + line.slice(1)).join("\n");
  return <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
    <ImageBackground source={image} contentFit="cover" style={StyleSheet.absoluteFill} cachePolicy="memory-disk" transition={0} />
    <LinearGradient colors={["rgba(0,0,0,0.45)", "rgba(0,0,0,0.08)", "#050505", "#050505"]} locations={[0, 0.32, 0.7, 1]} style={StyleSheet.absoluteFill} />
    <View style={styles.header}>
      <View style={styles.heading}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title.toUpperCase()}</Text></View><View style={styles.headerActions}><TouchableOpacity accessibilityRole="button" accessibilityLabel="Go to Home" onPress={()=>router.dismissTo("/(tabs)/home" as any)} style={styles.pillarSymbol}><Ionicons name="home-outline" color="#FFFFFF" size={22}/></TouchableOpacity><View style={styles.pillarSymbol}><Ionicons name={pillarIcon} color={GOLD} size={22}/></View></View>
    </View>
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={{ flex: align === "middle" ? 0.8 : 1, minHeight: align === "middle" ? 160 : 240 }} />
      <Text style={styles.headline}>{normalizedHeadline}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.actions}>{actions.map(action => <Button borderless key={action.label} onPress={() => router.push(action.href)} iconName={action.icon}>{action.label}</Button>)}</View>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#050505" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 21, minHeight: 64, paddingTop: 2, paddingBottom: 5 },
  heading:{flex:1,justifyContent:"center"},
  headerActions:{flexDirection:"row",alignItems:"center",gap:9},
  eyebrow:{color:"#D7B877",fontSize:11,fontWeight:"700",letterSpacing:1.6,marginBottom:7},
  back: { width: 35, justifyContent: "center" },
  title: { fontSize: 36, fontWeight: "700", letterSpacing: 1.5, color: "#FFFFFF", textAlign: "left" },
  pillarSymbol: { width: 42,height:42,borderRadius:12,backgroundColor:"rgba(183,221,240,0.075)",alignItems:"center",justifyContent:"center" },
  scroll: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 },
  headline: { fontSize: 30, lineHeight: 37, fontWeight: "700", letterSpacing: -0.45, color: "#F5F1E8", maxWidth: 340 },
  subtitle: { fontSize: 14, lineHeight: 22, color: "#D1CDC5", marginTop: 10, marginBottom: 24 },
  actions: { gap: 0 },
});