import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NutritionArtwork from "@/components/nutrition/NutritionArtwork";
import NutritionScreen from "@/components/nutrition/NutritionScreen";
import { Nutritions } from "@/mock/nutrition";
import { colors, surface, type } from "@/theme/architect";

export default function SupplementDetails() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const supplement = Nutritions.supplements.data.find((item) => item.id === (Array.isArray(id) ? id[0] : id));
  if (!supplement) return <NutritionScreen title="Supplement unavailable" subtitle="Return to Supplements to choose a reference." />;
  return (
    <NutritionScreen trail="BODY / SUPPLEMENTS" title={supplement.name}>
      <NutritionArtwork source={supplement.backgroundImage} label={supplement.name} />
      <View style={styles.card}>
        <Text style={type.section}>Overview</Text>
        <Text style={type.body}>{supplement.description}</Text>
      </View>
      <View style={styles.card}>
        <Text style={type.card}>Before taking a supplement</Text>
        <Text style={type.body}>{supplement.warning}</Text>
        <TouchableOpacity accessibilityRole="link" style={styles.reference}
          onPress={() => void Linking.openURL(supplement.url).catch(() => {})}>
          <Text style={[type.caption, styles.link]}>{supplement.source}</Text>
          <Ionicons name="open-outline" size={18} color={colors.gold} />
        </TouchableOpacity>
      </View>
    </NutritionScreen>
  );
}
const styles = StyleSheet.create({
  card: { ...surface.card, gap: 10 },
  reference: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 10 },
  link: { color: colors.gold, flex: 1 },
});
