import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { Alert, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NutritionScreen from "@/components/nutrition/NutritionScreen";
import NutritionArtwork from "@/components/nutrition/NutritionArtwork";
import { mealIdeas } from "@/lib/nutrition/meal-ideas";
import { colors, surface, type } from "@/theme/architect";

export default function MealDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const meal = mealIdeas.find((item) => item.id === id);
  if (!meal) return <NutritionScreen title="Meal idea unavailable" subtitle="Return to Meal ideas to choose a recipe." />;
  async function shareIngredients() {
    if (!meal) return;
    try {
      await Share.share({ message: [meal.name, ...meal.ingredients.map((item) => `• ${item}`)].join("\n") });
    } catch {
      Alert.alert("Unable to share", "You can still read the ingredients on this screen.");
    }
  }
  return (
    <NutritionScreen title={meal.name} trail="BODY / MEAL IDEAS" subtitle={meal.description}>
      <NutritionArtwork source={meal.image} label={meal.name} height={224} cover />
      <Text style={type.caption}>Serving illustration · {meal.timing ?? `About ${meal.minutes} min`}</Text>
      <View style={surface.card}>
        <Text style={type.section}>Ingredients</Text>
        <Text style={type.caption}>Makes one serving</Text>
        {meal.ingredients.map((ingredient) => <Text key={ingredient} style={styles.line}>{ingredient}</Text>)}
        <TouchableOpacity accessibilityRole="button" onPress={() => void shareIngredients()} style={styles.action}>
          <Ionicons name="share-outline" color={colors.gold} size={20} />
          <Text style={type.eyebrow}>SHARE INGREDIENT LIST</Text>
        </TouchableOpacity>
      </View>
      <View style={surface.card}>
        <Text style={type.section}>Preparation</Text>
        {meal.steps.map((step, index) => <Text key={step} style={styles.line}>{index + 1}. {step}</Text>)}
      </View>
      <View style={surface.card}>
        <Text style={type.card}>Allergen notes</Text>
        <Text style={styles.line}>{meal.allergens}</Text>
        <Text style={type.caption}>Check the products you use, substitutions and how the meal is prepared.</Text>
      </View>
    </NutritionScreen>
  );
}

const styles = StyleSheet.create({
  line: { ...type.body, marginTop: 10 },
  action: { flexDirection: "row", alignItems: "center", gap: 10, minHeight: 46, marginTop: 12 },
});
