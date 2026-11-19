import { readBalance } from '@/lib/balance/practice';
import { recentDays, recordedDay, dayKey } from '@/lib/progress-metrics';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutStore } from '@/store/workout-store';
import { ownerNow, readGrant, readWorkoutGrant } from './connection';
import { cachedGymCatalogue } from '@/lib/gym-catalogue';
import { resolveExerciseVideo } from '@/lib/exercise-video';

// Watch writes require an explicit request, a valid per-account sharing grant and an authenticated phone session.
const EVENT_URL = 'https://niakfwerfqmrmhuypkpd.supabase.co/rest/v1/treksor_sync_events';
const KEY = 'sb_publishable_WxFupUF8wM6SuEcTXYuqHw_dRoSpLs8';
type WatchCommand = {kind?: string; sessionId?: string; exerciseId?: string; setNumber?: number; kg?: number; reps?: number};
const WATCH_MEDIA_ORIGIN = 'https://niakfwerfqmrmhuypkpd.supabase.co';
const text = (value: unknown, max: number) => typeof value === 'string' ? value.slice(0,max) : '';

async function workoutAccess() {
  const owner = ownerNow();
  if (!owner) return null;
  const grant = await readWorkoutGrant(owner);
  return grant && ownerNow() === owner ? {owner,grant} : null;
}
async function stillAllowed(owner: string, grant: string) {
  return ownerNow() === owner && await readWorkoutGrant(owner) === grant;
}
function activeSession() {
  return useWorkoutStore.getState().activeGymWorkout;
}
function workoutSnapshot() {
  const state = useWorkoutStore.getState(), active = state.activeGymWorkout;
  if (!active) return {workout:null};
  const library = cachedGymCatalogue(), allSets = state.gymSets || [];
  const exercises = active.exerciseIds.slice(0,24).map(id => {
    const exercise = library.find(e => e.id === id);
    const completed = allSets.filter(s=>s.sessionId===active.id && s.exerciseId===id && Number.isInteger(s.setNumber))
      .map(s=>({setNumber:s.setNumber!,kg:s.kg,reps:s.reps}));
    const previous = allSets.filter(s=>s.exerciseId===id && s.sessionId!==active.id).slice(-1)[0];
    const prescription = active.prescriptions?.[id];
    return {
      id, name:text(exercise?.name,90)||'Exercise', metric:exercise?.metric || 'reps',
      equipment:text(exercise?.equipment,40),
      targetSets:Math.min(12,Math.max(1,Number(prescription?.sets||exercise?.sets||3))),
      targetReps:text(prescription?.reps||exercise?.reps||'8-12',16),
      restSeconds:Math.min(900,Math.max(0,Number(prescription?.rest_seconds??exercise?.rest_seconds??90))),
      previousKg:previous?.kg ?? null,previousReps:previous?.reps ?? null,completed,
      hasVideo:!!(exercise?.video_path||exercise?.videoUrl),
    };
  });
  return {workout:{id:active.id,dayName:text(active.dayName,70),startedAt:active.startedAt,
    restEndsAt:active.restEndsAt||null,exercises}};
}

export async function handleWatchRequest(command: WatchCommand) {
  if (command?.kind === 'workout' || command?.kind === 'workout_video' || command?.kind === 'workout_set') {
    const access = await workoutAccess();
    if (!access) return {locked:true};
    const {owner,grant} = access;
    if (command.kind === 'workout') return stillAllowed(owner,grant) ? workoutSnapshot() : {locked:true};
    const active = activeSession();
    if (!active || typeof command.sessionId !== 'string' || command.sessionId !== active.id ||
        typeof command.exerciseId !== 'string' || !active.exerciseIds.includes(command.exerciseId))
      return {error:'This session changed on iPhone. Refresh your watch.'};
    const exercise = cachedGymCatalogue().find(e=>e.id===command.exerciseId);
    if (command.kind === 'workout_video') {
      if (!exercise || !(exercise.video_path||exercise.videoUrl||exercise.serverId)) return {error:'No demonstration for this exercise.'};
      try {
        const url = await resolveExerciseVideo(exercise.serverId||exercise.id,exercise.video_path,exercise.videoUrl);
        if (!await stillAllowed(owner,grant) || activeSession()?.id!==active.id) return {locked:true};
        const media = new URL(url);
        if (media.origin!==WATCH_MEDIA_ORIGIN || !media.pathname.startsWith('/storage/v1/object/sign/treksor-media/'))
          return {error:'Watch video is unavailable.'};
        return {videoUrl:url};
      } catch {return {error:'Video unavailable. Retry with the iPhone connected.'};}
    }
    const number=command.setNumber, kg=command.kg, reps=command.reps;
    if (!Number.isInteger(number) || number!<1 || number!>12 || typeof kg!=='number' || !Number.isFinite(kg)
        || kg<0 || kg>1500 || (exercise?.equipment!=='Bodyweight' && kg===0)
        || !Number.isInteger(reps) || reps!<1 || reps!>300)
      return {error:'Check sets, kilograms and reps on your watch.'};
    const desired = Math.min(12,Math.max(1,Number(active.prescriptions?.[command.exerciseId]?.sets||exercise?.sets||3)));
    if (number!>desired) return {error:'This set is outside your active plan.'};
    if (!await stillAllowed(owner,grant) || activeSession()?.id!==active.id) return {locked:true};
    const state=useWorkoutStore.getState();
    const id = `${active.id}:${command.exerciseId}:${number}`;
    const existing = state.gymSets.some(row=>row.id===id);
    if (!existing) {
      state.completeGymSet({id,sessionId:active.id,exerciseId:command.exerciseId,
        exerciseName:text(exercise?.name,90)||'Exercise',day:active.day,
        setNumber:number!,kg:kg!,reps:reps!,recordedAt:new Date().toISOString(),
        setType:'Working',metric:exercise?.metric||'reps'});
      const rest = active.prescriptions?.[command.exerciseId]?.rest_seconds ?? exercise?.rest_seconds ?? 90;
      if (rest>0 && rest<=900) state.setGymRestEnd(new Date(Date.now()+rest*1000).toISOString());
    }
    return {saved:true,already:existing};
  }
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
