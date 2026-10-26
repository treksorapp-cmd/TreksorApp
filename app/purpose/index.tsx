import PremiumPillarScreen from "@/components/PremiumPillarScreen";
export default function PurposeScreen() {
  return <PremiumPillarScreen title="Purpose" headline={"TURN INTENTION\nINTO ACTION"} subtitle="Clarity today. Impact tomorrow." image={require("@/assets/images/purpose-background.png")} actions={[
    { label: "Goals & reflections", icon: "locate-outline", href: "/purpose/my-space" },
    { label: "Vision & reflection", icon: "images-outline", href: "/purpose/vision-board" },
    { label: "Habit & Gym progress", icon: "checkmark-circle-outline", href: "/(tabs)/tracking" },
  ]} />;
}