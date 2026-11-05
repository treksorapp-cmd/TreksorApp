const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map();let snapshots=[];
const chain=()=>{const q={then(resolve){return Promise.resolve({data:snapshots,error:null}).then(resolve)}};['select','eq','order','maybeSingle','limit'].forEach(k=>q[k]=()=>q);return q};
const context=vm.createContext({console,Intl,Date,Map,Set,URL,Promise,location:{hash:'#/progress'},document:{querySelector:s=>{if(!elements.has(s))elements.set(s,{innerHTML:'',classList:{add(){},remove(){},toggle(){}},setAttribute(){}});return elements.get(s)},querySelectorAll:()=>[]},window:{TREKSOR_CONFIG:{url:'https://example.invalid',key:'public'},supabase:{createClient:()=>({from:chain})}},setTimeout,clearTimeout});
for(const file of ['app.js','community.js','portal.js'])vm.runInContext(fs.readFileSync('dist/'+file,'utf8'),context);
const run=s=>vm.runInContext(s,context);
(async()=>{
 await run('renderProgress(0)');assert.match(elements.get('#main').innerHTML,/One account/);assert(!elements.get('#main').innerHTML.includes('0 / 0'));
 run("state.user={id:'test-a',email:'test@example.invalid',user_metadata:{name:'Test'},created_at:'2026-01-01'}");
 await run('renderProgress(0)');assert.match(elements.get('#main').innerHTML,/Your first sync starts in the app/);
 snapshots=[{device_id:'device-123',updated_at:'2026-10-25T01:00:00Z',payload:{version:1,device:'Test device',checkIns:{week:['2026-10-25T00:00:00Z']},gymSets:[{exerciseName:'<img src=x onerror=alert(1)>',kg:25,reps:10,recordedAt:'2026-10-25'}],trackers:[{title:'BODY',percentage:40,items:[]}],articles:{completed:1,total:2,read:[]},meditations:{completed:2,total:3},vision:{completed:3,total:10}}}];
 await run('renderProgress(0)');const html=elements.get('#main').innerHTML;assert.match(html,/40%/);assert.match(html,/Last synced/);assert.match(html,/25 kg/);assert(!html.includes('<img src=x'));assert.match(html,/&lt;img/);assert.match(html,/No pillar score recorded yet/);
 assert.equal(run("label('Deporte')"),'Sport');assert.match(run("options(['Tranquilo'],'Tranquilo')"),/value="Tranquilo" selected>Easygoing/);
 const escaped=run("personCard({display_name:'<script>bad</script>',city:'City',bio:'Hi',interests:[],pace:'Tranquilo',user_id:'a'})");assert(!escaped.includes('<script>'));
 console.log('PASS: signed-out gate, unsynced empty state, real snapshot rendering, missing-data labels, XSS escaping, preserved database enum values');
})().catch(e=>{console.error(e);process.exitCode=1});
