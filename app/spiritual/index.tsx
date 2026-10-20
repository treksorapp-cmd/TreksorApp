import PremiumPillarScreen from "@/components/PremiumPillarScreen";
export default function SpiritualScreen() {
  return <PremiumPillarScreen title="Balance" headline={"A calmer mind.\nA deeper life."} subtitle="Create room for stillness and reflection." align="middle" image={require("@/assets/images/Balance_2.png")} actions={[
    { label: "Beginner Meditation", icon: "leaf-outline", href: "/spiritual/mediation/beginner" },
    { label: "Intermediate Meditation", icon: "leaf-outline", href: "/spiritual/mediation/intermediate" },
    { label: "Advanced Meditation", icon: "leaf-outline", href: "/spiritual/mediation/advanced" },
  ]} />;
}