import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuthStore } from "@/store/auth-store";
import { useWorkoutStore } from "@/store/workout-store";
import { useProgressSyncStore } from "@/store/progress-sync-store";
import { isProgressAccountReady } from "@/lib/local-progress";
import { getPriorityDays } from "@/lib/today-record";
import { dayKey, recentDays } from "@/lib/progress-metrics";
import { priorityEvidence, workoutEvidence, volumeSummary, recommendGoalAction, localToday, type GoalMetric } from "@/lib/goal-evidence";
import { readCloudGoals, readCloudEvents, syncCloudGoal, syncRecordedEvents, sendRecommendationFeedback, type CloudEvent, type CloudGoal } from "@/lib/cloud-goals";
import { colors, surface, type } from "@/theme/architect";

type Mode = { metric: GoalMetric; label: string; noun: string; destination: "/body/workout/my-plan" | "/(tabs)/home" };
const MODES: Mode[] = [
  { metric: "workout_sessions_7d", label: "Body", noun: "recorded sessions", destination: "/body/workout/my-plan" },
  { metric: "priority_days_7d", label: "Purpose", noun: "days with a priority", destination: "/(tabs)/home" },
];
const TARGETS = [2, 3, 4, 5] as const;

export default function GoalProgressCard({ refreshKey = 0 }: { refreshKey?: number }) {
  const userId = useAuthStore(s => s.isAuthenticated ? s.user?.id : undefined);
  const syncStatus = useProgressSyncStore(s => s.status);
  const checkIns = useWorkoutStore(s => s.checkIns);
  const gymSets = useWorkoutStore(s => s.gymSets);
  const [expanded, setExpanded] = useState(false);
  const [metric, setMetric] = useState<GoalMetric>("workout_sessions_7d");
  const [target, setTarget] = useState(3);
  const [priorityDays, setPriorityDays] = useState<string[]>([]);
  const [knownCloudGoals, setKnownCloudGoals] = useState<CloudGoal[]>([]);
  const [cloudEvents, setCloudEvents] = useState<CloudEvent[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [feedback, setFeedback] = useState<boolean | null>(null);
  const [owner, setOwner] = useState<string | undefined>();
  const mode = MODES.find(m => m.metric === metric) ?? MODES[0];
  const ready = !!userId && isProgressAccountReady(userId) && syncStatus !== "idle";
  const cloudGoal = owner === userId ? knownCloudGoals.find(g => g.metric_key === metric) : undefined;
  const realLocal = useMemo(() => metric === "workout_sessions_7d"
    ? workoutEvidence(checkIns)
    : priorityEvidence(priorityDays), [metric, checkIns, priorityDays]);
  const weekDays = new Set(recentDays(7));
  const observed = useMemo(() => new Set([
    ...realLocal.map(e => e.origin_ref),
    ...(owner === userId ? cloudEvents
      .filter(e => e.metric_key === metric && weekDays.has(dayKey(new Date(e.occurred_at))))
      .map(e => e.origin_ref) : []),
  ]).size, [realLocal, cloudEvents, owner, userId, metric]);
  const volume = useMemo(() => volumeSummary(gymSets || []), [gymSets]);
  const action = recommendGoalAction({ metric, target: cloudGoal?.target_count ?? target, observed });
  const completion = Math.min(100, Math.round((observed / Math.max(1, cloudGoal?.target_count ?? target)) * 100));
  const requestSerial = useRef(0);

  const reloadCloud = useCallback(async (currentUser: string, selectedMetric: GoalMetric) => {
    const serial = ++requestSerial.current;
    const goals = await readCloudGoals(currentUser);
    const since = new Date(Date.now() - 8 * 86400000).toISOString();
    const events = await readCloudEvents(currentUser, selectedMetric, since);
    if (useAuthStore.getState().user.id !== currentUser || serial !== requestSerial.current) return;
    setKnownCloudGoals(goals);
    setCloudEvents(events);
    setOwner(currentUser);
    const existing = goals.find(goal => goal.metric_key === selectedMetric);
    if (existing) setTarget(existing.target_count);
  }, []);

  useFocusEffect(useCallback(() => {
    let alive = true;
    setOwner(undefined);
    setKnownCloudGoals([]);
    setCloudEvents([]);
    setFeedback(null);
    setNotice("");
    setPriorityDays([]);
    if (!userId) return () => { alive = false; };
    void getPriorityDays(userId).then(days => {
      if (alive && useAuthStore.getState().user.id === userId) setPriorityDays(days);
    }).catch(() => {
      if (alive) setNotice("Couldn't load saved priorities on this device.");
    });
    // Reading the existing goal is okay; writing activity stays explicitly opt-in.
    if (isProgressAccountReady(userId)) void reloadCloud(userId, metric).catch(() => {
      if (alive) setNotice("Cloud goals unavailable. Your device data is unchanged.");
    });
    return () => { alive = false; requestSerial.current += 1; };
  }, [userId, metric, refreshKey, syncStatus, reloadCloud]));

  const selectMetric = (next: GoalMetric) => {
    if (next === metric) return;
    requestSerial.current += 1;
    setMetric(next);
    setFeedback(null);
    setCloudEvents([]);
    setTarget(3);
  };

  const syncGoal = async () => {
    if (!userId || !ready || busy) return;
    setBusy(true); setNotice(""); setFeedback(null);
    try {
      await syncCloudGoal(userId, metric, target);
      await syncRecordedEvents(userId, realLocal);
      await reloadCloud(userId, metric);
      setNotice("Goal and recorded activity saved to your shared Treksor account.");
    } catch {
      setNotice("Sync incomplete. Your local records are safe. Tap to retry.");
    } finally { setBusy(false); }
  };

  const rate = async (value: boolean) => {
    if (!userId || !ready || busy || !cloudGoal) return;
    setBusy(true); setNotice("");
    try {
      await sendRecommendationFeedback(userId, {
        recommendation_key: action.key,
        metric_key: metric,
        helpful: value,
        recorded_on: localToday(),
      });
      setFeedback(value);
      setNotice("Thank you. Your answer helps us test the usefulness of recommendations.");
    } catch {
      setNotice("Couldn't send your feedback. You can try again.");
    } finally { setBusy(false); }
  };

  return <View style={styles.card}>
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Expand your measurable goals"
      accessibilityState={{ expanded }}
      onPress={() => setExpanded(v => !v)}
      style={styles.header}>
      <View style={styles.headerCopy}>
        <Text style={styles.eyebrow}>CONNECTED GOALS · BETA</Text>
        <Text style={styles.heading}>Progress beyond checkmarks.</Text>
        <Text style={styles.hint}>Connect real activity to your own weekly targets.</Text>
      </View>
      <Ionicons name={expanded ? "chevron-up" : "chevron-down"} color={colors.gold} size={21}/>
    </TouchableOpacity>

    {expanded && <View style={styles.content}>
      <Text style={styles.sectionLabel}>CHOOSE YOUR GOAL</Text>
      <View style={styles.options}>
        {MODES.map(m => <TouchableOpacity key={m.metric}
          accessibilityRole="radio" accessibilityState={{checked:metric===m.metric}}
          onPress={() => selectMetric(m.metric)}
          style={[styles.chip,metric===m.metric&&styles.activeChip]}>
          <Text style={styles.chipText}>{m.label}</Text>
        </TouchableOpacity>)}
      </View>
      <Text style={styles.sectionLabel}>TARGET FOR SEVEN DAYS</Text>
      <View style={styles.options}>
        {TARGETS.map(n => <TouchableOpacity key={n}
          accessibilityRole="radio" accessibilityState={{checked:target===n}}
          onPress={() => { setTarget(n); setNotice(""); }}
          style={[styles.chip,target===n&&styles.activeChip]}>
          <Text style={styles.chipText}>{n}</Text>
        </TouchableOpacity>)}
      </View>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{observed}</Text>
          <Text style={styles.hint}>{mode.noun} · last 7 days</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{cloudGoal?.target_count ?? target}</Text>
          <Text style={styles.hint}>current target</Text>
        </View>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill,{width:completion+"%"}]}/>
      </View>
      {metric === "workout_sessions_7d" && <Text style={styles.hint}>
        This device also contains {volume.sets} logged weighted set(s) and {volume.volumeKg} kg of recorded training volume in the last 7 days. Self-recorded entries are not independently verified.
      </Text>}
      <View style={styles.recommendation}>
        <Text style={styles.eyebrow}>RECOMMENDED NEXT STEP</Text>
        <Text style={styles.recommendTitle}>{action.title}</Text>
        <Text style={styles.hint}>{action.explanation}</Text>
        <TouchableOpacity accessibilityRole="button"
          onPress={() => router.push(mode.destination)}
          style={styles.open}>
          <Text style={styles.openText}>OPEN {mode.label.toUpperCase()}</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.background}/>
        </TouchableOpacity>
        {!!cloudGoal && <View style={styles.feedbackRow}>
          <Text style={styles.hint}>Was this suggestion useful?</Text>
          <TouchableOpacity disabled={busy} accessibilityRole="button"
            accessibilityLabel="Yes, the suggestion was useful"
            onPress={() => void rate(true)} style={styles.feedbackBtn}>
            <Ionicons name={feedback === true ? "thumbs-up" : "thumbs-up-outline"} color={colors.gold} size={17}/>
          </TouchableOpacity>
          <TouchableOpacity disabled={busy} accessibilityRole="button"
            accessibilityLabel="No, the suggestion was not useful"
            onPress={() => void rate(false)} style={styles.feedbackBtn}>
            <Ionicons name={feedback === false ? "thumbs-down" : "thumbs-down-outline"} color={colors.gold} size={17}/>
          </TouchableOpacity>
        </View>}
      </View>

      <Text style={styles.hint}>Sync is optional and shares only the selected target plus dates of logged activity with your account. No journal entries, workout weights, heart rate or GPS data are uploaded by this feature.</Text>
      <TouchableOpacity accessibilityRole="button"
        accessibilityLabel="Sync this measurable goal to your Treksor account"
        disabled={!ready || busy}
        onPress={() => void syncGoal()}
        style={[styles.syncButton,(!ready||busy)&&styles.disabled]}>
        <Ionicons name="sync-outline" color={colors.background} size={16}/>
        <Text style={styles.syncText}>{busy ? "SAVING…" : cloudGoal ? "UPDATE SHARED GOAL" : "SYNC GOAL TO MY ACCOUNT"}</Text>
      </TouchableOpacity>
      <Text accessibilityLiveRegion="polite" style={styles.hint}>
        {notice || (cloudGoal ? "Connected to your Supabase account · the web can read this same record." :
          "Not yet synced. You control when this goal is shared.")}
      </Text>
    </View>}
  </View>;
}
const styles=StyleSheet.create({
  card:{...surface.card,padding:16,marginTop:18,gap:11},
  header:{flexDirection:"row",alignItems:"center",gap:12,minHeight:55},
  headerCopy:{flex:1,gap:5},
  eyebrow:type.eyebrow,
  heading:{...type.card,fontSize:17},
  hint:{...type.caption,fontSize:11,lineHeight:17},
  content:{gap:12,borderTopWidth:1,borderTopColor:colors.border,paddingTop:15},
  sectionLabel:{...type.eyebrow,fontSize:10},
  options:{flexDirection:"row",gap:8,flexWrap:"wrap"},
  chip:{borderColor:colors.border,borderWidth:1,paddingVertical:10,paddingHorizontal:14,borderRadius:10,backgroundColor:colors.surfaceRaised},
  activeChip:{borderColor:colors.gold,backgroundColor:colors.goldSoft},
  chipText:{color:colors.text,fontSize:12,fontWeight:"600"},
  statsRow:{flexDirection:"row",gap:12},
  stat:{flex:1,gap:4},
  statNumber:{color:colors.text,fontSize:30,fontWeight:"600"},
  track:{height:5,backgroundColor:colors.surfaceRaised,borderRadius:4,overflow:"hidden"},
  fill:{height:5,backgroundColor:colors.gold},
  recommendation:{backgroundColor:colors.surfaceRaised,padding:14,borderRadius:12,gap:8},
  recommendTitle:{...type.card,fontSize:17},
  open:{alignSelf:"flex-start",flexDirection:"row",alignItems:"center",gap:9,backgroundColor:colors.gold,paddingHorizontal:13,paddingVertical:11,borderRadius:9},
  openText:{color:colors.background,fontSize:10,fontWeight:"800",letterSpacing:0.6},
  feedbackRow:{flexDirection:"row",gap:8,alignItems:"center",flexWrap:"wrap",marginTop:6},
  feedbackBtn:{padding:8,borderWidth:1,borderColor:colors.border,borderRadius:9},
  syncButton:{flexDirection:"row",justifyContent:"center",alignItems:"center",gap:10,backgroundColor:colors.gold,borderRadius:10,padding:13},
  syncText:{color:colors.background,fontSize:11,fontWeight:"800",letterSpacing:0.4},
  disabled:{opacity:0.4},
});
