import PillarUpdates from "@/components/PillarUpdates";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/ui/Button";
import PillarMenuScreen from "@/components/PillarMenuScreen";
import { router, type Href } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "@/theme/architect";
type Action = {
    label: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    href: Href;
};
type Props = {
    title: string;
    headline: string;
    subtitle: string;
    image: number;
    actions: Action[];
    align?: "bottom" | "middle";
};
export default function PremiumPillarScreen({ title, headline, subtitle, image, actions }: Props) {
    const trail = title === "Body" ? "YOUR FOUNDATION" : title === "Mind" ? "CLARITY & GROWTH" : title === "Balance" ? "STILLNESS & PRESENCE" : "DIRECTION & INTENTION";
    const copy = headline === headline.toUpperCase() ? headline.toLowerCase().split("\n").map(line => line.charAt(0).toUpperCase() + line.slice(1)).join("\n") : headline;
    return <PillarMenuScreen title={title} trail={trail} image={image} headline={copy} subtitle={subtitle}>
    <PillarUpdates pillar={title}/>
    {actions.map(action => <Button borderless key={action.label} onPress={() => router.push(action.href)} iconName={action.icon}>{action.label}</Button>)}
    <View style={styles.bridge}>
      <Text style={styles.eyebrow}>PART OF YOUR DAILY PRACTICE</Text>
      <Text style={styles.copy}>Every pillar connects back to Today. Your recorded actions help you choose what comes next.</Text>
      <View style={styles.links}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Return to Today" onPress={() => router.push("/(tabs)/home")} style={styles.link}>
          <Text style={styles.linkText}>TODAY</Text><Ionicons name="arrow-forward" size={15} color={colors.gold}/>
        </TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel={"Discuss " + title + " with Mentor"} onPress={() => router.push({ pathname: "/(tabs)/chat", params: { draft: "Help me turn my " + title + " practice into one realistic next action. Ask me a question before making assumptions about my progress." } })} style={styles.link}>
          <Text style={styles.linkText}>MENTOR</Text><Ionicons name="arrow-forward" size={15} color={colors.gold}/>
        </TouchableOpacity>
      </View>
    </View>
  </PillarMenuScreen>;
}

const styles = StyleSheet.create({
  bridge: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 17, paddingBottom: 12, gap: 9 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  copy: { color: colors.secondary, fontSize: 13, lineHeight: 20 },
  links: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 3 },
  link: { paddingVertical: 11, paddingHorizontal: 13, flexDirection: "row", gap: 9, alignItems: "center", borderRadius: 10, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  linkText: { color: colors.gold, fontSize: 11, fontWeight: "700", letterSpacing: 1 },
});
