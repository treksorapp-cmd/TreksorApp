import Button from "@/components/ui/Button";
import PillarMenuScreen from "@/components/PillarMenuScreen";
import {router} from "expo-router";
export default function NutritionHome(){
  return <PillarMenuScreen title="Nutrition" trail="BODY" image={require("@/assets/images/Nutrition_2.png")} subtitle="Everyday rituals to fuel and restore.">
    <Button iconName="cafe-outline" onPress={()=>router.push("/body/nutrition/beverages")}>Beverages</Button>
    <Button iconName="nutrition-outline" onPress={()=>router.push("/body/nutrition/supplements")}>Supplements</Button>
  </PillarMenuScreen>;
}
