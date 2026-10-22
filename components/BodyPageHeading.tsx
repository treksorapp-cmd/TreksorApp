import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
type Props = { title: string; trail: string; style?: StyleProp<ViewStyle> };
export default function BodyPageHeading({ title, trail, style }: Props) {
  return <View style={[styles.container, style]}>
    <Text style={styles.trail}>{trail.toUpperCase()}</Text>
    <Text style={styles.title} adjustsFontSizeToFit numberOfLines={2}>{title.toUpperCase()}</Text>
  </View>;
}
const styles = StyleSheet.create({
  container: { paddingHorizontal: 22, paddingRight: 76, alignItems: "flex-start" },
  trail: { color: "#D7B877", fontSize: 11, fontWeight: "700", letterSpacing: 1.7, marginBottom: 7 },
  title: { color: "#FFFFFF", fontSize: 36, lineHeight: 42, fontWeight: "700", letterSpacing: 1.25 },
});
