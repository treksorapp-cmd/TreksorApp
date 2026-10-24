import PremiumPillarScreen from "@/components/PremiumPillarScreen";
export default function MindScreen() {
  return <PremiumPillarScreen title="Mind" headline={"A clear mind\nbuilds a stronger you."} subtitle="Make space for focus, clarity and growth." align="middle" image={require("@/assets/images/mental-home-bg.jpeg")} actions={[
    { label: "Power Thoughts", icon: "bulb-outline", href: "/mental/thoughts" },
    { label: "Articles", icon: "document-text-outline", href: "/mental/articles" },
    { label: "My Space", icon: "folder-open-outline", href: "/mental/myspace" },
  ]} />;
}