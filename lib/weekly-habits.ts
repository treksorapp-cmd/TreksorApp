export type Pillar = "body"|"mind"|"balance"|"purpose";
export type Habit = {id:string;title:string;pillar:Pillar;minutes:number;weeklyTarget:number;createdAt:string;archived?:boolean};
export type HabitEntry = {habitId:string;date:string;minutes:number;completedAt:string};
export type HabitPlan = {version:1;habits:Habit[];entries:HabitEntry[]};
export const STARTERS:ReadonlyArray<{title:string;pillar:Pillar;minutes:number;weeklyTarget:number}>=[
 {title:"Reading",pillar:"mind",minutes:15,weeklyTarget:3},
 {title:"Strength training",pillar:"body",minutes:30,weeklyTarget:3},
 {title:"Walking",pillar:"body",minutes:30,weeklyTarget:5},
 {title:"Meditation",pillar:"balance",minutes:10,weeklyTarget:4},
 {title:"Journaling",pillar:"mind",minutes:10,weeklyTarget:3},
 {title:"Deep work",pillar:"purpose",minutes:30,weeklyTarget:3},
 {title:"Learning",pillar:"purpose",minutes:30,weeklyTarget:3},
 {title:"Mobility",pillar:"body",minutes:15,weeklyTarget:3}
];
export function localDay(date:Date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,"0"),d=String(date.getDate()).padStart(2,"0");return y+"-"+m+"-"+d}
export function weekStart(day:string){const d=new Date(day+"T12:00:00");const offset=(d.getDay()+6)%7;d.setDate(d.getDate()-offset);return localDay(d)}
export function inWeek(day:string,start:string){const end=new Date(start+"T12:00:00");end.setDate(end.getDate()+7);return day>=start&&day<localDay(end)}
export function weeklyCount(entries:HabitEntry[],habitId:string,day:string){const start=weekStart(day);return new Set(entries.filter(e=>e.habitId===habitId&&inWeek(e.date,start)).map(e=>e.date)).size}
export function isDoneToday(entries:HabitEntry[],id:string,day:string){return entries.some(e=>e.habitId===id&&e.date===day)}
export function toggleEntry(entries:HabitEntry[],habit:Habit,day:string):HabitEntry[]{const previous=entries.filter(e=>e.habitId===habit.id&&e.date===day);if(previous.length)return entries.filter(e=>!(e.habitId===habit.id&&e.date===day));return [...entries,{habitId:habit.id,date:day,minutes:habit.minutes,completedAt:new Date().toISOString()}]}
export function parsePlan(raw:string|null):HabitPlan{try{const p=raw?JSON.parse(raw):null;if(!p||p.version!==1||!Array.isArray(p.habits)||!Array.isArray(p.entries))return {version:1,habits:[],entries:[]};return {version:1,habits:p.habits.filter((h:Habit)=>h&&typeof h.id==="string"&&typeof h.title==="string"&&Number.isInteger(h.weeklyTarget)&&h.weeklyTarget>=1&&h.weeklyTarget<=7),entries:p.entries.filter((e:HabitEntry)=>e&&typeof e.habitId==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(e.date))}}catch{return {version:1,habits:[],entries:[]}}}
