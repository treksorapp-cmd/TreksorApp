import AsyncStorage from "@react-native-async-storage/async-storage";
import {useAuthStore} from "@/store/auth-store";
import {useProgressSyncStore} from "@/store/progress-sync-store";
export const practices=[
 {id:"arrive",title:"Arrive here",kind:"Meditate",minutes:3,goal:"Begin",description:"A first practice in noticing, without needing to get it right.",steps:["Sit comfortably. Let your hands rest. Keep your eyes open or closed, whichever feels easier.","Notice where your body meets the seat. Let your breathing keep its natural rhythm.","When your attention wanders, gently return to one breath. Wandering is part of the practice."]},
 {id:"reset",title:"A quieter moment",kind:"Breathe",minutes:3,goal:"Unwind",description:"A gentle visual rhythm for an ordinary pause.",steps:["Settle into a supported position. There is nothing to force.","Follow the circle only if the pace feels comfortable. Breathe naturally whenever you prefer.","Let your breath return to its own rhythm. Notice one thing around you before continuing."]},
 {id:"focus",title:"One thing at a time",kind:"Meditate",minutes:5,goal:"Focus",description:"Practice returning your attention to the present task.",steps:["Choose a quiet point to rest your attention: a breath, a sound or the feeling of your hands.","Each time another thought arrives, notice it and return. You do not have to push anything away.","Choose one small action for after this practice. Let everything else wait for a moment."]},
 {id:"release",title:"Leave the day here",kind:"Sleep",minutes:5,goal:"Sleep",description:"A quiet transition from doing to resting.",steps:["Lower the light if you like. Find a comfortable place to rest, with no need to fall asleep.","Notice your shoulders, hands and jaw. Let each soften only as much as feels natural.","Allow unfinished tasks to remain unfinished for tonight. Rest your attention on the support beneath you."]},
 {id:"body",title:"Return to your body",kind:"Meditate",minutes:10,goal:"Unwind",description:"A slow, optional check-in with physical sensations.",steps:["Notice your feet and the support beneath you. You can skip any area that feels uncomfortable.","Let your attention move gently through your legs, hands and shoulders. Simply notice sensations.","Return to the whole body. Open your eyes and look around whenever you wish."]},
 {id:"evening",title:"Make room for rest",kind:"Sleep",minutes:3,goal:"Sleep",description:"A short evening ritual, even when you are away from home.",steps:["Put down what you can for tonight. Find a comfortable, quiet position.","Notice three ordinary sounds without needing to name or change them.","Let the next breath come naturally. You can stay here or close the practice when ready."]}
] as const;
export type PracticeSession={id:string;practiceId:string;completedAt:string;seconds:number;method:"timer"|"self-report"};
export type BalanceData={goal:"Begin"|"Unwind"|"Focus"|"Sleep";weeklyDays:number;minutes:number;preferredTime:string;favorites:string[];sessions:PracticeSession[];wakeRatings:Record<string,number>};
const defaults:BalanceData={goal:"Begin",weeklyDays:3,minutes:3,preferredTime:"Evening",favorites:[],sessions:[],wakeRatings:{}};
const key=(owner:string)=>"treksor.balance.v1."+owner;let queue:Promise<unknown>=Promise.resolve();
export async function readBalance(owner:string):Promise<BalanceData>{if(!owner)return{...defaults};const raw=await AsyncStorage.getItem(key(owner));return raw?{...defaults,...JSON.parse(raw)}:{...defaults}}
export function updateBalance(owner:string,change:(data:BalanceData)=>BalanceData){const work=async()=>{if(useAuthStore.getState().user?.id!==owner)throw Error("Your account changed. Please try again.");const data=change(await readBalance(owner));await AsyncStorage.setItem(key(owner),JSON.stringify(data));if(useAuthStore.getState().user?.id===owner)useProgressSyncStore.getState().requestSync();return data};const next=queue.then(work,work);queue=next.catch(()=>{});return next}
export function recordPractice(owner:string,session:PracticeSession){if(!session.id||!Number.isFinite(session.seconds)||session.seconds<0||session.seconds>7200)throw Error("Invalid practice");return updateBalance(owner,data=>({...data,sessions:[...data.sessions.filter(s=>s.id!==session.id),session].slice(-1000)}))}
export function dateKey(value:string|Date){const d=new Date(value);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
export function practiceStats(data:BalanceData,now=new Date()){
 const sessions=[...new Map(data.sessions.map(s=>[s.id,s])).values()].filter(s=>Number.isFinite(+new Date(s.completedAt))&&new Date(s.completedAt)<=now);
 const days=new Set(sessions.map(s=>dateKey(s.completedAt)));const today=dateKey(now),cursor=new Date(now);let streak=0;
 if(!days.has(today))cursor.setDate(cursor.getDate()-1);
 while(days.has(dateKey(cursor))){streak++;cursor.setDate(cursor.getDate()-1)}
 const week=Array.from({length:7},(_,i)=>{const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-6+i,12),key=dateKey(d);return{date:key,done:days.has(key)}});
 return{streak,days:days.size,sessions:sessions.length,minutes:Math.floor(sessions.filter(s=>s.method==="timer").reduce((sum,s)=>sum+s.seconds,0)/60),week,weekDays:week.filter(d=>d.done).length};
}
export function balanceSyncPayload(data:BalanceData){return{goal:data.goal,weeklyDays:data.weeklyDays,sessions:data.sessions.map(({id,practiceId,completedAt,seconds,method})=>({id,practiceId,completedAt,seconds,method}))}}
