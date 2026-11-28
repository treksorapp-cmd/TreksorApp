import { activityOverview, type HealthWorkout } from '@/lib/ecosystem/activity';
import { type buildProgressOverview, recordedDay } from '@/lib/progress-metrics';

type Overview = ReturnType<typeof buildProgressOverview>;
export type RecentProgress = {
  id: string; date: string; title: string; source: string; route?: string; trackerId?: string;
};

// A calendar day is shared evidence. Workout counts stay source-specific: a
// timestamp overlap cannot establish whether two recordings are one workout.
export function buildProgressSummary(data: Overview, workouts: HealthWorkout[], sourceId: string, period: 7 | 30, now = new Date()) {
  const watch = activityOverview(workouts, sourceId, period, now);
  const watchDates = new Set(watch.days.filter(day => day.minutes > 0).map(day => day.date));
  const days = data.days.map(day => ({ ...day, active: day.active || watchDates.has(day.date) }));
  const recent: RecentProgress[] = [];
  const trainingDays = new Map<string, { sessions: number; sets: number }>();
  for (const event of data.events) {
    if (event.kind === 'session' || event.kind === 'set') {
      const day = trainingDays.get(event.date) || { sessions: 0, sets: 0 };
      if (event.kind === 'session') day.sessions++; else day.sets++;
      trainingDays.set(event.date, day);
    } else recent.push({ ...event });
  }
  for (const [date, value] of trainingDays) recent.push({
    id: 'training:' + date, date, title: 'Training recorded',
    source: 'Treksor · ' + value.sessions + (value.sessions === 1 ? ' session' : ' sessions') + ' · ' + value.sets + (value.sets === 1 ? ' set' : ' sets'),
    route: '/body/workout/progress',
  });
  for (const workout of watch.rows) {
    const date = recordedDay(workout.start);
    if (date) recent.push({ id: 'health:' + workout.id, date,
      title: workout.kind + ' · ' + Math.round(workout.durationSeconds / 60) + ' min',
      source: workout.sourceName + ' · Apple Health', route: '/progress/connections' });
  }
  recent.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  return { days, activeDays: days.filter(day => day.active).length, watch, recent };
}
