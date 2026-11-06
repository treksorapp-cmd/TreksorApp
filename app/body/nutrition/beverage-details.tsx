import { useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NutritionArtwork from "@/components/nutrition/NutritionArtwork";
import NutritionScreen from "@/components/nutrition/NutritionScreen";
import { Nutritions } from "@/mock/nutrition";
import { colors, surface, type } from "@/theme/architect";

export default function BeverageDetails() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const [showReferences, setShowReferences] = useState(false);
  const beverage = Nutritions.beverages.data.find((item) => item.id === (Array.isArray(id) ? id[0] : id));
  if (!beverage) return <NutritionScreen title="Beverage unavailable" subtitle="Return to Beverages to choose a drink." />;
  const references = [
    { title: beverage.source_1, url: beverage.url_1 },
    { title: beverage.source_2, url: beverage.url_2 },
    { title: beverage.source_3, url: beverage.url_3 },
  ].filter((reference): reference is { title: string; url: string } => !!reference.title && !!reference.url);
  return (
    <NutritionScreen trail="BODY / BEVERAGES" title={beverage.name} subtitle={beverage.description}>
      <NutritionArtwork source={beverage.backgroundImage} label={beverage.name} />
      <View style={surface.card}>
        <Text style={type.section}>Ingredients</Text>
        <Text style={type.caption}>{beverage.quantity.replace(/[()]/g, "")}</Text>
        {beverage.ingredients.map((ingredient) => (
          <View key={ingredient.id} style={styles.ingredient}>
            <Text style={[type.body, styles.name]}>{ingredient.name}</Text>
            <Text style={[type.caption, styles.amount]}>{ingredient.measurement.replace(/[()]/g, "")}</Text>
          </View>
        ))}
      </View>
      <View style={surface.card}>
        <Text style={type.card}>Ingredient notes</Text>
        <Text style={type.body}>{beverage.footNote}</Text>
        {!!references.length && (
          <>
            <TouchableOpacity accessibilityRole="button" accessibilityState={{ expanded: showReferences }}
              onPress={() => setShowReferences((visible) => !visible)} style={styles.reference}>
              <Text style={type.eyebrow}>SOURCES & REFERENCES</Text>
              <Ionicons name={showReferences ? "chevron-up" : "chevron-down"} size={18} color={colors.gold} />
            </TouchableOpacity>
            {showReferences && references.map((reference) => (
              <TouchableOpacity key={reference.url} accessibilityRole="link" style={styles.reference}
                onPress={() => void Linking.openURL(reference.url).catch(() => {})}>
                <Text style={[type.caption, styles.name]}>{reference.title}</Text>
                <Ionicons name="open-outline" size={17} color={colors.gold} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </View>
    </NutritionScreen>
  );
}
const styles = StyleSheet.create({
  ingredient: { minHeight: 48, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  name: { flex: 1, minWidth: 0 },
  amount: { maxWidth: "42%", textAlign: "right" },
  reference: { minHeight: 46, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
});
