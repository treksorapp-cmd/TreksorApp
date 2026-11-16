import AsyncStorage from '@react-native-async-storage/async-storage';
import { dayDate, dayKey, recentDays } from './progress-metrics';
export type Walk = { id:string; date:string; minutes:number|null; createdAt:string };
const queues=new Map<string,Promise<unknown>>();
const listeners=new Set<(owner:string)=>void>();
const storageKey=(owner:string)=>`treksor.walks.v1.${encodeURIComponent(owner)}`;
export function validWalk(value:unknown):value is Walk {
  if(!value||typeof value!=='object')return false;
  const row=value as Walk;
  return typeof row.id==='string'&&row.id.length>0&&row.id.length<=100&&typeof row.date==='string'&&!!dayDate(row.date)&&
    (row.minutes===null||Number.isInteger(row.minutes)&&row.minutes>=1&&row.minutes<=1440)&&
    typeof row.createdAt==='string'&&Number.isFinite(Date.parse(row.createdAt));
}
async function read(owner:string):Promise<Walk[]> {
  if(!owner)return [];
  const raw=await AsyncStorage.getItem(storageKey(owner));
  if(!raw)return [];
  const data=JSON.parse(raw);
  if(data?.version!==1||!Array.isArray(data.entries)||!data.entries.every(validWalk))throw Error('Your saved walks could not be read. Nothing has been overwritten.');
  return [...new Map<string,Walk>(data.entries.map((row:Walk)=>[row.id,row] as const)).values()].sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
}
export async function getWalks(owner:string){await queues.get(owner)?.catch(()=>{});return read(owner)}
export function subscribeWalks(listener:(owner:string)=>void){listeners.add(listener);return()=>{listeners.delete(listener)}}
function update(owner:string,change:(rows:Walk[])=>Walk[],isCurrent:()=>boolean) {
  if(!owner||!isCurrent())return Promise.reject(Error('Sign in to record a walk.'));
  const work=(queues.get(owner)||Promise.resolve()).catch(()=>{}).then(async()=>{
    if(!isCurrent())throw Error('Your account changed. Please try again.');
    const rows=await read(owner);
    if(!isCurrent())throw Error('Your account changed. Please try again.');
    const entries=change(rows);
    await AsyncStorage.setItem(storageKey(owner),JSON.stringify({version:1,entries}));
    listeners.forEach(listener=>listener(owner));
  });
  queues.set(owner,work);
  void work.finally(()=>{if(queues.get(owner)===work)queues.delete(owner)}).catch(()=>{});
  return work;
}
export function saveWalk(owner:string,walk:Walk,isCurrent:()=>boolean=()=>true) {
  if(!validWalk(walk)||walk.date>dayKey())return Promise.reject(Error('Choose a valid walk and a date no later than today.'));
  return update(owner,rows=>rows.some(row=>row.id===walk.id)?rows:[walk,...rows],isCurrent);
}
export function removeWalk(owner:string,id:string,isCurrent:()=>boolean=()=>true){return update(owner,rows=>rows.filter(row=>row.id!==id),isCurrent)}
export function walkTotals(rows:Walk[],now=new Date()) {
  const days=recentDays(7,now),today=dayKey(now);
  const valid=[...new Map(rows.filter(validWalk).map(row=>[row.id,row])).values()].filter(row=>row.date>=days[0]&&row.date<=today);
  return {today:valid.filter(row=>row.date===today).length,week:valid.length,activeDays:new Set(valid.map(row=>row.date)).size,minutes:valid.reduce((sum,row)=>sum+(row.minutes||0),0)};
}
