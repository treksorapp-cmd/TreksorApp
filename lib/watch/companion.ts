import { readBalance } from '@/lib/balance/practice';
import { recentDays, recordedDay } from '@/lib/progress-metrics';
import { useWorkoutStore } from '@/store/workout-store';
import { ownerNow, readGrant } from './connection';

// The watch can only read three aggregate counts. No workout, check-in or alarm writes.
export async function handleWatchRequest(command: {kind?: string}) {
  if (command?.kind !== 'progress') throw Error('Update Treksor on your watch.');
  const owner = ownerNow();
  if (!owner) return {locked:true};
  const grant = await readGrant(owner);
  if (!grant || ownerNow() !== owner) return {locked:true};
  const balance = await readBalance(owner);
  if (await readGrant(owner) !== grant || ownerNow() !== owner) return {locked:true};
  const now = new Date(), week = new Set(recentDays(7,now));
  const inWeek = (value:string) => week.has(recordedDay(value) || '') && Date.parse(value) <= +now;
  const {gymSets, checkIns} = useWorkoutStore.getState();
  const sets = new Set(gymSets.filter(s=>inWeek(s.recordedAt)).map(s=>s.id)).size;
  const sessions = new Set(Object.values(checkIns).flat().filter(inWeek)).size;
  const timed = new Map(balance.sessions.filter(s=>s.method === 'timer' && inWeek(s.completedAt) && Number.isFinite(s.seconds) && s.seconds>=0).map(s=>[s.id,s.seconds]));
  const minutes = Math.floor([...timed.values()].reduce((a,b)=>a+b,0)/60);
  return {progress:{sessions,sets,minutes}};
}
