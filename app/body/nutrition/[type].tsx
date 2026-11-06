import { router, useLocalSearchParams } from "expo-router";
import NutritionScreen from "@/components/nutrition/NutritionScreen";
import NutritionTile from "@/components/nutrition/NutritionTile";
import { displayLabel } from "@/lib/pillar-navigation";
import { Nutritions } from "@/mock/nutrition";

export default function NutritionCategory() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const supplements = type === "supplements";
  const category = Nutritions[supplements ? "supplements" : "beverages"];
  return (
    <NutritionScreen title={category.headerTitle}
      subtitle={supplements ? "Ingredient overviews and references." : "Drinks to make at your own pace."}>
      {category.data.map((item) => (
        <NutritionTile key={item.id} title={displayLabel(item.name)} source={item.backgroundImage}
          label={supplements ? "REFERENCE" : "DRINK RECIPE"}
          description={"quantity" in item ? item.quantity.replace(/[()]/g, "") : "Overview & references"}
          compact onPress={() => router.push({ pathname: category.route, params: { id: item.id } })} />
      ))}
    </NutritionScreen>
  );
}
