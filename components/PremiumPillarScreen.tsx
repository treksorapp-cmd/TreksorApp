import PillarUpdates from "@/components/PillarUpdates";
import { Ionicons } from "@expo/vector-icons";
import Button from "@/components/ui/Button";
import PillarMenuScreen from "@/components/PillarMenuScreen";
import { router, type Href } from "expo-router";
import React from "react";
type Action = {
    label: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    href: Href;
};
type Props = {
    title: string;
    headline: string;
    subtitle: string;
    image: number;
    actions: Action[];
    align?: "bottom" | "middle";
};
export default function PremiumPillarScreen({ title, headline, subtitle, image, actions }: Props) {
    const trail = title === "Body" ? "YOUR FOUNDATION" : title === "Mind" ? "CLARITY & GROWTH" : title === "Balance" ? "STILLNESS & PRESENCE" : "DIRECTION & INTENTION";
    const copy = headline === headline.toUpperCase() ? headline.toLowerCase().split("\n").map(line => line.charAt(0).toUpperCase() + line.slice(1)).join("\n") : headline;
    return <PillarMenuScreen title={title} trail={trail} image={image} headline={copy} subtitle={subtitle}>
    <PillarUpdates pillar={title}/>
    {actions.map(action => <Button borderless key={action.label} onPress={() => router.push(action.href)} iconName={action.icon}>{action.label}</Button>)}
  </PillarMenuScreen>;
}
