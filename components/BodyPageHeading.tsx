import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
type Props = { title: string; trail: string; style?: StyleProp<ViewStyle> };
export default function BodyPageHeading({ title, trail, style }: Props) {
  return <View style={[styles.container, style]}>
    <Text style={styles.trail}>{trail.toUpperCase()}</Text>
    <Text accessibilityRole="header" style={styles.title}>{title === title.toUpperCase() ? title.toLowerCase().replace(/(^|\s)\S/g, letter => letter.toUpperCase()) : title}</Text>
  </View>;
}
const styles = StyleSheet.create({
  container: { paddingLeft: 22, paddingRight: 126, alignItems: "flex-start" },
  trail: { color: "#D7B877", fontSize: 11, fontWeight: "600", letterSpacing: 1.5, marginBottom: 7, lineHeight: 16, includeFontPadding: false },
  title: { color: "#F5F4F1", fontSize: 34, lineHeight: 42, fontWeight: "600", letterSpacing: -0.6, includeFontPadding: false, },
});
