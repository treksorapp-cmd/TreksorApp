import { useLocalSearchParams, usePathname } from "expo-router";
import { reflectionHome, reflectionOrigin } from "@/lib/pillar-navigation";
export function useReflectionContext() {
    const path = usePathname();
    const { pillar } = useLocalSearchParams<{
        pillar?: string;
    }>();
    const origin = reflectionOrigin(path, pillar);
    return { origin, home: reflectionHome(origin), trail: origin === "purpose" ? "PURPOSE / REFLECTION" : "MIND / REFLECTION" };
}
