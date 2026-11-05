import type { TrackingCategory, TrackingItem } from "@/types/tracking";

export const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function dayDate(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  return dayKey(date) === key ? date : null;
}
export function recordedDay(value: string): string | null {
  if (dayDate(value)) return value;
  // Older My space entries contain an English calendar date, without a time.
  const match = /^(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (\d{4})$/.exec(value);
  if (match) {
    const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(match[1]) + 1;
    const key = `${match[3]}-${String(month).padStart(2, "0")}-${match[2].padStart(2, "0")}`;
    return dayDate(key) ? key : null;
  }
  if (!/^\d{4}-\d{2}-\d{2}T/.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? dayKey(date) : null;
}
export const displayDay = (key: string) => dayDate(key)?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) ?? key;
export function recentDays(count: number, now = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    d.setDate(d.getDate() - count + i + 1);
    return dayKey(d);
  });
}
export const isScheduled = (item: TrackingItem, date: string) => !!dayDate(date) && Object.prototype.hasOwnProperty.call(item.record ?? {}, date);
export function trackerCompletion(items: TrackingItem[], through = dayKey()) {
  const records = items.flatMap(item => Object.entries(item.record ?? {})).filter(([date]) => dayDate(date) && date <= through);
  const completed = records.filter(([, value]) => value === true).length;
  return { completed, scheduled: records.length, percentage: records.length ? Math.round(completed / records.length * 100) : null };
}
export function makeTrackerRecords(days: number, now = new Date()): Record<string, boolean> {
  if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error("Choose between 1 and 365 days.");
  return Object.fromEntries(Array.from({ length: days }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
    date.setDate(date.getDate() + i);
    return [dayKey(date), false];
  }));
}
// Patch one scheduled day only. Unchecking the last item is a valid correction.
export function applyTrackerDay(items: TrackingItem[], date: string, checked: Record<string, boolean>, today = dayKey()) {
  if (!dayDate(date) || date > today) return items;
  return items.map(item => !isScheduled(item, date) || !(item.id in checked) ? item : {
    ...item, record: { ...item.record, [date]: checked[item.id] === true },
  });
}

export type ProgressEvent = {
  id: string; date: string; kind: "session" | "set" | "reflection" | "journal" | "habit" | "checkin" | "moment";
  title: string; source: string; route?: string; trackerId?: string;
};
export interface ProgressInput {
  checkIns: Record<string, string[]>;
  gymSets: { id: string; exerciseName: string; kg: number; reps: number; recordedAt: string; metric?:string }[];
  reflections: { id: string; date: string }[];
  journalDates: string[];
  dailyCheckInDates?:string[];
  momentDates?:string[];
  trackers: TrackingCategory[];
  meditations: { id: string; isRead?: boolean }[];
  articles: Record<string, { _id: string; isRead?: boolean }[]>;
  visionAnswers: unknown[] | null;
}
export function buildProgressOverview(input: ProgressInput, period: 7 | 30, now = new Date()) {
  const days = recentDays(period, now), today = days[days.length - 1];
  const events: ProgressEvent[] = [];
  const add = (event: Omit<ProgressEvent, "date">, raw: string) => {
    const date = recordedDay(raw);
    if (date && date >= days[0] && date <= today) events.push({ ...event, date });
  };
  [...new Set(Object.values(input.checkIns).flat())].forEach(stamp => add({ id: `session:${stamp}`, kind: "session", title: "Training session completed", source: "Body · My plan", route: "/body/workout/my-plan" }, stamp));
  [...new Map(input.gymSets.map(s => [s.id, s])).values()].filter(s => Number.isFinite(s.kg) && s.kg >= 0 && Number.isInteger(s.reps) && s.reps >= 1 && s.reps <= 300).forEach(s => add({ id: `set:${s.id}`, kind: "set", title: s.exerciseName, source: s.metric==="seconds"?`Gym · ${s.reps} seconds`:s.kg===0?`Gym · ${s.reps} bodyweight reps`:`Gym · ${s.reps} reps × ${s.kg} kg`, route: "/body/workout/progress" }, s.recordedAt));
  [...new Map(input.reflections.map(r => [r.id, r])).values()].forEach(r => add({ id: `reflection:${r.id}`, kind: "reflection", title: "Reflection saved", source: "My space · Private", route: "/mental/myspace" }, r.date));
  [...new Set(input.journalDates)].forEach(date => add({ id: `journal:${date}`, kind: "journal", title: "Personal journal entry", source: "Mind · Private", route: "/mind/journal" }, date));
  [...new Set(input.dailyCheckInDates||[])].forEach(date=>add({id:`checkin:${date}`,kind:"checkin",title:"Daily check-in saved",source:"Progress · Private self-report",route:"/(tabs)/tracking"},date));
  [...new Set(input.momentDates||[])].forEach(date=>add({id:`moment:${date}`,kind:"moment",title:"Life moment captured",source:"Mind · Personal calendar",route:"/mind/moments"},date));
  input.trackers.filter(t => t.custom).forEach(t => t.items.forEach(item => Object.entries(item.record ?? {}).filter(([, value]) => value === true).forEach(([date]) => add({ id: `habit:${t.id}:${item.id}:${date}`, kind: "habit", title: item.label, source: `Personal tracker · ${t.title}`, trackerId: t.id }, date))));
  events.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
  const active = new Set(events.map(e => e.date));
  const count = (kind: ProgressEvent["kind"]) => events.filter(e => e.kind === kind).length;
  const articles = new Map<string, boolean>();
  Object.values(input.articles).flat().forEach(a => articles.set(a._id, !!a.isRead || !!articles.get(a._id)));
  const meditations = new Map<string, boolean>();
  input.meditations.forEach(m => meditations.set(m.id, !!m.isRead || !!meditations.get(m.id)));
  return {
    days: days.map(date => ({ date, active: active.has(date), count: events.filter(e => e.date === date).length })),
    activeDays: active.size, events,
    sessions: count("session"), sets: count("set"), reflections: count("reflection"), journalEntries: count("journal"), habits: count("habit"),
    meditation: { completed: [...meditations.values()].filter(Boolean).length, total: meditations.size },
    reading: { completed: [...articles.values()].filter(Boolean).length, total: articles.size },
    vision: input.visionAnswers === null ? null : { completed: input.visionAnswers.slice(0, 10).filter(v => typeof v === "string" && v.trim()).length, total: 10 },
  };
}
