export type HealthWorkout = {
 id:string; sourceId:string; sourceName:string; device:string;
 start:string; end:string; durationSeconds:number; distanceMeters:number|null; kind:string;
};
export type HealthSnapshot = {version:1; capturedAt:string; workouts:HealthWorkout[]};
const kinds=new Set(["Run","Walk","Hike","Ride","Swim","Strength","Yoga","Intervals","Row","Workout"]);
export function normalizeWorkouts(rows:unknown[], now=new Date()):HealthWorkout[] {
 if(!Array.isArray(rows)||rows.length>2000)throw Error("Unable to read a complete workout list.");
 const earliest=new Date(now);earliest.setHours(0,0,0,0);earliest.setDate(earliest.getDate()-29);
 const unique=new Map<string,HealthWorkout>();
 for(const raw of rows){
  if(!raw||typeof raw!=="object")continue;const r=raw as Record<string,unknown>;
  if(typeof r.id!=="string"||!/^[a-f0-9-]{36}$/i.test(r.id)||typeof r.sourceId!=="string"||!/^com\.(apple|garmin)\./i.test(r.sourceId))continue;
  const start=new Date(String(r.start)),end=new Date(String(r.end)),duration=Number(r.durationSeconds);
  if(!Number.isFinite(+start)||!Number.isFinite(+end)||start<earliest||end>now||end<start||!Number.isFinite(duration)||duration<=0||duration>604800||duration>(+end-+start)/1000+5)continue;
  const distance=typeof r.distanceMeters==="number"&&Number.isFinite(r.distanceMeters)&&r.distanceMeters>=0&&r.distanceMeters<=2000000?r.distanceMeters:null;
  unique.set(r.id.toLowerCase(),{id:r.id.toLowerCase(),sourceId:r.sourceId.slice(0,160),sourceName:String(r.sourceName||"Apple Health").slice(0,100),device:String(r.device||"").slice(0,100),start:start.toISOString(),end:end.toISOString(),durationSeconds:duration,distanceMeters:distance,kind:kinds.has(String(r.kind))?String(r.kind):"Workout"});
 }
 return [...unique.values()].sort((a,b)=>b.start.localeCompare(a.start));
}
export function sourceLabel(row:HealthWorkout){return /^com\.garmin\./i.test(row.sourceId)?`Garmin${row.device?` · ${row.device}`:""} via Apple Health`:`${row.sourceName}${row.device?` · ${row.device}`:""} via Apple Health`}
export function localDate(value:string|Date){const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
// One source at a time: overlapping Watch/Garmin records never inflate a combined total.
export function activityOverview(rows:HealthWorkout[],sourceId:string,period:7|30,now=new Date()){
 const days=Array.from({length:period},(_,i)=>({date:localDate(new Date(now.getFullYear(),now.getMonth(),now.getDate()-period+i+1,12)),minutes:0}));
 const chosen=[...new Map(rows.filter(r=>r.sourceId===sourceId).map(r=>[r.id,r])).values()].filter(r=>r.start<=now.toISOString());
 const current=chosen.filter(r=>localDate(r.start)>=days[0].date&&localDate(r.start)<=days[days.length-1].date);
 for(const row of current){const day=days.find(d=>d.date===localDate(row.start));if(day)day.minutes+=row.durationSeconds/60;}
 const previousStart=localDate(new Date(now.getFullYear(),now.getMonth(),now.getDate()-2*period+1));
 const previous=chosen.filter(r=>localDate(r.start)>=previousStart&&localDate(r.start)<days[0].date);
 const minutes=current.reduce((sum,r)=>sum+r.durationSeconds/60,0),previousMinutes=previous.reduce((sum,r)=>sum+r.durationSeconds/60,0);
 return{days,rows:current,sessions:current.length,minutes:Math.round(minutes),distanceKm:current.some(r=>r.distanceMeters!==null)?current.reduce((sum,r)=>sum+(r.distanceMeters||0),0)/1000:null,activeDays:days.filter(d=>d.minutes>0).length,
  change:period===7&&previousMinutes>0?Math.round((minutes-previousMinutes)/previousMinutes*100):null};
}
