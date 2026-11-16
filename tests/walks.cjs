const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const storage=new Map();let failWrite=false;
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const m={exports:{}};const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
 vm.runInNewContext(source,{module:m,exports:m.exports,require:id=>id==='@react-native-async-storage/async-storage'?{getItem:async key=>storage.get(key)||null,setItem:async(key,value)=>{if(failWrite)throw Error('disk full');storage.set(key,value)}}:load(path.resolve(path.dirname(file),id+'.ts')),Date,Map,Set,Promise,JSON,Number,encodeURIComponent});cache.set(file,m.exports);return m.exports;}
const walks=load('lib/walks.ts'),metrics=load('lib/progress-metrics.ts');
(async()=>{
 const date=metrics.dayKey(),createdAt=new Date().toISOString();
 const row=(id,minutes=20)=>({id,date,minutes,createdAt});
 assert.equal((await walks.getWalks('')).length,0);
 await Promise.all([walks.saveWalk('a',row('one')),walks.saveWalk('a',row('two',null)),walks.saveWalk('b',row('other',10))]);
 await walks.saveWalk('a',row('one'));
 assert.equal((await walks.getWalks('a')).length,2,'Retries must not double-count');
 assert.equal((await walks.getWalks('b')).length,1,'Separate account storage');
 const totals=walks.walkTotals(await walks.getWalks('a'));
 assert.equal(totals.today,2);assert.equal(totals.activeDays,1);assert.equal(totals.minutes,20);
 for(const invalid of [row('x',0),row('x',-2),row('x',1.5),row('x',1441),{...row('x'),date:'2026-02-30'},{...row('x'),date:'2999-01-01'}])await assert.rejects(walks.saveWalk('a',invalid));
 await assert.rejects(walks.saveWalk('a',row('stale'),()=>false));
 failWrite=true;await assert.rejects(walks.saveWalk('a',row('retry')));failWrite=false;
 assert.equal((await walks.getWalks('a')).length,2,'A failed write must not count');
 await walks.saveWalk('a',row('retry'));await walks.removeWalk('a','retry');
 await walks.removeWalk('a','one');assert.equal(walks.walkTotals(await walks.getWalks('a')).minutes,0);
 const input={checkIns:{gym:[date]},gymSets:[],reflections:[],journalDates:[],trackers:[],meditations:[],articles:{},visionAnswers:null,walks:[row('one'),row('one'),row('two')]};
 let data=metrics.buildProgressOverview(input,7);assert.equal(data.activeDays,1);assert.equal(data.events.filter(e=>e.kind==='walk').length,2);assert.equal(data.sessions,1,'Walks do not become gym sessions');
 data=metrics.buildProgressOverview({...input,checkIns:{},walks:[]},7);assert.equal(data.activeDays,0,'Removing the last activity removes its active day');
 storage.set('treksor.walks.v1.corrupt','not json');await assert.rejects(walks.saveWalk('corrupt',row('one')));assert.equal(storage.get('treksor.walks.v1.corrupt'),'not json');
 assert.equal((await walks.getWalks('b')).length,1);
 console.log('PASS walks: dates, optional minutes, concurrent saves, retries, failure recovery, deletion, account isolation and real active-day evidence');
})().catch(e=>{console.error(e);process.exit(1)});
