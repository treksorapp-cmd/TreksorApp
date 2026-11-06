import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import BodyPageHeading from "@/components/BodyPageHeading";
import { colors } from "@/theme/architect";

export default function NutritionScreen({ title, subtitle, trail = "BODY / NUTRITION", children }: {
  title: string;
  subtitle?: string;
  trail?: string;
  children?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={styles.screen} showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 36 }}>
      <BodyPageHeading title={title} subtitle={subtitle} trail={trail} style={styles.heading} />
      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  heading: { width: "100%", maxWidth: 640, alignSelf: "center" },
  content: { width: "100%", maxWidth: 640, alignSelf: "center", paddingHorizontal: 22, marginTop: 24, gap: 16 },
});
