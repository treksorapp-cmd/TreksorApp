import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import Icon from '@/components/ui/BrandIcon';
import { dayDate, displayDay } from '@/lib/progress-metrics';
import { buildProgressSummary, type RecentProgress } from '@/lib/progress-summary';
import { colors, type } from '@/theme/architect';

type Props = {
  children?: React.ReactNode; unavailable?: boolean;
  summary: ReturnType<typeof buildProgressSummary>; sessions: number; period: 7 | 30;
  onPeriod: (value: 7 | 30) => void; loading: boolean; error: boolean; onRetry: () => void;
  health: { loading: boolean; error: boolean; hasSnapshot: boolean; savedAt: string | null; sources: { id: string; name: string }[]; sourceId: string };
  onConnections: () => void; onEvent: (event: RecentProgress) => void;
  onDetails: () => void; onSource: (id: string) => void;
};

export default function ProgressSummary({ children, unavailable=false, summary, sessions, period, onPeriod, loading, error, onRetry, health, onConnections, onEvent, onDetails, onSource }: Props) {
  const { fontScale, width } = useWindowDimensions();
  const stacked = fontScale > 1.25 || width < 350;
  const selected = health.sources.find(source => source.id === health.sourceId);
  const at = health.savedAt ? new Date(health.savedAt) : null;
  const importDate = at && Number.isFinite(+at) ? at.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : null;
  const healthLabel = health.loading ? 'Checking saved import…' : health.error ? 'Import could not refresh' : health.hasSnapshot ? 'Apple Health · ' + (importDate ? 'imported ' + importDate : 'saved import') : 'Connect your watch';
  const partial = error || health.error;
  return <>
    <View style={s.summary}>
      <View style={[s.headingRow, stacked && s.stacked]}>
        <Text style={s.eyebrow}>YOUR LAST {period} DAYS</Text>
        <View accessibilityRole="tablist" style={s.periodTabs}>
          {([7, 30] as const).map(value => <TouchableOpacity key={value} accessibilityRole="tab" accessibilityLabel={'Last ' + value + ' days'} accessibilityState={{ selected: period === value }} onPress={() => onPeriod(value)} style={[s.periodOption, period === value && s.periodSelected]}><Text style={[s.periodLabel, period === value && s.periodLabelSelected]}>{value}D</Text></TouchableOpacity>)}
        </View>
      </View>
      {unavailable ? <Text style={s.caption}>Your saved progress is unavailable. Retry below.</Text> : loading ? <View style={s.loading}><ActivityIndicator color={colors.gold}/><Text style={s.caption}>Updating your progress…</Text></View> : <>
        <View accessible accessibilityLabel={summary.activeDays + ' of ' + period + ' days with recorded activity'} style={s.scoreRow}><Text style={s.score}>{summary.activeDays}<Text style={s.denominator}> / {period}</Text></Text><Text style={s.scoreLabel}>days with{'\n'}recorded activity</Text></View>
        <View style={s.days}>{summary.days.map(day => <View key={day.date} style={s.day} accessible accessibilityLabel={displayDay(day.date) + ': ' + (day.active ? 'activity recorded' : 'no record')}><View style={[s.dayBar, day.active && s.dayActive]}/>{period === 7 && <Text style={s.dayLabel}>{dayDate(day.date)?.toLocaleDateString(undefined, { weekday: 'narrow' })}</Text>}</View>)}</View>
        <View style={[s.metrics, stacked && s.stacked]}>
          <View style={s.metric}><Text style={s.metricValue}>{sessions}</Text><Text style={s.label}>Treksor sessions</Text></View>
          <View style={s.metric}><Text style={s.metricValue}>{health.loading || !health.hasSnapshot ? '—' : summary.watch.sessions}</Text><Text style={s.label}>Imported workouts</Text></View>
        </View>
      </>}
      {partial && <TouchableOpacity accessibilityRole="button" onPress={onRetry} style={s.retry}><Text accessibilityRole="alert" style={s.error}>Some records could not refresh. Showing available data. Retry</Text></TouchableOpacity>}
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Review smartwatch and health connections" onPress={onConnections} style={s.connection}><Icon name="watch-outline" color={colors.gold} size={20}/><View style={s.flex}><Text style={s.link}>{healthLabel}</Text>{health.hasSnapshot && <Text style={s.caption}>{selected?.name || 'No workouts in saved import'} · refresh in Connections</Text>}</View><Icon name="chevron-forward" color={colors.gold} size={17}/></TouchableOpacity>
      {health.sources.length > 1 && <View><Text style={s.caption}>Recording source</Text><View accessibilityRole="tablist" style={s.sources}>{health.sources.map(source => <TouchableOpacity key={source.id} accessibilityRole="tab" accessibilityState={{ selected: health.sourceId === source.id }} onPress={() => onSource(source.id)} style={[s.source, health.sourceId === source.id && s.sourceSelected]}><Text style={s.label}>{source.name}</Text></TouchableOpacity>)}</View></View>}
      <Text style={s.caption}>Each day counts once. Workout sources are shown separately.</Text>
    </View>
    <View style={s.actions}>{children}</View>
    <View style={s.sectionHeading}><Text style={s.title}>Recent activity</Text><TouchableOpacity accessibilityRole="button" onPress={onDetails} style={s.textButton}><Text style={s.link}>View details</Text></TouchableOpacity></View>
    <View style={s.activity}>
      {unavailable ? <Text style={s.empty}>Refresh your records to see recent activity.</Text> : loading ? <Text style={s.empty}>Loading your activity…</Text> : summary.recent.length ? summary.recent.slice(0, 3).map((event, index) => <TouchableOpacity key={event.id} accessibilityRole="button" onPress={() => onEvent(event)} style={[s.event, index > 0 && s.eventBorder]}><View style={s.eventIcon}><Icon name={event.id.startsWith('health:') ? 'watch-outline' : 'checkmark-outline'} color={colors.gold} size={18}/></View><View style={s.flex}><Text style={s.eventTitle}>{event.title}</Text><Text style={s.caption}>{event.source}</Text><Text style={s.caption}>{displayDay(event.date)}</Text></View><Icon name="chevron-forward" color={colors.muted} size={16}/></TouchableOpacity>) : <View style={s.empty}><Text style={s.eventTitle}>Your next action starts here.</Text><Text style={s.caption}>Log an activity or review your watch import. Your records will appear here.</Text></View>}
    </View>
  </>;
}

const s = StyleSheet.create({
  actions: { marginTop: 16 },
  summary: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 22, padding: 20, gap: 16 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  stacked: { flexDirection: 'column', alignItems: 'stretch' },
  eyebrow: { ...type.eyebrow, fontSize: 12, flexShrink: 1 },
  periodTabs: { flexDirection: 'row', alignSelf: 'flex-start', backgroundColor: colors.background, borderRadius: 12, padding: 3 },
  periodOption: { minWidth: 48, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderRadius: 9 },
  periodSelected: { backgroundColor: colors.gold }, periodLabel: { fontSize: 14, fontWeight: '600', color: colors.secondary }, periodLabelSelected: { color: colors.background },
  scoreRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 18 },
  score: { color: colors.gold, fontSize: 54, lineHeight: 66, fontWeight: '600', fontVariant: ['tabular-nums'] },
  denominator: { fontSize: 23, color: colors.muted, fontWeight: '400' }, scoreLabel: { ...type.body, fontSize: 16 },
  days: { flexDirection: 'row', gap: 4 }, day: { flex: 1, gap: 7, alignItems: 'center' }, dayBar: { width: '100%', height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised }, dayActive: { backgroundColor: colors.gold }, dayLabel: { color: colors.muted, fontSize: 12 },
  metrics: { flexDirection: 'row', gap: 18 }, metric: { flex: 1, gap: 4 }, metricValue: { color: colors.text, fontSize: 26, fontWeight: '600', fontVariant: ['tabular-nums'] },
  label: { color: colors.secondary, fontSize: 14, lineHeight: 21 }, caption: { color: colors.muted, fontSize: 12, lineHeight: 19 },
  connection: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border },
  link: { color: colors.gold, fontSize: 14, fontWeight: '600', lineHeight: 21 }, flex: { flex: 1, minWidth: 0 },
  sources: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }, source: { minHeight: 44, justifyContent: 'center', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border }, sourceSelected: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  loading: { minHeight: 130, justifyContent: 'center', alignItems: 'center', gap: 10 }, retry: { minHeight: 44, justifyContent: 'center' }, error: { color: colors.danger, fontSize: 14, lineHeight: 21 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 20 }, title: { ...type.card, flexShrink: 1 }, textButton: { minHeight: 44, justifyContent: 'center' },
  activity: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.surface, paddingHorizontal: 16 },
  event: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 }, eventBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  eventIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.goldSoft }, eventTitle: { color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  empty: { paddingVertical: 22, color: colors.muted, fontSize: 15, lineHeight: 23 },
});
