import PremiumPillarScreen from "@/components/PremiumPillarScreen";
export default function SpiritualScreen() {
  return <PremiumPillarScreen title="Spiritual" headline={"A calmer mind.\nA deeper life."} subtitle="Create room for stillness and reflection." align="middle" image={require("@/assets/images/spiritual-ritual.png")} actions={[
    { label: "Meditation", icon: "leaf-outline", href: "/spiritual/mediation/beginner" },
    { label: "Gratitude & Reflection", icon: "heart-outline", href: "/mental/myspace" },
    { label: "My Space", icon: "create-outline", href: "/mental/myspace/new-entry" },
    { label: "Articles", icon: "document-text-outline", href: "/spiritual/articles" },
  ]} />;
}