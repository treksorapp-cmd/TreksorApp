import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from '@/components/ui/BrandIcon';
import { dayDate, displayDay } from '@/lib/progress-metrics';
import { buildProgressSummary, type RecentProgress } from '@/lib/progress-summary';
import { colors, type } from '@/theme/architect';

type Props = {
  children?: React.ReactNode; unavailable?: boolean;
  summary: ReturnType<typeof buildProgressSummary>; period: 7 | 30;
  loading: boolean; error: boolean; onRetry: () => void;
  health: { loading: boolean; error: boolean; hasSnapshot: boolean; savedAt: string | null };
  onConnections: () => void; onEvent: (event: RecentProgress) => void; onDetails: () => void;
};

export default function ProgressSummary({ children, unavailable=false, summary, period, loading, error, onRetry, health, onConnections, onEvent, onDetails }: Props) {
  const at = health.savedAt ? new Date(health.savedAt) : null;
  const imported = at && Number.isFinite(+at) ? at.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : null;
  const healthLabel = health.loading ? 'Checking health data…' : health.error ? 'Health data needs a refresh' : health.hasSnapshot ? 'Health · ' + (imported ? 'imported ' + imported : 'saved import') : 'Connect a watch';
  return <>
    <View style={s.summary}>
      <Text style={s.eyebrow}>LAST {period} DAYS</Text>
      {unavailable ? <Text style={s.caption}>Progress is unavailable. Retry below.</Text> : loading ? <View style={s.loading}><ActivityIndicator color={colors.gold}/><Text style={s.caption}>Updating progress…</Text></View> : <>
        <View accessible accessibilityLabel={summary.activeDays + ' of ' + period + ' days with recorded activity'} style={s.scoreRow}><Text style={s.score}>{summary.activeDays}<Text style={s.denominator}> / {period}</Text></Text><Text style={s.scoreLabel}>active days</Text></View>
        <View style={s.days}>{summary.days.map(day => <View key={day.date} style={s.day} accessible accessibilityLabel={displayDay(day.date) + ': ' + (day.active ? 'activity recorded' : 'no record')}><View style={[s.dayBar, day.active && s.dayActive]}/>{period === 7 && <Text style={s.dayLabel}>{dayDate(day.date)?.toLocaleDateString(undefined, { weekday: 'narrow' })}</Text>}</View>)}</View>
      </>}
      {(error || health.error) && <TouchableOpacity accessibilityRole="button" onPress={onRetry} style={s.retry}><Text accessibilityRole="alert" style={s.error}>Some records are unavailable · Retry</Text></TouchableOpacity>}
    </View>
    <View style={s.actions}>{children}</View>
    <View style={s.sectionHeading}><Text style={s.title}>Recent activity</Text><TouchableOpacity accessibilityRole="button" onPress={onDetails} style={s.textButton}><Text style={s.link}>View details</Text></TouchableOpacity></View>
    <View>
      {unavailable ? <Text style={s.empty}>Refresh to see your activity.</Text> : loading ? <Text style={s.empty}>Loading activity…</Text> : summary.recent.length ? summary.recent.slice(0, 3).map(event => <TouchableOpacity key={event.id} accessibilityRole="button" accessibilityLabel={event.title + '. ' + event.source + '. ' + displayDay(event.date)} onPress={() => onEvent(event)} style={s.event}><View style={s.flex}><Text style={s.eventTitle}>{event.title}</Text><Text style={s.caption}>{dayDate(event.date)?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {event.source.split(' · ')[0]}</Text></View><Icon name="chevron-forward" color={colors.muted} size={16}/></TouchableOpacity>) : <Text style={s.empty}>Your activities will appear here.</Text>}
    </View>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel="Review smartwatch and health connections" onPress={onConnections} style={s.connection}><Icon name="watch-outline" color={colors.muted} size={20}/><Text accessibilityLiveRegion="polite" style={s.healthStatus}>{healthLabel}</Text><Icon name="chevron-forward" color={colors.muted} size={17}/></TouchableOpacity>
  </>;
}

const s = StyleSheet.create({
  summary: { backgroundColor: colors.surface, borderColor: 'rgba(215,184,119,0.18)', borderWidth: 1, borderRadius: 22, padding: 20, gap: 16 },
  eyebrow: { ...type.eyebrow, fontSize: 12 },
  scoreRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: 12 },
  score: { color: colors.gold, fontSize: 54, lineHeight: 66, fontWeight: '600', fontVariant: ['tabular-nums'] },
  denominator: { fontSize: 23, color: colors.muted, fontWeight: '400' }, scoreLabel: { color: colors.secondary, fontSize: 16, lineHeight: 24 },
  days: { flexDirection: 'row', gap: 4 }, day: { flex: 1, gap: 7, alignItems: 'center' }, dayBar: { width: '100%', height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised }, dayActive: { backgroundColor: colors.gold }, dayLabel: { color: colors.muted, fontSize: 12 },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 19, flexShrink: 1 },
  actions: { marginTop: 16 },
  healthStatus: { color: colors.muted, fontSize: 14, lineHeight: 21, flexShrink: 1 },
  connection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8, minHeight: 52, marginTop: 18 },
  link: { color: colors.gold, fontSize: 14, fontWeight: '600', lineHeight: 21 }, flex: { flex: 1, minWidth: 0 },
  loading: { minHeight: 130, justifyContent: 'center', alignItems: 'center', gap: 10 }, retry: { minHeight: 44, justifyContent: 'center' }, error: { color: colors.danger, fontSize: 14, lineHeight: 21 },
  sectionHeading: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 20 }, title: { ...type.card, flexShrink: 1 }, textButton: { minHeight: 44, justifyContent: 'center' },
  event: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.border }, eventTitle: { color: colors.text, fontSize: 15, lineHeight: 22, fontWeight: '600' },
  empty: { paddingVertical: 20, color: colors.muted, fontSize: 14, lineHeight: 22 },
});
