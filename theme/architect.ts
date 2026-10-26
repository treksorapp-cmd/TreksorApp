import type { TextStyle, ViewStyle } from "react-native";
// Shared brand tokens; status colors remain distinct from accents.
export const colors = {
    background: "#02050C", surface: "#111820", surfaceRaised: "#19222C",
    text: "#F5F4F1", secondary: "#C8C3BA", muted: "#A5AAAF",
    gold: "#D7B877", goldSoft: "rgba(215,184,119,0.12)",
    border: "rgba(205,235,248,0.14)", glass: "rgba(183,221,240,0.075)",
    success: "#ACD6C0", danger: "#E7A3A0", dangerSoft: "rgba(231,163,160,0.10)",
} as const;
export const type = {
    page: { fontSize: 34, lineHeight: 42, fontWeight: "600", letterSpacing: -0.6, color: colors.text, includeFontPadding: false },
    section: { fontSize: 22, lineHeight: 29, fontWeight: "600", letterSpacing: -0.2, color: colors.text, includeFontPadding: false },
    card: { fontSize: 18, lineHeight: 25, fontWeight: "600", letterSpacing: -0.2, color: colors.text, includeFontPadding: false },
    body: { fontSize: 15, lineHeight: 23, color: colors.secondary },
    caption: { fontSize: 12, lineHeight: 18, color: colors.muted },
    eyebrow: { fontSize: 11, lineHeight: 16, fontWeight: "600", letterSpacing: 1.4, color: colors.gold, includeFontPadding: false },
} satisfies Record<string, TextStyle>;
export const surface = {
    card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 20 },
    icon: { width: 44, height: 44, borderRadius: 13, backgroundColor: colors.glass, alignItems: "center", justifyContent: "center" },
} satisfies Record<string, ViewStyle>;
