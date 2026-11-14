import { Ionicons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getEntries } from "@/lib/mood-journal";
import { getPriorityDays } from "@/lib/today-record";
import { weeklyRhythm, type Focus } from "@/lib/retention-experiments";
import { useAuthStore } from "@/store/auth-store";
import { colors, surface, type } from "@/theme/architect";

const FOCUS: {
  id: Focus; title: string; prompt: string; route: Href; icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { id: "body", title: "Body", prompt: "Make room for 10 minutes of movement.", route: "/body", icon: "barbell-outline" },
  { id: "mind", title: "Mind", prompt: "Write down one thought worth keeping.", route: "/mental", icon: "book-outline" },
  { id: "balance", title: "Balance", prompt: "Spend a few minutes in stillness.", route: "/spiritual", icon: "leaf-outline" },
  { id: "purpose", title: "Purpose", prompt: "Choose one meaningful priority.", route: "/purpose", icon: "compass-outline" },
];
function focusKey(userId: string) {
  return "treksor.weekly-focus.v1." + userId.replace(/[^a-zA-Z0-9_-]/g, "_");
}

export default function WeeklyReview({ refreshKey = 0 }: { refreshKey?: number }) {
  const userId = useAuthStore(state => state.user?.id);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<string[]>([]);
  const [activeDays, setActiveDays] = useState<string[]>([]);
  const [focus, setFocus] = useState<Focus | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");

  useFocusEffect(useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    setDays([]);
    setActiveDays([]);
    setFocus(null);
    if (!userId) return () => { alive = false; };
    void Promise.all([
      getPriorityDays(userId),
      getEntries(userId).then(entries => entries.map(entry => entry.date)),
      SecureStore.getItemAsync(focusKey(userId)),
    ]).then(([priorities, journalDays, storedFocus]) => {
      if (!alive) return;
      // Global workout cache is deliberately excluded until it is properly account-scoped.
      const overview = weeklyRhythm({ priorities, journalDays, workoutTimestamps: [] });
      setDays(overview.days);
      setActiveDays(overview.activeDays);
      if (FOCUS.some(item => item.id === storedFocus)) setFocus(storedFocus as Focus);
    }).catch(() => {
      if (alive) setError("Your private weekly records could not be loaded.");
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }, [userId, refreshKey]));

  const chooseFocus = async (id: Focus) => {
    if (!userId || loading) return;
    try {
      await SecureStore.setItemAsync(focusKey(userId), id);
      setFocus(id);
      setError("");
    } catch {
      setError("Couldn't save your focus. Please try again.");
    }
  };
  const selected = FOCUS.find(item => item.id === focus);
  const active = new Set(activeDays);

  return (
    <View style={styles.section}>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Expand or collapse your weekly review"
        accessibilityState={{ expanded }}
        onPress={() => setExpanded(!expanded)}
        style={styles.header}
      >
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>YOUR WEEK</Text>
          <Text style={styles.title}>Notice what moves you forward.</Text>
          <Text style={styles.caption}>
            {loading ? "Loading your private activity…" : error || (activeDays.length === 0
              ? "One small step is a good start."
              : activeDays.length + " of the last 7 days with a saved priority or journal entry.")}
          </Text>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={22} color={colors.gold} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.details}>
          <View style={styles.days}>
            {days.map((day) => {
              const recorded = active.has(day);
              const letter = new Date(day + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
              return <View key={day} style={styles.day}>
                <Text style={styles.dayLabel}>{letter}</Text>
                <View accessibilityLabel={day + (recorded ? ": saved activity" : ": no saved record")}
                  style={[styles.dayMarker, recorded && styles.dayRecorded]}>
                  <Ionicons name={recorded ? "checkmark" : "remove"} size={13}
                    color={recorded ? colors.background : colors.muted}/>
                </View>
              </View>;
            })}
          </View>
          <Text style={styles.caption}>Only Today priorities and private journal dates count here. Unrecorded days are not failures.</Text>
          <Text style={styles.fieldLabel}>ONE FOCUS FOR THE NEXT FEW DAYS</Text>
          <View style={styles.choices}>
            {FOCUS.map(item =>
              <TouchableOpacity
                key={item.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: focus === item.id, disabled: loading }}
                disabled={loading}
                onPress={() => void chooseFocus(item.id)}
                style={[styles.choice, focus === item.id && styles.chosen]}
              >
                <Ionicons name={item.icon} size={15} color={colors.gold}/>
                <Text style={styles.choiceText}>{item.title}</Text>
              </TouchableOpacity>
            )}
          </View>
          {selected && <View style={styles.focusCard}>
            <Text style={styles.next}>{selected.prompt}</Text>
            <TouchableOpacity onPress={() => router.push(selected.route)}
              accessibilityRole="button" style={styles.go}>
              <Text style={styles.goText}>OPEN {selected.title.toUpperCase()}</Text>
              <Ionicons name="arrow-forward" size={14} color={colors.background}/>
            </TouchableOpacity>
          </View>}
          <Text style={styles.caption}>Your chosen focus is stored on this device. You can change it at any time.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { ...surface.card, padding: 15, marginTop: 20, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 2, minHeight: 56 },
  headerText: { flex: 1, gap: 4 },
  eyebrow: type.eyebrow,
  title: { ...type.card, fontSize: 16 },
  caption: { ...type.caption, fontSize: 11, lineHeight: 16 },
  details: { gap: 13, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  days: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  day: { alignItems: "center", gap: 8 },
  dayLabel: { color: colors.secondary, fontSize: 10 },
  dayMarker: { height: 28, width: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: colors.surfaceRaised },
  dayRecorded: { backgroundColor: colors.gold },
  fieldLabel: { ...type.eyebrow, fontSize: 10 },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  choice: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, borderRadius: 10 },
  chosen: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  choiceText: { fontSize: 12, fontWeight: "600", color: colors.text },
  focusCard: { backgroundColor: colors.surfaceRaised, padding: 13, borderRadius: 12, gap: 10 },
  next: { ...type.body, fontSize: 13 },
  go: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.gold, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, alignSelf: "flex-start" },
  goText: { color: colors.background, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
});
