import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { buildProgressOverview, dayDate, displayDay, isScheduled, trackerCompletion } from "@/lib/progress-metrics";
import type { TrackingCategory } from "@/types/tracking";
import { colors, surface, type } from "@/theme/architect";

type Overview = ReturnType<typeof buildProgressOverview>;
type Detail = "activity" | "body" | "mind" | "balance" | "purpose" | "reading" | "sources";
interface Props {
  data: Overview; period: 7 | 30; onPeriod: (period: 7 | 30) => void;
  trackers: TrackingCategory[]; today: string;
  journalLoading: boolean; visionLoading: boolean; journalError: boolean; visionError: boolean;
  onRetry: () => void; onRoute: (route: string) => void;
  onLog: (date: string, trackerId?: string) => void; onCreate: () => void; onCalendar: () => void;
}
function Meter({ value, total, label }: { value: number; total: number; label: string }) {
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={label} accessibilityValue={{ min: 0, max: total || 1, now: value }} style={styles.meter}><View style={[styles.meterFill, { width: `${total ? Math.min(100, value / total * 100) : 0}%` }]} /></View>;
}
export default function ProgressDashboard(props: Props) {
  const { data, period, onPeriod, trackers, today, onRoute, onLog } = props;
  const [detail, setDetail] = useState<Detail | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { width, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < 370 || fontScale > 1.2;
  const personal = trackers.filter(t => t.custom);
  const columns = period === 7 ? 7 : fontScale > 1.2 ? 5 : 10;
  const weekRows = Array.from({ length: Math.ceil(data.days.length / columns) }, (_, i) => data.days.slice(i * columns, (i + 1) * columns));
  const cards = [
    { id: "body" as const, name: "Body", icon: "barbell-outline" as const, value: String(data.sessions), label: "sessions completed", period: `Last ${period} days`, caption: `${data.sets} sets logged`, source: "My plan · session check-ins" },
    { id: "mind" as const, name: "Mind", icon: "book-outline" as const, value: props.journalLoading || props.journalError ? "—" : String(data.reflections + data.journalEntries), label: "entries saved", period: `Last ${period} days`, caption: props.journalLoading ? "Loading private entries…" : props.journalError ? "Journal unavailable · tap for details" : `${data.reflections} reflections · ${data.journalEntries} journal entries`, source: "My space + personal journal" },
    { id: "balance" as const, name: "Balance", icon: "shield-outline" as const, value: `${data.meditation.completed} / ${data.meditation.total}`, label: "practices completed", period: "All time", caption: "Meditation library", source: "Balance · marked complete", meter: data.meditation },
    { id: "purpose" as const, name: "Purpose", icon: "compass-outline" as const, value: props.visionLoading || !data.vision ? "—" : `${data.vision.completed} / 10`, label: "prompts answered", period: "All time", caption: props.visionLoading ? "Loading your vision…" : props.visionError ? "Vision unavailable · tap for details" : "Your saved vision board", source: "Vision & reflection", meter: props.visionLoading ? undefined : data.vision ?? undefined },
  ];
  const detailContent = {
    activity: { title: "What counts as an active day?", source: "Dated actions saved in Treksor", body: `A day counts once when you save a training session, gym set, reflection, personal journal entry or completed tracker item. The selected window is the last ${period} local calendar days, including today.`, note: "Meditations, articles and vision answers have no completion date in older records. They appear under all-time progress and do not create activity days. A day without a record is not a failed day.", action: "Got it", route: "" },
    body: { title: "Your training, explained", source: "Body → Workout → Gym → My plan", body: `Sessions come from “Mark session complete” in My plan. Saved gym sets are counted separately: ${data.sets} in the last ${period} days. Logging a set does not automatically complete a session.`, note: "This is recorded training activity, not a fitness score. Home workout exercise checkmarks are collection progress; they have no completion dates and are not counted as sessions here.", action: "Open my plan", route: "/body/workout/my-plan" },
    mind: { title: "Space for reflection", source: "Mind → My space · Profile → My journal", body: `Entries saved in the last ${period} days. My space and Purpose → Goals & reflections use the same notebook, so each reflection is counted once. Personal journal contributes one entry per saved date.`, note: "Your writing and moods stay private on this device. More entries do not mean better mental health. No mood score is included in Progress.", action: "Open personal journal", route: "/mind/journal" },
    balance: { title: "A practice, not a performance", source: "Balance → Meditations", body: `${data.meditation.completed} of ${data.meditation.total} distinct practices are marked complete. The bar is completed practices divided by the available meditation library.`, note: "Each practice counts once, even if you replay it. These records do not measure listening minutes, session frequency or wellbeing.", action: "Explore Balance", route: "/spiritual" },
    purpose: { title: "Clarity takes shape", source: "Purpose → Vision & reflection", body: "Each non-empty, saved answer counts toward the 10 prompts on your vision board. Draft answers count only after you save the board.", note: "This shows how much of your vision you have written, not how many life goals you have achieved. Your answers stay private on this device; only the completed-prompt count can sync.", action: "Open vision board", route: "/purpose/vision-board" },
    reading: { title: "Your learning library", source: "Articles → Mark as read", body: `${data.reading.completed} of ${data.reading.total} articles currently saved in the app are marked read. An article shown in multiple categories is counted once.`, note: "This is all-time library completion, not reading time. The total can change when new articles load. Reading does not inflate your training or meditation progress.", action: "Explore articles", route: "/article" },
    sources: { title: "Your numbers have a source", source: "Recorded in Treksor", body: "Training: sessions and sets you save. Mind: saved reflections and journal dates. Balance: practices you mark complete. Purpose: saved vision prompts. Personal trackers: checkmarks you enter for scheduled dates.", note: "App records update this screen. Supported progress summaries sync to your web profile. Journal text, moods and vision answers stay on this device. Smartwatch and Apple Health data are not connected yet.", action: "Got it", route: "" },
  };
  const info = detail ? detailContent[detail] : null;
  const issue = (detail === "mind" && props.journalError) || (detail === "purpose" && props.visionError);

  return <>
    <View style={styles.sectionTop}>
      <Text style={styles.sectionTitle}>Your rhythm</Text>
      <View accessibilityRole="tablist" style={styles.segment}>{([7, 30] as const).map(p => <TouchableOpacity key={p} accessibilityRole="tab" accessibilityState={{ selected: period === p }} onPress={() => { onPeriod(p); setShowAll(false); }} style={[styles.segmentItem, period === p && styles.segmentSelected]}><Text style={[styles.segmentText, period === p && styles.segmentTextSelected]}>{p} days</Text></TouchableOpacity>)}</View>
    </View>
    <LinearGradient colors={["#242A2D", "#111820"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={styles.row}><Text style={styles.eyebrow}>SMALL STEPS, MADE VISIBLE</Text><Ionicons name="sparkles-outline" size={19} color={colors.gold} /></View>
      <View style={styles.heroMetric}><Text style={styles.heroNumber}>{data.activeDays}</Text><View style={styles.heroMetricCopy}><Text style={styles.heroUnit}>of {period} days</Text><Text style={styles.body}>with a saved action</Text></View></View>
      <View style={styles.dayGrid}>{weekRows.map((row, index) => <View key={index} style={styles.dayRow}>{row.map(day => <View key={day.date} accessible accessibilityLabel={`${displayDay(day.date)}: ${day.count} saved actions`} style={styles.dayColumn}>
        {period === 7 && <Text style={styles.dayLabel}>{dayDate(day.date)?.toLocaleDateString("en-US", { weekday: "narrow" })}</Text>}
        <View style={[styles.dayTile, day.active && styles.dayActive, day.date === today && styles.dayToday]}><Text style={[styles.dayNumber, day.active && styles.darkText]}>{dayDate(day.date)?.getDate()}</Text></View>
      </View>)}</View>)}</View>
      <View style={styles.legend}><View style={styles.legendDot}/><Text style={styles.caption}>Saved action</Text><View style={[styles.legendDot, styles.legendEmpty]}/><Text style={styles.caption}>No record</Text></View>
      <Text style={styles.heroMessage}>{data.activeDays ? "Keep a rhythm that works for you." : "Your next small step starts the story."}</Text>
      <TouchableOpacity accessibilityRole="button" onPress={() => setDetail("activity")} style={styles.textAction}><Text style={styles.link}>What counts?</Text><Ionicons name="information-circle-outline" size={17} color={colors.gold}/></TouchableOpacity>
      {props.journalLoading && <Text style={styles.caption}>Updating private journal activity…</Text>}
      {props.journalError && <Text accessibilityRole="alert" style={styles.error}>Journal could not be loaded. Activity totals may be incomplete.</Text>}
    </LinearGradient>

    <View style={styles.sectionTop}><View style={styles.flex}><Text style={styles.sectionTitle}>Four pillars. Real progress.</Text><Text style={styles.caption}>Each measure tells its own story.</Text></View></View>
    <View style={styles.pillarGrid}>{cards.map(card => <TouchableOpacity accessibilityRole="button" accessibilityLabel={`${card.name}: ${card.value} ${card.label}. ${card.period}. See source and calculation.`} key={card.id} onPress={() => setDetail(card.id)} style={[styles.pillarCard, compact ? styles.fullCard : styles.halfCard]}>
      <View style={styles.row}><View style={styles.pillarIcon}><Ionicons name={card.icon} size={22} color={colors.gold}/></View><Text style={styles.scope}>{card.period}</Text></View>
      <Text style={styles.pillarTitle}>{card.name}</Text><Text style={styles.pillarNumber}>{card.value}</Text><Text style={styles.metricLabel}>{card.label}</Text>
      {card.meter && <Meter value={card.meter.completed} total={card.meter.total} label={`${card.name} completion`}/>}
      <Text style={styles.cardCaption}>{card.caption}</Text>
      <View style={styles.cardSource}><Text style={styles.sourceText}>{card.source}</Text><Ionicons name="chevron-forward" size={16} color={colors.gold}/></View>
    </TouchableOpacity>)}</View>

    <View style={styles.sectionTop}><View style={styles.flex}><Text style={styles.sectionTitle}>Your personal trackers</Text><Text style={styles.caption}>You choose the habit. You record the action.</Text></View><TouchableOpacity accessibilityRole="button" accessibilityLabel="Add a personal tracker" onPress={props.onCreate} style={styles.iconButton}><Ionicons name="add" size={23} color={colors.gold}/></TouchableOpacity></View>
    {!personal.length ? <View style={styles.emptyCard}><Ionicons name="checkmark-circle-outline" size={30} color={colors.gold}/><Text style={styles.cardTitle}>Make one intention tangible.</Text><Text style={styles.body}>A walk. Ten pages. A moment outside. Set a daily tracker and check it off here.</Text><TouchableOpacity accessibilityRole="button" onPress={props.onCreate} style={styles.primaryButton}><Text style={styles.primaryText}>Create your first tracker</Text><Ionicons name="arrow-forward" size={18} color={colors.background}/></TouchableOpacity></View> : <View style={styles.trackerList}>{personal.map(tracker => {
      const stats = trackerCompletion(tracker.items, today);
      const due = tracker.items.filter(i => isScheduled(i, today));
      const done = due.filter(i => i.record?.[today]).length;
      return <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Log ${tracker.title}. ${done} of ${due.length} scheduled items completed today.`} key={tracker.id} onPress={() => onLog(today, tracker.id)} style={styles.trackerCard}>
        <View style={styles.row}><Text style={[styles.cardTitle, styles.flex]}>{tracker.title}</Text><View style={styles.manualBadge}><Text style={styles.badgeText}>MANUAL</Text></View></View>
        <Text style={styles.todayStatus}>{due.length ? `${done} / ${due.length} done today` : "Nothing scheduled today"}</Text>
        <Meter value={stats.completed} total={stats.scheduled} label={`${tracker.title}, completed scheduled check-ins through today`}/>
        <Text style={styles.caption}>{stats.completed} / {stats.scheduled} scheduled check-ins through today{stats.percentage !== null ? ` · ${stats.percentage}%` : ""}</Text>
        <View style={styles.cardSource}><Text style={styles.link}>View & log</Text><Ionicons name="chevron-forward" size={17} color={colors.gold}/></View>
      </TouchableOpacity>;
    })}</View>}
    <View style={styles.actions}><TouchableOpacity accessibilityRole="button" onPress={() => onLog(today)} style={styles.secondaryButton}><Ionicons name="checkmark-done-outline" size={19} color={colors.gold}/><Text style={styles.link}>Log today</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" onPress={props.onCalendar} style={styles.secondaryButton}><Ionicons name="calendar-outline" size={19} color={colors.gold}/><Text style={styles.link}>Past dates</Text></TouchableOpacity></View>
    <Text style={styles.footnote}>Tracker percentages use scheduled check-ins through today. Future days are not counted as missed.</Text>

    <View style={styles.sectionTop}><Text style={styles.sectionTitle}>Your activity trail</Text><Text style={styles.scope}>{period} days</Text></View>
    <View style={styles.trailCard}>{!data.events.length ? <View style={styles.trailEmpty}><Text style={styles.cardTitle}>No dated actions yet</Text><Text style={styles.body}>Complete a session, save a reflection or log a habit. Its source and date will appear here.</Text></View> : (showAll ? data.events : data.events.slice(0, 5)).map(event => <TouchableOpacity key={event.id} accessibilityRole="button" onPress={() => event.trackerId ? onLog(event.date, event.trackerId) : event.route && onRoute(event.route)} style={styles.trailRow}>
      <View style={styles.trailIcon}><Ionicons name={event.kind === "session" || event.kind === "set" ? "barbell-outline" : event.kind === "habit" ? "checkmark-outline" : "create-outline"} size={20} color={colors.gold}/></View>
      <View style={styles.flex}><Text style={styles.trailTitle}>{event.title}</Text><Text style={styles.caption}>{event.source}</Text><Text style={styles.trailDate}>{displayDay(event.date)}</Text></View><Ionicons name="chevron-forward" size={16} color={colors.muted}/>
    </TouchableOpacity>)}{data.events.length > 5 && <TouchableOpacity accessibilityRole="button" onPress={() => setShowAll(v => !v)} style={styles.moreButton}><Text style={styles.link}>{showAll ? "Show less" : `View all ${data.events.length} actions`}</Text></TouchableOpacity>}</View>

    <TouchableOpacity accessibilityRole="button" onPress={() => setDetail("reading")} style={styles.learningCard}><Ionicons name="library-outline" size={24} color={colors.gold}/><View style={styles.flex}><Text style={styles.cardTitle}>Keep learning</Text><Text style={styles.body}>{data.reading.total ? `${data.reading.completed} / ${data.reading.total} saved articles marked read` : "Your reading library starts here"}</Text><Text style={styles.caption}>All time · Articles in the app</Text></View><Ionicons name="chevron-forward" size={18} color={colors.gold}/></TouchableOpacity>
    <TouchableOpacity accessibilityRole="button" onPress={() => setDetail("sources")} style={styles.sourcesButton}><Ionicons name="git-network-outline" size={20} color={colors.gold}/><Text style={styles.link}>Data sources & how it works</Text><Ionicons name="chevron-forward" size={17} color={colors.gold}/></TouchableOpacity>

    <Modal visible={!!info} transparent animationType="slide" onRequestClose={() => setDetail(null)}><View style={[styles.modalBackdrop, { paddingTop: insets.top + 24 }]}><View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.sheetHeader}><Text style={styles.eyebrow}>BEHIND THE NUMBER</Text><TouchableOpacity accessibilityRole="button" accessibilityLabel="Close explanation" onPress={() => setDetail(null)} style={styles.iconButton}><Ionicons name="close" size={24} color={colors.text}/></TouchableOpacity></View>
      <ScrollView contentContainerStyle={styles.sheetContent}><Text style={styles.sheetTitle}>{info?.title}</Text><View style={styles.sourcePill}><Ionicons name="git-branch-outline" size={18} color={colors.gold}/><Text style={styles.sourcePillText}>{info?.source}</Text></View><Text style={styles.body}>{info?.body}</Text><Text style={styles.detailNote}>{info?.note}</Text>
        {issue && <TouchableOpacity accessibilityRole="button" onPress={props.onRetry} style={styles.secondaryButton}><Text style={styles.link}>Could not load this source. Retry</Text></TouchableOpacity>}
        <TouchableOpacity accessibilityRole="button" onPress={() => { setDetail(null); if (info?.route) onRoute(info.route); }} style={styles.primaryButton}><Text style={styles.primaryText}>{info?.action}</Text><Ionicons name="arrow-forward" size={18} color={colors.background}/></TouchableOpacity>
      </ScrollView>
    </View></View></Modal>
  </>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 }, row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  sectionTop: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 26, marginBottom: 14 },
  sectionTitle: { ...type.section, flexShrink: 1 }, body: type.body, caption: type.caption, eyebrow: { ...type.eyebrow, flexShrink: 1 },
  segment: { flexDirection: "row", padding: 3, borderRadius: 12, backgroundColor: colors.surface }, segmentItem: { minHeight: 44, paddingHorizontal: 14, alignItems: "center", justifyContent: "center", borderRadius: 9 }, segmentSelected: { backgroundColor: colors.gold }, segmentText: { color: colors.secondary, fontSize: 13, fontWeight: "600" }, segmentTextSelected: { color: colors.background },
  hero: { ...surface.card, borderColor: "rgba(215,184,119,0.35)", padding: 22, borderRadius: 22 }, heroMetric: { flexDirection: "row", alignItems: "center", gap: 18, marginVertical: 17 }, heroNumber: { fontSize: 70, lineHeight: 80, letterSpacing: -3, fontWeight: "600", color: colors.gold, fontVariant: ["tabular-nums"] }, heroMetricCopy: { flex: 1 }, heroUnit: { ...type.card, marginBottom: 3 }, heroMessage: { ...type.body, color: colors.text, marginTop: 18 },
  dayGrid: { gap: 6 }, dayRow: { flexDirection: "row", gap: 5 }, dayColumn: { flex: 1, alignItems: "center", gap: 6 }, dayLabel: { ...type.caption, fontSize: 11 }, dayTile: { width: "100%", minHeight: 31, paddingVertical: 7, alignItems: "center", justifyContent: "center", borderRadius: 6, borderWidth: 1, borderColor: "transparent", backgroundColor: "rgba(255,255,255,0.06)" }, dayActive: { backgroundColor: colors.gold }, dayToday: { borderColor: colors.gold }, dayNumber: { color: colors.muted, fontSize: 11, fontWeight: "600" }, darkText: { color: colors.background }, legend: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 7, marginTop: 13 }, legendDot: { width: 6, height: 6, borderRadius: 2, backgroundColor: colors.gold }, legendEmpty: { backgroundColor: "#52606A", marginLeft: 10 },
  textAction: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, minHeight: 44 }, link: { color: colors.gold, fontSize: 13, lineHeight: 19, fontWeight: "600", flexShrink: 1 },
  pillarGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 }, pillarCard: { ...surface.card, padding: 17, flexGrow: 1 }, halfCard: { width: "47%" }, fullCard: { width: "100%" }, pillarIcon: { width: 35, height: 35, borderRadius: 10, backgroundColor: colors.goldSoft, alignItems: "center", justifyContent: "center" }, scope: { ...type.caption, fontSize: 11, flexShrink: 1 }, pillarTitle: { ...type.card, marginTop: 14 }, pillarNumber: { fontSize: 32, lineHeight: 40, color: colors.text, fontWeight: "600", letterSpacing: -0.8, marginTop: 8, fontVariant: ["tabular-nums"] }, metricLabel: { color: colors.secondary, fontSize: 13, lineHeight: 19 }, cardCaption: { ...type.caption, marginTop: 10, marginBottom: 16, flexGrow: 1 }, cardSource: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 10, flexDirection: "row", alignItems: "center", gap: 6 }, sourceText: { ...type.caption, color: colors.gold, flex: 1 },
  meter: { height: 5, borderRadius: 4, backgroundColor: "#2D3740", overflow: "hidden", marginTop: 14, marginBottom: 9 }, meterFill: { height: "100%", backgroundColor: colors.gold, borderRadius: 4 },
  iconButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: colors.goldSoft }, emptyCard: { ...surface.card, gap: 12 }, cardTitle: type.card, primaryButton: { minHeight: 48, backgroundColor: colors.gold, borderRadius: 12, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginTop: 8 }, primaryText: { color: colors.background, fontSize: 14, fontWeight: "700", lineHeight: 21, flexShrink: 1 },
  trackerList: { gap: 12 }, trackerCard: surface.card, manualBadge: { borderRadius: 6, padding: 6, backgroundColor: colors.goldSoft }, badgeText: { color: colors.gold, fontSize: 9, fontWeight: "600", letterSpacing: 1 }, todayStatus: { color: colors.text, fontSize: 16, fontWeight: "500", marginTop: 12 }, actions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 }, secondaryButton: { backgroundColor: colors.surfaceRaised, borderRadius: 12, padding: 14, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, flexGrow: 1 }, footnote: { ...type.caption, marginTop: 12 },
  trailCard: { ...surface.card, padding: 0, overflow: "hidden" }, trailEmpty: { padding: 20, gap: 8 }, trailRow: { padding: 17, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: colors.border }, trailIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.glass, alignItems: "center", justifyContent: "center" }, trailTitle: { color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: "600" }, trailDate: { ...type.caption, fontSize: 11, marginTop: 4 }, moreButton: { minHeight: 48, padding: 14, alignItems: "center" }, learningCard: { ...surface.card, marginTop: 24, flexDirection: "row", alignItems: "center", gap: 14 }, sourcesButton: { paddingVertical: 18, minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.72)" }, sheet: { backgroundColor: colors.surface, maxHeight: "90%", borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: colors.border }, sheetHeader: { paddingHorizontal: 22, paddingTop: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, sheetContent: { padding: 22, gap: 18 }, sheetTitle: type.section, sourcePill: { backgroundColor: colors.goldSoft, padding: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 10 }, sourcePillText: { ...type.caption, color: colors.gold, flex: 1 }, detailNote: { ...type.body, color: colors.muted, fontSize: 13, lineHeight: 21 }, error: { ...type.caption, color: colors.danger, marginTop: 10 },
});
