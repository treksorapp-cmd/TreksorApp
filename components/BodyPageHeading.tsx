import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
type Props = { title: string; trail: string; style?: StyleProp<ViewStyle> };
export default function BodyPageHeading({ title, trail, style }: Props) {
  return <View style={[styles.container, style]}>
    <Text style={styles.trail} numberOfLines={2}>{trail.toUpperCase()}</Text>
    <Text style={styles.title} adjustsFontSizeToFit numberOfLines={2}>{title}</Text>
  </View>;
}
const styles = StyleSheet.create({
  container: { paddingHorizontal: 22, paddingRight: 130, alignItems: "flex-start" },
  trail: { color: "#D7B877", fontSize: 11, fontWeight: "600", letterSpacing: 1.5, marginBottom: 7 },
  title: { color: "#F5F4F1", fontSize: 35, lineHeight: 42, fontWeight: "600", letterSpacing: -1.5 },
});
