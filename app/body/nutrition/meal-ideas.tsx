import { useState } from "react";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NutritionScreen from "@/components/nutrition/NutritionScreen";
import NutritionTile from "@/components/nutrition/NutritionTile";
import { useDiscovery } from "@/components/discovery/DiscoveryProvider";
import { mealIdeas } from "@/lib/nutrition/meal-ideas";
import { colors, type } from "@/theme/architect";

export default function MealIdeas() {
  const { profile } = useDiscovery();
  const [filter, setFilter] = useState<"all" | "quick" | "plants" | null>(null);
  const selected = filter ?? (profile?.mealMinutes === 15 ? "quick" : "all");
  const ideas = mealIdeas.filter((meal) =>
    selected === "all" || (selected === "quick" ? meal.minutes <= 15 : meal.plantBased)
  );
  return (
    <NutritionScreen title="Meal ideas" subtitle="Browse by time or ingredients and choose what suits you.">
      <View style={styles.filters}>
        {([["all", "All ideas"], ["quick", "15 min prep"], ["plants", "Plant-based"]] as const).map(([id, label]) => (
          <TouchableOpacity key={id} accessibilityRole="button" accessibilityState={{ selected: selected === id }}
            onPress={() => setFilter(id)} style={[styles.filter, selected === id && styles.selected]}>
            <Text style={[type.caption, selected === id && { color: colors.gold }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {filter === null && selected === "quick" && <Text style={type.caption}>Showing quick ideas based on your profile. You can see all ideas above.</Text>}
      {ideas.map((meal) => (
        <NutritionTile key={meal.id} title={meal.name} source={meal.image} cover
          label={meal.timing ?? `${meal.minutes} MIN · ${meal.plantBased ? "PLANT-BASED" : "VEGETARIAN"}`}
          description={meal.description}
          onPress={() => router.push({ pathname: "/body/nutrition/meal-details", params: { id: meal.id } })} />
      ))}
    </NutritionScreen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  filter: { minHeight: 44, justifyContent: "center", paddingHorizontal: 13, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  selected: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
});
