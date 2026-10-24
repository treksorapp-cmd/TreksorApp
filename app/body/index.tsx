import PremiumPillarScreen from "@/components/PremiumPillarScreen";
export default function BodyScreen() {
  return <PremiumPillarScreen title="Body" headline={"STRONGER\nEVERYDAY"} subtitle="Train. Fuel. Recover. Repeat." image={require("@/assets/images/Body_2.png")} actions={[
    { label: "Workout", icon: "barbell-outline", href: "/body/workout/selection" },
    { label: "Nutrition", icon: "nutrition-outline", href: "/body/nutrition" },
    { label: "Progress Tracking", icon: "stats-chart-outline", href: "/body/workout/progress" },
  ]} />;
}