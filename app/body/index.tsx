import {useWalks} from "@/hooks/useWalks";
import {walkTotals} from "@/lib/walks";
import {useEffect} from "react";
import {getGymCatalogue} from "@/lib/gym-catalogue";
import PremiumPillarScreen from "@/components/PremiumPillarScreen";
export default function BodyScreen() {
  const walks=useWalks();
  const walkLabel=walks.loading||walks.error?"Daily walks":`Daily walks · ${walkTotals(walks.rows,walks.now).today} today`;
  useEffect(()=>{void getGymCatalogue().catch(()=>{})},[]);
  return <PremiumPillarScreen title="Body" headline={"STRONGER\nEVERYDAY"} subtitle="Train. Fuel. Recover. Repeat." image={require("@/assets/images/Body_2.png")} actions={[
    { label: walkLabel, icon: "walk-outline", href: "/body/walks" },
    { label: "Workout", icon: "barbell-outline", href: "/body/workout/selection" },
    { label: "Nutrition", icon: "nutrition-outline", href: "/body/nutrition" },
    { label: "Gym progress", icon: "stats-chart-outline", href: "/body/workout/progress" },
  ]} />;
}