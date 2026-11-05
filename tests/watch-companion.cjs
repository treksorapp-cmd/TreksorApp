const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path'), ts=require('typescript'), vm=require('node:vm');
const cache=new Map(),disk=new Map(),storage={getItem:async k=>disk.get(k)||null,setItem:async(k,v)=>disk.set(k,v)};
let owner='a',grant='permission', ratings,practices=[],nights=[],alarm=null, delayedSleep;
const today=new Date(),date=[today.getFullYear(),String(today.getMonth()+1).padStart(2,'0'),String(today.getDate()).padStart(2,'0')].join('-');
const habits=[{id:'private',custom:true,items:[{id:'a',label:'Call a friend',record:{[date]:false}},{id:'b',label:'Walk',record:{[date]:true}}]}];
const mocks={
  '@react-native-async-storage/async-storage':storage,'zustand/middleware':{persist:f=>f,createJSONStorage:()=>storage},'@/mock/workouts':{workoutContent:{},WorkoutsData:[]},
  './connection':{ownerNow:()=>owner,readGrant:async()=>grant},'@/lib/gym-catalogue':{cachedGymCatalogue:()=>[{id:'barbell-wide-bench-press',name:'Bench press',location:'Gym',metric:'reps',sets:2,reps:'8-12',rest_seconds:90,video_path:'bench.mp4'}]},
  '@/lib/journey-checkins':{saveJourneyCheckIn:async(_,v)=>ratings=v},'@/lib/balance/practice':{practices:[{id:'arrive',title:'Arrive',minutes:3,steps:['Sit.']}],readBalance:async()=>({sessions:practices}),recordPractice:async(_,s)=>{practices=practices.filter(p=>p.id!==s.id).concat(s)}},
  '@/store/tracking-store':{useTrackingStore:{getState:()=>({trackingData:habits,updateTrackingCategory:(_,p)=>Object.assign(habits[0],p)})}},
  '@/api/sleep-snapshot':{getSleepSnapshot:async()=>{if(delayedSleep)await delayedSleep;return {snapshot:{nights}}}},'@/lib/wake/sounds':{wakeSounds:[{id:'wake_01',name:'First light'}]},'@/lib/wake/service':{refreshWake:async()=>({settings:{hour:7,minute:0,sound:'wake_01'},scheduled:alarm}),wakeCapability:()=>'alarmkit',scheduleWake:async(settings)=>(alarm={settings,id:'alarm',at:Date.now()+600000})}
};
function load(file){if(cache.has(file))return cache.get(file);let mod={exports:{}};const req=id=>id in mocks?mocks[id]:id.startsWith('@/')?load(id.slice(2)+'.ts'):id.startsWith('.')?load(path.join(path.dirname(file),id)+'.ts'):require(id);vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{module:mod,exports:mod.exports,require:req,Date,Map,Set,Promise,console});cache.set(file,mod.exports);return mod.exports}
(async()=>{
 const store=load('store/workout-store.ts').useWorkoutStore;store.getState().saveTrainingPlan({days:2,location:'Gym',goal:'strength',experience:'beginner'});
 const handle=load('lib/watch/companion.ts').handleWatchRequest,send=(kind,fields={})=>handle({kind,grant,...fields});
 assert.equal((await send('refresh')).days.length,2);assert.equal((await send('start',{day:1,grant:'old'})).locked,true);
 const started=(await send('start',{day:1})).active,session=started.id,exercise=started.next.id;
 const action={session,exercise,number:1,kg:15,reps:8};await assert.rejects(send('set',{...action,kg:-1}));
 const first=await send('set',action);assert.equal(first.active.done,1);assert(first.active.restUntil>Date.now()/1000);await assert.rejects(send('set',action));assert.equal(store.getState().gymSets.length,1);
 const extended=await send('extend',{session,deadline:first.active.restUntil});assert.equal(extended.active.restUntil,first.active.restUntil+15);await assert.rejects(send('extend',{session,deadline:first.active.restUntil}));await send('skip',{session,deadline:extended.active.restUntil});
 const finished=await send('finish',{session});assert.equal(finished.active,null);assert.equal(finished.progress.sessions,1);await assert.rejects(send('finish',{session}));
 await send('habit',{date,item:'a',category:'private',done:true});assert(habits[0].items.every(h=>h.record[date]));await assert.rejects(send('habit',{date:'2000-01-01',item:'a',category:'private',done:false}));
 await assert.rejects(send('checkin',{date,mood:0,focus:2,energy:4}));await send('checkin',{date,mood:1,focus:2,energy:3});assert.equal(ratings.focus,2);
 const run={practice:'arrive',run:'00000001-0000-0000-0000-000000000000',start:Date.now()/1000-181};await assert.rejects(send('practice',{...run,start:Date.now()/1000}));await send('practice',run);const after=await send('practice',run);assert.equal(after.progress.minutes,3);assert.equal(practices.length,1);
 await send('scheduleWake',{expected:'',hour:7,minute:45,sound:'wake_01'});await assert.rejects(send('scheduleWake',{expected:'',hour:8,minute:0,sound:'wake_01'}));assert.equal((await send('wakeInfo')).wake.hour,7);
 nights=[{sourceName:'Apple Watch',date,minutes:425,private:'secret'}];assert(!JSON.stringify(await send('sleep')).includes('secret'));
 let release;delayedSleep=new Promise(resolve=>release=resolve);const pending=send('sleep');await new Promise(setImmediate);grant=null;release();assert.equal((await pending).locked,true);owner=null;assert.equal((await send('refresh')).locked,true);
 console.log('PASS watch: opt-in, live gym plan, validation, duplicate set/finish protection, rest conflicts, private tracker edits, check-ins, practice retries, wake replacement, sleep revocation');
})().catch(e=>{console.error(e);process.exitCode=1});
