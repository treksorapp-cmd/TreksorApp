import PremiumPillarScreen from "@/components/PremiumPillarScreen";
export default function PurposeScreen() {
  return <PremiumPillarScreen title="Purpose" headline={"TURN INTENTION\nINTO ACTION"} subtitle="Clarity today. Impact tomorrow." image={require("@/assets/images/purpose-background.png")} actions={[
    { label: "Goal Setting · My Space", icon: "locate-outline", href: "/mental/myspace" },
    { label: "Vision & Reflection", icon: "images-outline", href: "/purpose/vision-board" },
    { label: "Habit & Progress Tracking", icon: "checkmark-circle-outline", href: "/(tabs)/tracking" },
  ]} />;
}