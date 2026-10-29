import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useWorkoutStore } from "@/store/workout-store";
import { useMediationStore } from "@/store/mediation-store";
import { colors, surface, type } from "@/theme/architect";
export default function JourneyCard() {
    const plan = useWorkoutStore(s => s.trainingPlan);
    const practices = useMediationStore(s => s.mediation);
    const next = practices.find(p => !p.isRead) ?? practices[0];
    return <View style={styles.section}><Text style={styles.title}>Keep your journey moving</Text>
 <TouchableOpacity accessibilityRole="button" onPress={() => router.push(plan ? "/body/workout/my-plan" : "/body/workout/guide")} style={styles.row}><Ionicons name="barbell-outline" size={22} color={colors.gold}/><View style={styles.copy}><Text style={styles.label}>{plan ? "Return to your training" : "Build your first plan"}</Text><Text style={styles.caption}>{plan ? `${plan.days} sessions per week · Your pace, your progress` : "A routine shaped around your goals"}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted}/></TouchableOpacity>
 {next && <TouchableOpacity accessibilityRole="button" onPress={() => router.push({ pathname: "/spiritual/mediation/[id]", params: { id: next.id } })} style={styles.row}><Ionicons name="leaf-outline" size={22} color={colors.gold}/><View style={styles.copy}><Text style={styles.label}>Make room for stillness</Text><Text style={styles.caption}>{next.title}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted}/></TouchableOpacity>}
 </View>;
}
const styles = StyleSheet.create({ section: { marginTop: 28, gap: 12 }, title: type.section, row: { ...surface.card, padding: 16, flexDirection: "row", gap: 14, alignItems: "center" }, copy: { flex: 1, minWidth: 0 }, label: type.card, caption: { ...type.caption, marginTop: 4 } });
