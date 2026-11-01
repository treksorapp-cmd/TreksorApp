export type SleepNight={date:string;sourceId:string;sourceName:string;device:string;minutes:number};
const dateKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
// Sleep-day is noon to noon. Overlapping asleep stages merge; awake/in-bed are never counted.
export function sleepNights(samples:unknown[],now=new Date()):SleepNight[]{
 if(!Array.isArray(samples)||samples.length>30000)throw Error("A complete sleep import is unavailable.");
 const earliest=new Date(now.getFullYear(),now.getMonth(),now.getDate()-29),oldest=dateKey(earliest),today=dateKey(now);
 const groups=new Map<string,{row:SleepNight;intervals:[number,number][]}>();
 for(const raw of samples){if(!raw||typeof raw!=="object")continue;const r=raw as Record<string,unknown>;
  if(typeof r.sourceId!=="string"||!/^com\.(apple|garmin)\./i.test(r.sourceId)||![1,3,4,5].includes(Number(r.value)))continue;
  let start=+new Date(String(r.start));const end=+new Date(String(r.end));if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end>+now||end-start>86400000)continue;
  while(start<end){const d=new Date(start),boundary=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);if(boundary<=d)boundary.setDate(boundary.getDate()+1);const stop=Math.min(end,+boundary),date=dateKey(boundary);
   if(date>=oldest&&date<=today){const key=r.sourceId+"|"+date;let group=groups.get(key);if(!group){group={row:{date,sourceId:r.sourceId.slice(0,160),sourceName:String(r.sourceName||"Apple Health").slice(0,100),device:String(r.device||"").slice(0,100),minutes:0},intervals:[]};groups.set(key,group)}group.intervals.push([start,stop])}start=stop;
  }
 }
 const result:SleepNight[]=[];for(const {row,intervals} of groups.values()){intervals.sort((a,b)=>a[0]-b[0]);let start=intervals[0][0],end=intervals[0][1],ms=0;for(const [a,b] of intervals.slice(1)){if(a<=end)end=Math.max(end,b);else{ms+=end-start;start=a;end=b}}ms+=end-start;row.minutes=Math.round(ms/60000);if(row.minutes>0)result.push(row)}return result.sort((a,b)=>b.date.localeCompare(a.date));
}
export function validNights(rows:unknown[]):SleepNight[]{if(!Array.isArray(rows)||rows.length>1000)throw Error("Invalid sleep import");return rows.flatMap(raw=>{if(!raw||typeof raw!=="object")return[];const r=raw as SleepNight;if(typeof r.sourceId!=="string"||!/^com\.(apple|garmin)\./i.test(r.sourceId)||!/^\d{4}-\d{2}-\d{2}$/.test(r.date)||!Number.isFinite(r.minutes)||r.minutes<=0||r.minutes>1500)return[];return[{date:r.date,sourceId:r.sourceId.slice(0,160),sourceName:String(r.sourceName).slice(0,100),device:String(r.device||"").slice(0,100),minutes:r.minutes}]})}
export function sleepOverview(rows:SleepNight[],source:string,now=new Date()){
 const today=dateKey(now),cutoff=dateKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()-6)),previousStart=dateKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()-13));
 const unique=[...new Map(rows.filter(r=>r.sourceId===source&&r.date<=today).map(r=>[r.date,r])).values()];
 const current=unique.filter(r=>r.date>=cutoff),previous=unique.filter(r=>r.date>=previousStart&&r.date<cutoff),avg=(rs:SleepNight[])=>rs.length?rs.reduce((n,r)=>n+r.minutes,0)/rs.length:null;
 const average=avg(current),before=avg(previous),change=current.length>=3&&previous.length>=3?Math.round(average!-before!):null;
 const days=Array.from({length:7},(_,i)=>{const date=dateKey(new Date(now.getFullYear(),now.getMonth(),now.getDate()-6+i));return{date,minutes:current.find(r=>r.date===date)?.minutes??null}});
 return{average,change,nights:current.length,previousNights:previous.length,days};
}
export function sleepDuration(minutes:number|null){if(minutes===null)return "—";const value=Math.round(minutes);return `${Math.floor(value/60)}h ${value%60}m`}
