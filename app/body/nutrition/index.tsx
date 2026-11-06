import { router } from "expo-router";
import { Text, TouchableOpacity } from "react-native";
import NutritionScreen from "@/components/nutrition/NutritionScreen";
import NutritionTile from "@/components/nutrition/NutritionTile";
import { mealIdeas } from "@/lib/nutrition/meal-ideas";
import { Nutritions } from "@/mock/nutrition";
import { surface, type } from "@/theme/architect";

export default function NutritionHome() {
  return (
    <NutritionScreen title="Nutrition" trail="BODY / NUTRITION" subtitle="Find something you would like to make.">
      <NutritionTile title="Meal ideas" label="THE TREKSOR KITCHEN"
        description="Simple recipes, familiar ingredients and a list you can take shopping."
        source={mealIdeas[0].image} cover onPress={() => router.push("/body/nutrition/meal-ideas")} />
      <Text style={type.section}>Explore</Text>
      <NutritionTile title="Beverages" label="DRINKS" description="Recipes to prepare at home."
        source={Nutritions.beverages.backgroundImage} compact cover onPress={() => router.push("/body/nutrition/beverages")} />
      <NutritionTile title="Supplements" label="REFERENCE" description="Read about ingredients and considerations."
        source={Nutritions.supplements.backgroundImage} compact cover onPress={() => router.push("/body/nutrition/supplements")} />
      <TouchableOpacity accessibilityRole="button" style={surface.card}
        onPress={() => router.push({ pathname: "/(tabs)/chat", params: { intent: "meal" } })}>
        <Text style={type.card}>Explore an idea with Mentor</Text>
        <Text style={type.caption}>Talk through a recipe using ingredients you already have.</Text>
      </TouchableOpacity>
    </NutritionScreen>
  );
}
