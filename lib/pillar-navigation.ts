export const pillars = {
    body: { name: "Body", route: "/body", icon: "barbell-outline" },
    mind: { name: "Mind", route: "/mental", icon: "book-outline" },
    balance: { name: "Balance", route: "/spiritual", icon: "shield-outline" },
    purpose: { name: "Purpose", route: "/purpose", icon: "compass-outline" },
} as const;
export type PillarKey = keyof typeof pillars;
export function resolvePillar(path: string, origin?: string): PillarKey | undefined {
    if (path === "/purpose" || path.startsWith("/purpose/"))
        return "purpose";
    if (path === "/body" || path.startsWith("/body/"))
        return "body";
    if (path === "/spiritual" || path.startsWith("/spiritual/"))
        return "balance";
    if (path.startsWith("/mental/myspace") && origin === "purpose")
        return "purpose";
    if (path === "/mental" || path.startsWith("/mental/") || path.startsWith("/mind/"))
        return "mind";
}
export function reflectionOrigin(path: string, origin?: string): "mind" | "purpose" {
    return resolvePillar(path, origin) === "purpose" ? "purpose" : "mind";
}
export function reflectionHome(origin: "mind" | "purpose") {
    return origin === "purpose" ? "/purpose/my-space" : "/mental/myspace";
}
export function displayLabel(value: string) {
    if (value !== value.toUpperCase())
        return value;
    return value.toLowerCase().replace(/^\S/, letter => letter.toUpperCase())
        .replace(/\bAi\b/g, "AI").replace(/\bPdf\b/g, "PDF");
}
