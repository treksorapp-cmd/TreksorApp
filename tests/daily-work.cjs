'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const storage=new Map();let failWrite=false;const cache=new Map();
function load(file){
 file=path.resolve(file);if(cache.has(file))return cache.get(file);
 const mod={exports:{}};cache.set(file,mod.exports);
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const req=id=>id==='@react-native-async-storage/async-storage'
  ?{getItem:async k=>storage.get(k)||null,setItem:async(k,v)=>{if(failWrite)throw Error('storage full');storage.set(k,v);}}
  :load(path.resolve(path.dirname(file),id+'.ts'));
 vm.runInNewContext(source,{module:mod,exports:mod.exports,require:req,Date,Map,Set,Promise,JSON,Number,encodeURIComponent,console}, {filename:file});
 return mod.exports;
}
(async()=>{
 const metrics=load('lib/progress-metrics.ts'),activities=load('lib/daily-activities.ts'),walks=load('lib/walks.ts');
 const today=metrics.dayKey(),createdAt=new Date().toISOString();
 const row=(id,kind,title,minutes=30)=>({id,kind,title,minutes,date:today,createdAt});
 assert.equal(activities.DAILY_ACTIVITY_OPTIONS.length,8);
 assert.deepEqual(Array.from(activities.DAILY_ACTIVITY_OPTIONS.map(x=>x.label)),
  ['Walk','Walk the dog','Hiking','Trekking','Sports','Running','Cycling','Swimming']);
 assert.equal((await activities.getDailyActivities('')).entries.length,0);
 await Promise.all([
  activities.saveDailyActivity('A',row('one','dog-walk','Walk the dog',20)),
  activities.saveDailyActivity('A',row('two','hiking','Hiking',60)),
  activities.saveDailyActivity('B',row('other','sports','Sports',45))
 ]);
 await activities.saveDailyActivity('A',row('one','dog-walk','Walk the dog',20));
 assert.equal((await activities.getDailyActivities('A')).entries.length,2,'Retries cannot create duplicates');
 assert.equal((await activities.getDailyActivities('B')).entries.length,1,'Accounts isolated');
 await activities.saveDailyActivity('A',row('three','custom','Climbing',null));
 assert.equal((await activities.getDailyActivities('A')).customTitles.join(''),"Climbing");
 await activities.removeDailyActivity('A','three');
 assert.equal((await activities.getDailyActivities('A')).customTitles.join(''),"Climbing",'Custom choices survive removal');
 for(const bad of [
  row('x','walk','Walk',15),row('x','dog-walk','Walk the dog',0),row('x','hiking','Hiking',1441),
  row('x','custom','',10),row('x','custom','x'.repeat(60),20),row('x','sports','Changed',10),
  {...row('x','trekking','Trekking'),date:'2026-02-30'}, {...row('x','hiking','Hiking'),date:'2999-01-01'}
 ])await assert.rejects(activities.saveDailyActivity('A',bad));
 await assert.rejects(activities.saveDailyActivity('A',row('stale','sports','Sports'),()=>false));
 failWrite=true;await assert.rejects(activities.saveDailyActivity('A',row('retry','sports','Sports')));failWrite=false;
 assert.equal((await activities.getDailyActivities('A')).entries.length,2,'Failed saves must not create activity');
 await activities.saveDailyActivity('A',row('retry','sports','Sports'));
 await activities.removeDailyActivity('A','retry');
 const walk={id:'original-walk',date:today,minutes:30,createdAt};
 await walks.saveWalk('A',walk);
 const events=metrics.buildProgressOverview({
  checkIns:{},gymSets:[],reflections:[],journalDates:[],trackers:[],meditations:[],
  articles:{},visionAnswers:null,walks:[walk,walk],dailyActivities:await activities.getDailyActivities('A').then(x=>x.entries)
 },7);
 assert.equal(events.activeDays,1,'One active day despite 2 activities and a walk');
 assert.equal(events.dailyWorkCount,3);
 assert.equal(events.dailyWorkDays,1);
 assert.equal(events.dailyWorkMinutes,110);
 assert.equal(events.events.filter(x=>x.kind==='walk').length,1,'Walk is not copied to daily activities');
 assert.equal(events.events.filter(x=>x.kind==='activity').length,2);
 assert.equal(events.sessions,0,'Manual movement must not become a gym session');
 await activities.removeDailyActivity('A','one');
 await activities.removeDailyActivity('A','two');
 await walks.removeWalk('A','original-walk');
 const empty=metrics.buildProgressOverview({
  checkIns:{},gymSets:[],reflections:[],journalDates:[],trackers:[],meditations:[],articles:{},visionAnswers:null,
  walks:await walks.getWalks('A'),dailyActivities:(await activities.getDailyActivities('A')).entries
 },7);
 assert.equal(empty.activeDays,0,'Undoing the last activity clears an active day');
 storage.set('treksor.daily-work.v1.corrupt','{unparseable}');
 await assert.rejects(activities.saveDailyActivity('corrupt',row('safe','sports','Sports')));
 assert.equal(storage.get('treksor.daily-work.v1.corrupt'),'{unparseable}','Bad storage never overwritten');
 assert.equal((await activities.getDailyActivities('B')).entries.length,1);
 const todayScreen=fs.readFileSync('app/(tabs)/today/index.tsx','utf8'),
  progressScreen=fs.readFileSync('app/(tabs)/tracking/index.tsx','utf8'),
  dailyUI=fs.readFileSync('components/DailyWork.tsx','utf8');
 assert(todayScreen.includes('<DailyWork />'));
 assert(progressScreen.includes('dailyActivities: dailyWork.entries'));
 assert(progressScreen.includes('data.dailyWorkCount'));
 assert(dailyUI.includes('saveWalk(owner,'),'Walk button reuses Body walks');
 assert(dailyUI.includes('saveDailyActivity(owner,'),'Other activities save in Daily Work');
 assert(dailyUI.includes('Add your own'));
 console.log('PASS: Daily Work presets/custom categories, independent accounts, safe storage, retries, removal, shared Walks and real Progress counts');
})().catch(e=>{console.error(e);process.exitCode=1});
