import { readBalance } from '@/lib/balance/practice';
import { recentDays, recordedDay, dayKey } from '@/lib/progress-metrics';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutStore } from '@/store/workout-store';
import { ownerNow, readGrant } from './connection';

// Watch writes require an explicit request, a valid per-account sharing grant and an authenticated phone session.
const EVENT_URL = 'https://niakfwerfqmrmhuypkpd.supabase.co/rest/v1/treksor_sync_events';
const KEY = 'sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8';
export async function handleWatchRequest(command: {kind?: string}) {
  if (command?.kind !== 'progress' && command?.kind !== 'today_complete') throw Error('Update Treksor on your watch.');
  const owner = ownerNow();
  if (!owner) return {locked:true};
  const grant = await readGrant(owner);
  if (!grant || ownerNow() !== owner) return {locked:true};
  if (command.kind === 'today_complete') {
    const auth = useAuthStore.getState();
    if (!auth.isAuthenticated || auth.user.id !== owner || !auth.token) return {locked:true};
    const date = dayKey();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      if (ownerNow() !== owner || await readGrant(owner) !== grant) return {locked:true};
      const response = await fetch(EVENT_URL + '?on_conflict=user_id%2Ckind%2Cevent_key', {
        method:'POST',
        headers:{apikey:KEY,Authorization:'Bearer '+auth.token,'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'},
        body:JSON.stringify([{user_id:owner,kind:'today_completed',event_key:date,pillar:null,source:'watch',payload:{}}]),
        signal:controller.signal,
      });
      if (!response.ok) throw Error('Unable to save from your watch. Try again on your iPhone.');
      if (ownerNow() !== owner || await readGrant(owner) !== grant) return {locked:true};
      return {saved:true,date};
    } finally { clearTimeout(timer); }
  }
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
