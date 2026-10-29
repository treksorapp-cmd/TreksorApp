import PremiumPillarScreen from "@/components/PremiumPillarScreen";
export default function SpiritualScreen() {
  return <PremiumPillarScreen title="Balance" headline={"A calmer mind.\nA deeper life."} subtitle="Create room for stillness and reflection." align="middle" image={require("@/assets/images/purpose-background.png")} actions={[
    { label: "Beginner meditation", icon: "leaf-outline", href: "/spiritual/mediation/beginner" },
    { label: "Intermediate meditation", icon: "leaf-outline", href: "/spiritual/mediation/intermediate" },
    { label: "Advanced meditation", icon: "leaf-outline", href: "/spiritual/mediation/advanced" },
  ]} />;
}