import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { AppState, Platform, StyleSheet, Switch, Text, View } from "react-native";
import { cancelWaterReminder, hasWaterReminder, scheduleWaterReminder, waterDelayMinutes } from "@/lib/workout-water";
import { colors, surface, type } from "@/theme/architect";

export default function WaterReminder({ session }: { session: string }) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef(false);
  useEffect(() => {
    if (Platform.OS === "web") return;
    let active = true;
    const refresh = () => {
      if (pending.current) return;
      void hasWaterReminder(session).then((scheduled) => {
        if (active && !pending.current) {
          setEnabled(scheduled);
          setReady(true);
        }
      }).catch(() => {
        if (active) setError("Unable to read reminders. Reopen this session to retry.");
      });
    };
    refresh();
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    const delivery = Notifications.addNotificationReceivedListener(refresh);
    return () => { active = false; subscription.remove(); delivery.remove(); };
  }, [session]);

  if (Platform.OS === "web") return null;

  async function change(value: boolean) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      if (value) setEnabled(await scheduleWaterReminder(session));
      else { await cancelWaterReminder(session); setEnabled(false); }
    } catch (issue) {
      setError(issue instanceof Error ? issue.message : "Unable to update this reminder.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Ionicons name="water-outline" size={23} color={colors.gold} />
        <View style={styles.copy}>
          <Text style={type.card}>Water reminder</Text>
          <Text style={type.caption}>One reminder in {waterDelayMinutes} minutes, for this session.</Text>
        </View>
        <Switch accessibilityLabel="Water reminder for this workout" disabled={!ready || busy}
          value={enabled} onValueChange={(value) => void change(value)} />
      </View>
      {Platform.OS === "ios" && <Text style={type.caption}>Apple Watch can show this alert when Treksor notifications are mirrored.</Text>}
      {!!error && <Text accessibilityRole="alert" style={[type.caption, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...surface.card, padding: 16, gap: 8, marginTop: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  copy: { flex: 1, minWidth: 0 },
});
