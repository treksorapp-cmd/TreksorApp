import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getEntries } from "@/lib/mood-journal";
import { dayKey } from "@/lib/progress-metrics";
import { getPriorityDays } from "@/lib/today-record";
import { measureOutcomes, mentorProgressDraft, nextMove, type OutcomeId } from "@/lib/connected-journey";
import { useAuthStore } from "@/store/auth-store";
import { useWorkoutStore } from "@/store/workout-store";
import { useMediationStore } from "@/store/mediation-store";
import { useChatStore } from "@/store/chat-store";
import { colors, surface, type } from "@/theme/architect";

const DESTINATIONS: Record<OutcomeId, Href> = {
  body: "/body/workout/guide",
  mind: "/mind/journal",
  balance: "/spiritual/mediation/beginner",
  purpose: "/(tabs)/home",
  mentor: "/(tabs)/chat",
};
const PILLARS: {id: OutcomeId; label: string; icon: keyof typeof Ionicons.glyphMap; time: string; unit: string}[] = [
  { id: "body", label: "Body", icon: "barbell-outline", time: "LAST 7 DAYS", unit: "workout sessions" },
  { id: "mind", label: "Mind", icon: "book-outline", time: "LAST 7 DAYS", unit: "journal days" },
  { id: "balance", label: "Balance", icon: "leaf-outline", time: "ALL TIME", unit: "practices marked complete" },
  { id: "purpose", label: "Purpose", icon: "compass-outline", time: "LAST 7 DAYS", unit: "days with a priority" },
  { id: "mentor", label: "Mentor", icon: "chatbubble-ellipses-outline", time: "LOADED CHAT", unit: "replies received" },
];

type PrivateSummary = { owner: string | undefined; journalDays: string[]; priorityDays: string[]; error: boolean; ready: boolean };

export default function ConnectedJourney({ refreshKey = 0 }: { refreshKey?: number }) {
  const userId = useAuthStore(state => state.user?.id);
  const checkIns = useWorkoutStore(state => state.checkIns);
  const meditations = useMediationStore(state => state.mediation);
  const chats = useChatStore(state => state.chats);
  const chatOwner = useChatStore(state => state.currentUserId);
  const [privateSummary, setPrivateSummary] = useState<PrivateSummary>({ owner: undefined, journalDays: [], priorityDays: [], error: false, ready: false });
  const [today, setToday] = useState(() => dayKey());

  useFocusEffect(useCallback(() => {
    let active = true;
    setToday(dayKey());
    setPrivateSummary({ owner: userId, journalDays: [], priorityDays: [], error: false, ready: false });
    if (!userId) return () => { active = false; };
    void Promise.all([
      getEntries(userId).then(entries => entries.map(entry => entry.date)),
      getPriorityDays(userId),
    ]).then(([journalDays, priorityDays]) => {
      if (active) setPrivateSummary({ owner: userId, journalDays, priorityDays, error: false, ready: true });
    }).catch(() => {
      if (active) setPrivateSummary({ owner: userId, journalDays: [], priorityDays: [], error: true, ready: true });
    });
    return () => { active = false; };
  }, [userId, refreshKey]));

  const validPrivateData = privateSummary.owner === userId && privateSummary.ready && !privateSummary.error;
  const outcomes = measureOutcomes({
    checkIns,
    journalDays: validPrivateData ? privateSummary.journalDays : [],
    meditations,
    priorityDays: validPrivateData ? privateSummary.priorityDays : [],
    mentorMessages: userId && chatOwner === userId ? chats[userId] ?? null : null,
  });
  const ready = !!userId && validPrivateData;
  const recommended = ready ? nextMove(outcomes, privateSummary.priorityDays.includes(today)) : null;

  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>ONE CONNECTED JOURNEY</Text>
      <Text style={styles.title}>Five systems. Real actions.</Text>
      <Text style={styles.subtitle}>A useful snapshot of what you've recorded — not a wellbeing score.</Text>
      <View style={styles.grid}>
        {PILLARS.map(pillar => {
          const count = outcomes[pillar.id];
          const value = ready || (pillar.id !== "mind" && pillar.id !== "purpose")
            ? count === null ? "—" : String(count)
            : "—";
          return (
            <TouchableOpacity
              key={pillar.id}
              accessibilityRole="button"
              accessibilityLabel={pillar.label + ": " + value + " " + pillar.unit + ". Open " + pillar.label}
              onPress={() => router.push(DESTINATIONS[pillar.id])}
              style={styles.metric}
            >
              <View style={styles.metricHeader}>
                <Ionicons name={pillar.icon} color={colors.gold} size={17}/>
                <Text style={styles.metricName}>{pillar.label}</Text>
              </View>
              <Text style={styles.metricValue}>{value}</Text>
              <Text style={styles.metricUnit}>{pillar.unit}</Text>
              <Text style={styles.metricTime}>{pillar.time}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {privateSummary.error ? <Text accessibilityRole="alert" style={styles.warning}>Private journal or priority activity is unavailable. Those totals are hidden.</Text> : null}
      <View style={styles.next}>
        <Text style={styles.eyebrow}>YOUR NEXT MOVE</Text>
        <Text style={styles.nextTitle}>{recommended?.title ?? "Pick up where you left off"}</Text>
        <Text style={styles.subtitle}>{recommended?.detail ?? "Open a pillar to build your journey."}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.push(DESTINATIONS[recommended?.id ?? "purpose"])}
          style={styles.action}
        >
          <Text style={styles.actionText}>OPEN {recommended?.id.toUpperCase() ?? "TODAY"}</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.background} />
        </TouchableOpacity>
      </View>
      {ready && (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.push({ pathname: "/(tabs)/chat", params: { draft: mentorProgressDraft(outcomes) } })}
          style={styles.mentorAction}
        >
          <Ionicons name="chatbubble-outline" size={17} color={colors.gold}/>
          <View style={styles.mentorCopy}>
            <Text style={styles.mentorTitle}>Discuss your progress with Mentor</Text>
            <Text style={styles.mentorCaption}>Review an editable summary before you send. Your private writing stays private.</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={colors.gold}/>
        </TouchableOpacity>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: 12, marginTop: 26 },
  eyebrow: type.eyebrow,
  title: type.section,
  subtitle: type.caption,
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 3 },
  metric: { ...surface.card, padding: 12, flexBasis: "45%", flexGrow: 1, minWidth: 135, gap: 4 },
  metricHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  metricName: { ...type.card, fontSize: 14 },
  metricValue: { color: colors.text, fontSize: 27, fontWeight: "600", marginTop: 6 },
  metricUnit: { ...type.caption, lineHeight: 17 },
  metricTime: { fontSize: 9, letterSpacing: 1.1, color: colors.gold, marginTop: 5, fontWeight: "600" },
  next: { ...surface.card, padding: 16, gap: 7, backgroundColor: colors.surfaceRaised },
  nextTitle: { ...type.card, fontSize: 18 },
  action: { marginTop: 6, backgroundColor: colors.gold, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 9 },
  actionText: { color: colors.background, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  mentorAction: { borderColor: colors.border, borderWidth: 1, borderRadius: 14, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  mentorCopy: { flex: 1, gap: 3 },
  mentorTitle: { color: colors.text, fontSize: 13, fontWeight: "600" },
  mentorCaption: { ...type.caption, fontSize: 11, lineHeight: 15 },
  warning: { color: colors.danger, fontSize: 12 },
});
