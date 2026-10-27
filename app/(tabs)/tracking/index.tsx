import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, AppState, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BodyPageHeading from "@/components/BodyPageHeading";
import ProgressDashboard from "@/components/progress/ProgressDashboard";
import ProgressSyncStatus from "@/components/ProgressSyncStatus";
import ActivityLogModal from "@/components/ActivityLogModal";
import AddTrackerModal from "@/components/AddTrackerModal";
import CalendarModal from "@/components/ui/CalendarModal";
import { useAuthStore } from "@/store/auth-store";
import { useTrackingStore } from "@/store/tracking-store";
import { useWorkoutStore } from "@/store/workout-store";
import { useMySpaceStore } from "@/store/myspace-store";
import { useMediationStore } from "@/store/mediation-store";
import { useArticleStore } from "@/store/article-store";
import { getEntries } from "@/lib/mood-journal";
import { buildProgressOverview, dayKey } from "@/lib/progress-metrics";
import { isProgressAccountReady, prepareProgressAccount } from "@/lib/local-progress";
import { colors } from "@/theme/architect";

export default function TrackingScreen() {
  const userId = useAuthStore(s => s.user?.id);
  const trackingData = useTrackingStore(s => s.trackingData);
  const { checkIns, gymSets } = useWorkoutStore();
  const reflections = useMySpaceStore(s => s.myspaces);
  const meditations = useMediationStore(s => s.mediation);
  const { articles } = useArticleStore();
  const [period, setPeriod] = useState<7 | 30>(7);
  const [now, setNow] = useState(new Date());
  const [reload, setReload] = useState(0);
  const [extras, setExtras] = useState<{ owner?: string; ready: boolean; accountError: boolean; journalDates: string[]; visionAnswers: unknown[] | null; journalLoading: boolean; visionLoading: boolean; journalError: boolean; visionError: boolean }>({ ready: false, accountError: false, journalDates: [], visionAnswers: null, journalLoading: true, visionLoading: true, journalError: false, visionError: false });
  const [showAddTracker, setShowAddTracker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const pendingModalAction = useRef<(() => void) | null>(null);
  const afterDismiss = () => { const action = pendingModalAction.current; pendingModalAction.current = null; action?.(); };
  const afterClose = (close: () => void, action: () => void) => {
    if (Platform.OS === "ios") pendingModalAction.current = action;
    close();
    if (Platform.OS !== "ios") action();
  };
  const [log, setLog] = useState<{ date: string; trackerId?: string } | null>(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    setNow(new Date());
    setExtras({ owner: userId, ready: false, accountError: false, journalDates: [], visionAnswers: null, journalLoading: true, visionLoading: true, journalError: false, visionError: false });
    void (async () => {
      try { if (userId && !isProgressAccountReady(userId)) await prepareProgressAccount(userId); }
      catch { if (active) setExtras(s => ({ ...s, accountError: true })); return; }
      if (!active) return;
      setExtras(s => ({ ...s, ready: true }));
    void getEntries(userId || "").then(entries => {
      if (active) setExtras(s => ({ ...s, journalDates: entries.map(e => e.date), journalLoading: false }));
    }).catch(() => { if (active) setExtras(s => ({ ...s, journalError: true, journalLoading: false })); });
    void AsyncStorage.getItem("treksor.vision-board.v1").then(raw => {
      const saved = raw ? JSON.parse(raw) : [];
      const answers = Array.isArray(saved) ? saved : saved?.answers;
      if (!Array.isArray(answers)) throw new Error("Invalid saved vision");
      if (active) setExtras(s => ({ ...s, visionAnswers: answers, visionLoading: false }));
    }).catch(() => { if (active) setExtras(s => ({ ...s, visionError: true, visionLoading: false })); });
    })();
    return () => { active = false; };
  }, [userId, reload]));
  useEffect(() => {
    const sub = AppState.addEventListener("change", state => { if (state === "active") setReload(v => v + 1); });
    const clock = setInterval(() => setNow(new Date()), 60000);
    return () => { sub.remove(); clearInterval(clock); };
  }, []);

  const ownExtras = extras.owner === userId;
  const data = buildProgressOverview({ checkIns, gymSets, reflections, meditations, articles, trackers: trackingData, journalDates: ownExtras ? extras.journalDates : [], visionAnswers: ownExtras ? extras.visionAnswers : null }, period, now);
  const openLog = (date: string, trackerId?: string) => setLog({ date, trackerId });
  return <SafeAreaView edges={["top"]} style={styles.screen}>
    <StatusBar style="light"/>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <BodyPageHeading trail="YOUR JOURNEY" title="Progress" subtitle="See the steps. Understand the progress." style={styles.heading}/>
      {!ownExtras || !extras.ready ? <View style={styles.loading}>{extras.accountError ? <><Text style={styles.loadingText}>Unable to load your saved progress.</Text><TouchableOpacity accessibilityRole="button" onPress={() => setReload(v => v + 1)} style={styles.retry}><Text style={styles.retryText}>Try again</Text></TouchableOpacity></> : <><ActivityIndicator color={colors.gold}/><Text style={styles.loadingText}>Loading your saved progress…</Text></>}</View> : <ProgressDashboard data={data} period={period} onPeriod={setPeriod} trackers={trackingData} today={dayKey(now)} journalLoading={!ownExtras || extras.journalLoading} visionLoading={!ownExtras || extras.visionLoading} journalError={ownExtras && extras.journalError} visionError={ownExtras && extras.visionError} onRetry={() => setReload(v => v + 1)} onRoute={route => router.push(route as any)} onLog={openLog} onCreate={() => setShowAddTracker(true)} onCalendar={() => setShowCalendar(true)}/>}
      <ProgressSyncStatus/>
    </ScrollView>
    <AddTrackerModal visible={showAddTracker} onClose={() => setShowAddTracker(false)}/>
    <ActivityLogModal visible={!!log} onClose={() => setLog(null)} selectedDate={log?.date ?? dayKey(now)} selectedCategory={log?.trackerId} onDismiss={afterDismiss} onCreate={() => afterClose(() => setLog(null), () => setShowAddTracker(true))}/>
    <CalendarModal visible={showCalendar} onClose={() => setShowCalendar(false)} onDismiss={afterDismiss} onDateSelect={date => afterClose(() => setShowCalendar(false), () => openLog(date))} selectedDate={log?.date ?? dayKey(now)} maxDate={dayKey(now)}/>
  </SafeAreaView>;
}
const styles = StyleSheet.create({ loading: { paddingVertical: 40, alignItems: "center", gap: 16 }, loadingText: { color: colors.secondary, fontSize: 15 }, retry: { padding: 14, minHeight: 44 }, retryText: { color: colors.gold, fontWeight: "600" }, screen: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 20, paddingBottom: 130 }, heading: { paddingHorizontal: 0, paddingTop: 12, paddingBottom: 0 } });
