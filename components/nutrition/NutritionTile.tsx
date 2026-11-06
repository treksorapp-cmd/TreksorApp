import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NutritionArtwork from "./NutritionArtwork";
import { colors, surface, type } from "@/theme/architect";

export default function NutritionTile({ title, description, label, source, onPress, compact = false, cover = false }: {
  title: string;
  description: string;
  label: string;
  source: number;
  onPress: () => void;
  compact?: boolean;
  cover?: boolean;
}) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Open ${title}`} activeOpacity={0.83}
      onPress={onPress} style={[styles.tile, compact && styles.compact]}>
      <View style={compact ? styles.thumb : undefined}>
        <NutritionArtwork source={source} label={title} height={compact ? 98 : 174} cover={cover} />
      </View>
      <View style={[styles.row, compact ? styles.flex : styles.copy]}>
        <View style={styles.flex}>
          <Text style={type.eyebrow}>{label}</Text>
          <Text style={[type.card, styles.title]}>{title}</Text>
          <Text style={[type.caption, styles.description]}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" color={colors.gold} size={19} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: { ...surface.card, padding: 9 },
  compact: { flexDirection: "row", gap: 14, alignItems: "center" },
  thumb: { width: 86 },
  flex: { flex: 1, minWidth: 0 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  copy: { padding: 10, paddingTop: 14 },
  title: { marginTop: 5 },
  description: { marginTop: 5 },
});
