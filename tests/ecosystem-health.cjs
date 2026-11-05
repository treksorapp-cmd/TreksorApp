const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
process.env.TZ='Australia/Brisbane';
function load(file,mocks={},extra={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:module.exports,module,require:id=>mocks[id]??require(id),Date,Map,Set,Promise,URL,AbortController,setTimeout,clearTimeout,...extra});return module.exports}
const a=load('lib/ecosystem/activity.ts'),now=new Date('2026-11-01T12:00:00+10:00');
const row=(n,source='com.apple.health',start='2026-10-31T08:00:00+10:00')=>({id:`91000000-0000-4000-8000-${String(n).padStart(12,'0')}`,sourceId:source,sourceName:source,device:'Watch',start,end:new Date(+new Date(start)+1800000).toISOString(),durationSeconds:1800,kind:'Run',distanceMeters:5000});
const rows=a.normalizeWorkouts([row(1),row(1),row(2,'com.garmin.connect.mobile'),row(3,'com.strava.stravaride'),{...row(4),durationSeconds:-5},{...row(5),end:'2027-01-01'},row(6,'com.apple.health','2026-10-24T08:00:00+10:00'),{...row(7),id:'bad'}],now);
assert.equal(rows.length,3);const o=a.activityOverview(rows,'com.apple.health',7,now);assert.equal(o.sessions,1);assert.equal(o.minutes,30);assert.equal(o.distanceKm,5);assert.equal(o.change,0);assert.equal(o.activeDays,1);assert.equal(o.days.length,7);
assert.equal(a.activityOverview(rows,'com.garmin.connect.mobile',7,now).sessions,1);assert.equal(a.activityOverview([], '',7,now).distanceKm,null);
assert.equal(a.normalizeWorkouts([{...row(9),distanceMeters:undefined}],now)[0].distanceMeters,null);
assert.equal(a.normalizeWorkouts([row(10,'com.apple.health','2026-09-01')],now).length,0);
assert.equal(a.normalizeWorkouts([{...row(9),journal:'SECRET',heartRate:80,route:'PRIVATE'}],now)[0].journal,undefined);
assert.equal(a.activityOverview(rows,'com.apple.health',30,now).change,null,'30-day import cannot compare a prior 30 days');

(async()=>{
 let account={token:'token',user:{id:'91000000-0000-4000-8000-000000000001'}},sent=[];
 const api=load('api/health-snapshot.ts',{'@/store/auth-store':{useAuthStore:{getState:()=>account}},'@/lib/ecosystem/activity':a},{fetch:async(url,init)=>{sent.push({url,init});return{ok:true,status:200,json:async()=>[]}}});
 await api.saveHealthSnapshot(account.user.id,[{...row(20,'com.apple.health',new Date(Date.now()-3600000).toISOString()),journal:'SECRET'}]);
 assert(!sent[0].init.body.includes('SECRET'));assert.equal(JSON.parse(sent[0].init.body).user_id,account.user.id);assert.equal(sent[0].init.headers.Authorization,'Bearer token');
 await assert.rejects(api.saveHealthSnapshot('other',[]));assert.equal(sent.length,1);
 const guarded=load('api/health-snapshot.ts',{'@/store/auth-store':{useAuthStore:{getState:()=>account}},'@/lib/ecosystem/activity':a},{fetch:async()=>{account={token:'other',user:{id:'other'}};return{ok:true,status:200,json:async()=>[]}}});
 await assert.rejects(guarded.getHealthSnapshot('91000000-0000-4000-8000-000000000001'));
 const source=fs.readFileSync('modules/treksor-health/ios/TreksorHealthModule.swift','utf8');assert(source.includes('toShare: []'));assert(!source.includes('heartRate'));assert(!source.includes('save('));
 console.log('PASS workout validation, explicit upload allowlist, source isolation, missing distances, source exclusion, account-switch guards, calendar boundaries and upload privacy');
})().catch(e=>{console.error(e);process.exitCode=1});
