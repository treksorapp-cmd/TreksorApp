import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useProgressSyncStore } from "@/store/progress-sync-store";
import { openTreksorWeb } from "@/lib/treksor-links";
import { colors, surface, type } from "@/theme/architect";
export default function ProgressSyncStatus() {
    const sync = useProgressSyncStore();
    const busy = sync.status === "syncing";
    return <View style={styles.card}>
  <View style={styles.row}><Ionicons name="sync-outline" size={20} color={colors.gold}/><Text style={styles.title}>One profile. One journey.</Text></View>
  <Text style={styles.copy}>Your app progress, also on Treksor web.</Text>
  <Text accessibilityLiveRegion="polite" style={styles.caption}>{sync.message}{sync.lastSynced ? ` Last synced ${new Date(sync.lastSynced).toLocaleString()}.` : ""}</Text>
  <View style={styles.actions}>
   <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={sync.requestSync} style={styles.action}><Text style={styles.actionText}>{busy ? "Syncing…" : "Sync now"}</Text><Ionicons name="refresh-outline" size={17} color={colors.gold}/></TouchableOpacity>
   <TouchableOpacity accessibilityRole="link" onPress={() => void openTreksorWeb("progress")} style={styles.action}><Text style={styles.actionText}>View on web</Text><Ionicons name="open-outline" size={17} color={colors.gold}/></TouchableOpacity>
  </View>
 </View>;
}
const styles = StyleSheet.create({ card: { ...surface.card, gap: 10, marginBottom: 20 }, row: { flexDirection: "row", alignItems: "center", gap: 10 }, title: { ...type.card, flex: 1 }, copy: type.body, caption: type.caption, actions: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, action: { minHeight: 44, flexDirection: "row", gap: 10, alignItems: "center", paddingHorizontal: 12, backgroundColor: colors.goldSoft, borderRadius: 12 }, actionText: { color: colors.gold, fontSize: 14, fontWeight: "600" } });
