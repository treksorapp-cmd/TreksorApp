import AsyncStorage from '@react-native-async-storage/async-storage';
import { dayDate, dayKey } from './progress-metrics';

export const DAILY_ACTIVITY_OPTIONS = [
  { id: 'walk', label: 'Walk', icon: 'walk-outline' },
  { id: 'dog-walk', label: 'Walk the dog', icon: 'paw-outline' },
  { id: 'hiking', label: 'Hiking', icon: 'trail-sign-outline' },
  { id: 'trekking', label: 'Trekking', icon: 'compass-outline' },
  { id: 'sports', label: 'Sports', icon: 'football-outline' },
  { id: 'running', label: 'Running', icon: 'fitness-outline' },
  { id: 'cycling', label: 'Cycling', icon: 'bicycle-outline' },
  { id: 'swimming', label: 'Swimming', icon: 'water-outline' },
] as const;
export type DailyActivityKind = Exclude<(typeof DAILY_ACTIVITY_OPTIONS)[number]['id'], 'walk'> | 'custom';
export type DailyActivity = {
  id: string; date: string; kind: DailyActivityKind; title: string;
  minutes: number | null; createdAt: string;
};
export type DailyActivities = { entries: DailyActivity[]; customTitles: string[] };
const allowed = new Set<string>([...DAILY_ACTIVITY_OPTIONS.map(item => item.id).filter(id => id !== 'walk'), 'custom']);
const labelFor = new Map<string,string>(DAILY_ACTIVITY_OPTIONS.map(item => [item.id,item.label]));
const cleanTitle = (value: string) => value.trim().replace(/\s+/g, ' ');
export const validTitle = (value: unknown): value is string =>
  typeof value === 'string' && cleanTitle(value).length >= 1 &&
  cleanTitle(value).length <= 55 && !/[\u0000-\u001f\u007f<>]/.test(value);
export function validDailyActivity(value: unknown): value is DailyActivity {
  if (!value || typeof value !== 'object') return false;
  const row = value as DailyActivity;
  return typeof row.id === 'string' && row.id.length > 0 && row.id.length <= 100 &&
    !!dayDate(row.date) && allowed.has(row.kind) &&
    validTitle(row.title) &&
    (row.kind === 'custom' || row.title === labelFor.get(row.kind)) &&
    (row.minutes === null || Number.isInteger(row.minutes) && row.minutes >= 1 && row.minutes <= 1440) &&
    typeof row.createdAt === 'string' && Number.isFinite(Date.parse(row.createdAt));
}
const storageKey = (owner: string) => 'treksor.daily-work.v1.' + encodeURIComponent(owner);
const queues = new Map<string, Promise<unknown>>();
const listeners = new Set<(owner: string) => void>();
const empty = (): DailyActivities => ({ entries: [], customTitles: [] });
async function read(owner: string): Promise<DailyActivities> {
  if (!owner) return empty();
  const raw = await AsyncStorage.getItem(storageKey(owner));
  if (!raw) return empty();
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw Error('Daily Work could not be read. No activity was overwritten.'); }
  if (!data || typeof data !== 'object') throw Error('Daily Work records require recovery.');
  const rows = data as {version?: number;entries?: unknown;customTitles?: unknown};
  if (rows.version !== 1 || !Array.isArray(rows.entries) ||
      !rows.entries.every(validDailyActivity) ||
      !Array.isArray(rows.customTitles) || !rows.customTitles.every(validTitle))
    throw Error('Daily Work records could not be read. Nothing was overwritten.');
  return {
    entries: [...new Map<string, DailyActivity>(rows.entries.map((row: DailyActivity) => [row.id, row])).values()]
      .sort((a,b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    customTitles: [...new Set<string>(rows.customTitles.map(cleanTitle))],
  };
}
export async function getDailyActivities(owner: string): Promise<DailyActivities> {
  await queues.get(owner)?.catch(() => undefined);
  return read(owner);
}
export function subscribeDailyActivities(listener: (owner: string) => void) {
  listeners.add(listener); return () => { listeners.delete(listener); };
}
function update(owner: string, change: (data: DailyActivities) => DailyActivities, isCurrent: () => boolean) {
  if (!owner || !isCurrent()) return Promise.reject(Error('Sign in to record Daily Work.'));
  const work = (queues.get(owner) || Promise.resolve()).catch(() => undefined).then(async () => {
    if (!isCurrent()) throw Error('Your account changed. Try again.');
    const existing = await read(owner);
    if (!isCurrent()) throw Error('Your account changed. Try again.');
    const next = change(existing);
    await AsyncStorage.setItem(storageKey(owner), JSON.stringify({version:1,...next}));
    listeners.forEach(listener => listener(owner));
  });
  queues.set(owner, work);
  void work.finally(() => { if (queues.get(owner) === work) queues.delete(owner); }).catch(() => undefined);
  return work;
}
export function saveDailyActivity(owner: string, row: DailyActivity, isCurrent: () => boolean = () => true) {
  if (!validDailyActivity(row) || row.date > dayKey())
    return Promise.reject(Error('Choose an activity and a valid date no later than today.'));
  const entry = {...row, title: cleanTitle(row.title)};
  return update(owner, old => ({
    entries: old.entries.some(existing => existing.id === row.id) ? old.entries : [entry, ...old.entries],
    customTitles: row.kind === 'custom' && !old.customTitles.some(label => label.toLowerCase() === entry.title.toLowerCase())
      ? [...old.customTitles, entry.title].slice(-40) : old.customTitles,
  }), isCurrent);
}
export function removeDailyActivity(owner: string, id: string, isCurrent: () => boolean = () => true) {
  return update(owner, old => ({...old, entries: old.entries.filter(row => row.id !== id)}), isCurrent);
}
