import { wakeCapability, refreshWake, scheduleWake } from "@/lib/wake/service";
import { wakeSounds } from "@/lib/wake/sounds";
import { useWorkoutStore } from '@/store/workout-store';
import { useTrackingStore } from '@/store/tracking-store';
import { cachedGymCatalogue } from '@/lib/gym-catalogue';
import { buildTrainingWeek, prescribeExercise } from '@/lib/training-program';
import { dayKey, recentDays, recordedDay, applyTrackerDay } from '@/lib/progress-metrics';
import { readBalance, practices, recordPractice } from '@/lib/balance/practice';
import { saveJourneyCheckIn } from '@/lib/journey-checkins';
import { getSleepSnapshot } from '@/api/sleep-snapshot';
import { ownerNow, readGrant } from './connection';
import type { GymExercise } from '@/lib/gym-library';

type Command = Record<string, unknown>;
const workout = () => useWorkoutStore.getState();
function days() {
  const {trainingPlan: plan, exerciseOverrides} = workout();
  if (!plan) return [];
  const library = cachedGymCatalogue();
  return buildTrainingWeek(library, plan).map((d, i) => {
    const chosen = exerciseOverrides[String(i + 1)];
    const items = chosen ? chosen.map(id => library.find(e => e.id === id && (e.location === plan.location || e.location === 'Both') && (e.video_path || e.videoUrl))).filter((e): e is GymExercise => !!e).map(e => prescribeExercise(e,plan)) : d.exercises;
    return {day:i+1, name:d.name, items};
  });
}
function live() {
  const {activeGymWorkout:a, gymSets} = workout();
  if (!a) return null;
  const library = cachedGymCatalogue();
  const exercises = a.exerciseIds.flatMap(id => {
    const e = library.find(e => e.id === id);
    return e ? [{...e, ...a.prescriptions?.[id]}] : [];
  });
  const remaining = exercises.flatMap(e => Array.from({length:e.sets},(_,i)=>({e, number:i+1})))
    .find(({e,number}) => !a.completedSetIds.includes(`${e.id}:${number}`));
  const next = remaining && (() => {
    const {e,number} = remaining;
    const previous = gymSets.filter(set=>set.exerciseId===e.id && set.metric === e.metric).at(-1);
    return {id:e.id,name:e.name,number,bodyweight:e.equipment==='Bodyweight',metric:e.metric,
      kg:previous?.kg ?? 0, reps:previous?.reps ?? Number(e.reps.match(/\d+/)?.[0] || 8), rest:e.rest_seconds};
  })();
  return {id:a.id,name:a.dayName, started:Date.parse(a.startedAt)/1000,
    restUntil:a.restEndsAt ? Date.parse(a.restEndsAt)/1000 : 0, done:gymSets.filter(s=>s.sessionId===a.id).length,
    total:exercises.reduce((n,e)=>n+e.sets,0), next:next||null};
}
function habits(today: string) {
  return useTrackingStore.getState().trackingData.filter(c=>c.custom).flatMap(c=>c.items.filter(i=>Object.prototype.hasOwnProperty.call(i.record||{},today)).map(i=>({category:c.id,id:i.id,name:i.label,done:i.record![today]}))).slice(0,24);
}
async function snapshot(owner:string,grant:string) {
  const balance = await readBalance(owner);
  if (ownerNow()!==owner || await readGrant(owner)!==grant || ownerNow()!==owner) return {locked:true};
  const week = new Set(recentDays(7)), today=dayKey();
  const sets=workout().gymSets.filter(s=>week.has(recordedDay(s.recordedAt)||'') && Date.parse(s.recordedAt)<=Date.now());
  const sessions = new Set(Object.values(workout().checkIns).flat().filter(d=>week.has(recordedDay(d)||'') && Date.parse(d)<=Date.now()));
  const timed = new Map(balance.sessions.filter(s=>s.method==='timer' && week.has(recordedDay(s.completedAt)||'') && Date.parse(s.completedAt)<=Date.now()).map(s=>[s.id,s.seconds]));
  return {grant,today,days:days().map(d=>({day:d.day,name:d.name,count:d.items.length})), active:live(), habits:habits(today),
    practices:practices.map(p=>({id:p.id,title:p.title,minutes:p.minutes,guide:p.steps[0]})),
    progress:{sets:sets.length,sessions:sessions.size,minutes:Math.floor([...timed.values()].reduce((a,b)=>a+b,0)/60)}};
}
const bounded=(n: unknown,min:number,max:number): n is number => typeof n==='number' && Number.isFinite(n) && n>=min && n<=max;
async function apply(owner:string,c:Command) {
  if(c.kind==='start') {
    const day=days().find(d=>d.day===c.day);
    if(!day?.items.length || workout().activeGymWorkout) throw Error('Refresh your routine before starting.');
    workout().startGymWorkout(day.day,day.name,day.items.map(e=>e.id),Object.fromEntries(day.items.map(e=>[e.id,{sets:e.sets,reps:e.reps,rest_seconds:e.rest_seconds}]))); return;
  }
  if(c.kind==='checkin') {
    if(c.date!==dayKey() || ![c.mood,c.focus,c.energy].every(n=>bounded(n,1,5)&&Number.isInteger(n))) throw Error('Choose all three ratings for today.');
    await saveJourneyCheckIn(owner,{mood:Number(c.mood),focus:Number(c.focus),energy:Number(c.energy)}); return;
  }
  if(c.kind==='habit') {
    const row=habits(dayKey()).find(h=>h.category===c.category && h.id===c.item);
    if(!row || c.date!==dayKey() || typeof c.done!=='boolean') throw Error('This step has changed. Refresh to see today’s steps.');
    const store=useTrackingStore.getState(),cat=store.trackingData.find(t=>t.id===row.category)!;
    store.updateTrackingCategory(cat.id,{items:applyTrackerDay(cat.items,dayKey(),{[row.id]:c.done})}); return;
  }
  if(c.kind==='practice') {
    const p=practices.find(p=>p.id===c.practice);
    if(!p || typeof c.run!=='string' || !/^[a-f\d-]{36}$/i.test(c.run) || !bounded(c.start,1,Date.now()/1000-p.minutes*60) || Date.now()/1000-c.start>86400) throw Error('Complete the practice timer before saving.');
    await recordPractice(owner,{id:`watch:${c.run}`,practiceId:p.id,method:'timer',seconds:p.minutes*60,completedAt:new Date((c.start+p.minutes*60)*1000).toISOString()}); return;
  }
  const a=live(); if(!a || c.session!==a.id) throw Error('This workout has changed. Refresh your watch.');
  if(c.kind==='set') {
    const e=a.next;
    if(!e || e.id!==c.exercise || e.number!==c.number) throw Error('The set has changed. Refresh before recording again.');
    if(!bounded(c.kg,0,2000) || (!e.bodyweight && c.kg<=0) || (e.bodyweight && c.kg!==0) || !bounded(c.reps,1,300) || !Number.isInteger(c.reps)) throw Error('Check the load and completed reps or seconds.');
    workout().completeGymSet({id:`${a.id}:${e.id}:${e.number}`,sessionId:a.id,day:workout().activeGymWorkout!.day,exerciseId:e.id,exerciseName:e.name,setNumber:e.number,kg:c.kg,reps:c.reps,metric:e.metric,setType:'Working',recordedAt:new Date().toISOString()});
    workout().setGymRestEnd(e.rest>0?new Date(Date.now()+e.rest*1000).toISOString():null); return;
  }
  if(c.kind==='skip' || c.kind==='extend') {
    if(a.restUntil!==c.deadline || a.restUntil*1000<=Date.now()) throw Error('The rest timer has changed.');
    if(c.kind==='skip') workout().setGymRestEnd(null); else workout().extendGymRest(15); return;
  }
  if(c.kind==='finish' && a.done>0) {
    const monday=new Date(); monday.setDate(monday.getDate()-(monday.getDay()+6)%7);
    workout().finishGymWorkout(dayKey(monday)); return;
  }
  throw Error('This action is unavailable. Refresh your watch.');
}
export async function handleWatchRequest(c:Command) {
  const owner=ownerNow(); if(!owner) return {locked:true};
  const grant=await readGrant(owner); if(!grant || ownerNow()!==owner) return {locked:true};
  if(c.kind==='refresh') return snapshot(owner,grant);
  if(c.grant!==grant) return {locked:true};
  if(c.kind==='wakeInfo' || c.kind==='scheduleWake') {
    let data=await refreshWake();
    if(await readGrant(owner)!==grant || ownerNow()!==owner) return {locked:true};
    if(c.kind==='scheduleWake') {
      if(c.expected!==(data.scheduled?.id ?? '')) throw Error('The wake-up changed on iPhone. Load settings again.');
      if(!Number.isInteger(c.hour) || !Number.isInteger(c.minute) || typeof c.sound!=='string') throw Error('Choose a valid time and tone.');
      const scheduled=await scheduleWake({...data.settings,hour:Number(c.hour),minute:Number(c.minute),sound:c.sound});
      if(!scheduled) throw Error('Complete scheduling on iPhone.');
      data={settings:scheduled.settings,scheduled};
    }
    if(await readGrant(owner)!==grant || ownerNow()!==owner) return {locked:true};
    return {wake:{tones:wakeSounds.map(({id,name})=>({id,name})), hour:data.settings.hour,minute:data.settings.minute,sound:data.settings.sound,
      mode:wakeCapability(),at:data.scheduled ? data.scheduled.at/1000 : null,scheduledID:data.scheduled?.id ?? null}};
  }
  if(c.kind==='sleep') {
    const saved = await getSleepSnapshot(owner);
    if(await readGrant(owner)!==grant || ownerNow()!==owner) return {locked:true};
    return {sleep:(saved?.snapshot.nights??[]).slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,7).map(({date,minutes,sourceName})=>({date,minutes,sourceName}))};
  }
  await apply(owner,c);
  return snapshot(owner,grant);
}
