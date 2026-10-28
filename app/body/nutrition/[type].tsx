import Button from "@/components/ui/Button";
import PillarMenuScreen from "@/components/PillarMenuScreen";
import {Nutritions} from "@/mock/nutrition";
import {router,useLocalSearchParams,type Href} from "expo-router";
export default function NutritionCategory(){
  const {type}=useLocalSearchParams<{type:string}>();
  const category=Nutritions[type==="supplements"?"supplements":"beverages"];
  return <PillarMenuScreen title={category.headerTitle} trail="BODY / NUTRITION" image={category.backgroundImage} compact>
    {category.data.map(item=><Button key={item.id} onPress={()=>router.push(`${category.route}?id=${encodeURIComponent(String(item.id))}` as Href)} icon={"icon" in item?item.icon:undefined}>{item.name}</Button>)}
  </PillarMenuScreen>;
}
