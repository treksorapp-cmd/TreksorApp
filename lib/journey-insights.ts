import {dayDate,dayKey,recentDays,recordedDay} from "@/lib/progress-metrics";
import type {JourneyCheckIn} from "@/lib/journey-checkins";
export type JourneySet={id:string;kg:number;reps:number;recordedAt:string;metric?:string};
export function buildJourneyInsights(checkIns:JourneyCheckIn[],journal:{date:string;mood:number}[],sets:JourneySet[],period:7|30,now=new Date()){
 const days=recentDays(period,now),from=days[0],to=days[days.length-1];const previousEnd=dayDate(from)!;previousEnd.setDate(previousEnd.getDate()-1);const previousDays=recentDays(period,previousEnd);
 const checkMap=new Map(checkIns.map(item=>[item.date,item]));const journalMap=new Map(journal.map(item=>[item.date,item.mood]));
 const series=days.map(date=>({date,mood:checkMap.get(date)?.mood??journalMap.get(date)??null,focus:checkMap.get(date)?.focus??null,energy:checkMap.get(date)?.energy??null}));
 const average=(key:"mood"|"focus"|"energy")=>{const values=series.map(item=>item[key]).filter((v):v is number=>typeof v==="number"&&v>=1&&v<=5);return {value:values.length?values.reduce((sum,v)=>sum+v,0)/values.length:null,days:values.length}};
 const unique=Array.from(new Map(sets.map(item=>[item.id,item])).values()).filter(item=>Number.isFinite(item.kg)&&item.kg>=0&&Number.isInteger(item.reps)&&item.reps>0);
 const within=(item:JourneySet,start:string,end:string)=>{const date=recordedDay(item.recordedAt);return !!date&&date>=start&&date<=end};
 const current=unique.filter(item=>within(item,from,to)),previous=unique.filter(item=>within(item,previousDays[0],dayKey(previousEnd)));
 const volume=(items:JourneySet[])=>items.filter(item=>item.metric!=="seconds").reduce((sum,item)=>sum+item.kg*item.reps,0);
 const currentVolume=volume(current),previousVolume=volume(previous);
 return {series,mood:average("mood"),focus:average("focus"),energy:average("energy"),sets:current.length,volume:currentVolume,previousVolume,volumeChange:previousVolume>0&&current.length?(currentVolume/previousVolume-1)*100:null,today:checkMap.get(to)||null};
}
