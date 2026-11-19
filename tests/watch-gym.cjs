const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const path='lib/watch/companion.ts';
let owner='account-1',grant='gym-opt-in',lastUrl='',sourceCalls=0;
let permissionPause=null;
const now=new Date().toISOString();
const current={
  id:'workout-123',day:1,dayName:'Push day',startedAt:now,
  exerciseIds:['bench-press'],completedSetIds:[],restEndsAt:null,
  prescriptions:{'bench-press':{sets:3,reps:'8-12',rest_seconds:60}},
};
const state={
  activeGymWorkout:current,gymSets:[],checkIns:{},
  completeGymSet(entry){this.gymSets.push(entry);this.activeGymWorkout.completedSetIds.push(entry.exerciseId+':'+entry.setNumber);},
  setGymRestEnd(date){this.activeGymWorkout.restEndsAt=date;},
};
const catalogue=[{
  id:'bench-press',serverId:'demo-1',name:'Bench press',metric:'reps',
  equipment:'Barbell',sets:3,reps:'8-12',rest_seconds:60,
  video_path:'exercises/bench.mp4',
}];
const url='https://niakfwerfqmrmhuypkpd.supabase.co/storage/v1/object/sign/treksor-media/exercises/bench.mp4?token=signed';
const mocks={
  '@/lib/balance/practice':{readBalance:async()=>({sessions:[]})},
  '@/lib/progress-metrics':{recentDays:()=>[],recordedDay:()=>'',dayKey:()=> '2026-11-19'},
  '@/store/auth-store':{useAuthStore:{getState:()=>({isAuthenticated:true,user:{id:owner},token:'token'})}},
  '@/store/workout-store':{useWorkoutStore:{getState:()=>state}},
  '@/lib/gym-catalogue':{cachedGymCatalogue:()=>catalogue},
  '@/lib/exercise-video':{resolveExerciseVideo:async()=>{sourceCalls++;return lastUrl||url}},
  './connection':{
    ownerNow:()=>owner,
    readGrant:async()=> 'progress-grant',
    readWorkoutGrant:async()=>{if(permissionPause)await permissionPause;return grant},
  },
};
const js=ts.transpileModule(fs.readFileSync(path,'utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
const mod={exports:{}};
vm.runInNewContext(js,{module:mod,exports:mod.exports,require:key=>{if(!(key in mocks))throw Error(key);return mocks[key]},
  URL,Date,Number,Math,Object,Set,Map,Promise,AbortController,setTimeout,clearTimeout,fetch:()=>{throw Error('Unexpected remote write')}});
const {handleWatchRequest:request}=mod.exports;
(async()=>{
  let reply=await request({kind:'workout'});
  assert.equal(reply.workout.id,'workout-123');
  assert.equal(reply.workout.exercises[0].targetSets,3);
  assert.equal(reply.workout.exercises[0].hasVideo,true);
  assert.equal(reply.workout.exercises[0].previousKg,null);
  const cmd={kind:'workout_set',sessionId:current.id,exerciseId:'bench-press',setNumber:1,kg:45,reps:10};
  assert.deepEqual(JSON.parse(JSON.stringify(await request(cmd))),{saved:true,already:false});
  assert.equal(state.gymSets.length,1);
  assert.equal(state.gymSets[0].id,'workout-123:bench-press:1');
  assert(state.activeGymWorkout.restEndsAt);
  assert.deepEqual(JSON.parse(JSON.stringify(await request(cmd))),{saved:true,already:true});
  assert.equal(state.gymSets.length,1,'Retry must not create another set');
  assert.equal((await request({...cmd,kg:-1})).saved,undefined);
  assert.equal((await request({...cmd,reps:301})).saved,undefined);
  assert.equal((await request({...cmd,setNumber:4})).saved,undefined);
  assert.equal((await request({...cmd,sessionId:'wrong'})).saved,undefined);
  assert.equal((await request({...cmd,exerciseId:'not-in-plan'})).saved,undefined);
  reply=await request({kind:'workout_video',sessionId:current.id,exerciseId:'bench-press'});
  assert.equal(reply.videoUrl,url);
  assert.equal(sourceCalls,1);
  lastUrl='https://evil.example.com/bench.mp4';
  reply=await request({kind:'workout_video',sessionId:current.id,exerciseId:'bench-press'});
  assert.equal(reply.videoUrl,undefined);
  assert.equal(reply.error,'Watch video is unavailable.');
  lastUrl='';
  grant=null;
  assert.equal((await request({kind:'workout'})).locked,true);
  assert.equal((await request(cmd)).locked,true);
  assert.equal((await request({kind:'workout_video',sessionId:current.id,exerciseId:'bench-press'})).locked,true);
  grant='gym-opt-in';
  let resolvePermission;
  permissionPause=new Promise(resolve=>{resolvePermission=resolve});
  const inFlight=request({kind:'workout'});
  owner='account-2';resolvePermission();
  assert.equal((await inFlight).locked,true);
  owner=null;permissionPause=null;
  assert.equal((await request({kind:'workout'})).locked,true);
  assert.equal(state.gymSets.length,1);
  console.log('PASS: watch gym consent, live workout, signed video allowlist, set validation and retry-safe logs');
})().catch(error=>{console.error(error);process.exitCode=1});
