const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
process.env.TZ='Australia/Brisbane';
function load(file,mocks={},globals={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,{module,exports:module.exports,require:id=>id in mocks?mocks[id]:require(id),Error,Date,Map,Set,Promise,TextEncoder,Request,Response,AbortController,setTimeout,clearTimeout,console,...globals},{filename:file});return module.exports}
const core=load('supabase/functions/_shared/mentor.ts'),now=new Date(2026,10,2,12);
const raw={checkIns:{a:['2026-11-01T10:00:00+10:00','2026-11-01T10:00:00+10:00','2026-11-03','2026-10-01']},gymSets:[{id:'x',kg:10,reps:8,recordedAt:'2026-11-02'},{id:'x',kg:10,reps:8,recordedAt:'2026-11-02'},{id:'bad',kg:-1,reps:10,recordedAt:'2026-11-02'}],balance:{sessions:[{id:'s',seconds:180,method:'timer',completedAt:'2026-10-30'},{id:'m',seconds:600,method:'self-report',completedAt:'2026-10-30'}],wakeRatings:{SECRET:4}},trackers:[{id:'t',custom:true,items:[{id:'i',label:'SECRET',record:{'2026-10-29':true,'2026-10-28':false,'2026-11-09':true}}]}],health:{SECRET:'private'},journal:'SECRET',mood:4};
const brief=core.buildMentorBrief(raw,now);
assert.equal(brief.start,'2026-10-27');assert.equal(brief.sessions,1);assert.equal(brief.sets,1);assert.equal(brief.practices,2);assert.equal(brief.practiceMinutes,3);assert.equal(brief.habitChecks,1);assert.equal(brief.activeDays,4);assert(!JSON.stringify(brief).includes('SECRET'));
assert.equal(core.buildMentorBrief(null,now).activeDays,0);assert.equal(core.parseMentorBrief({...brief,activeDays:8}),null);assert.equal(core.parseMentorBrief({...brief,start:'2026-02-30'}),null);assert.equal(core.parseMentorBrief({...brief,start:'2026-10-26'}),null);assert(!JSON.stringify(core.parseMentorBrief({...brief,health:'SECRET'})).includes('SECRET'));assert.equal(core.parseMemory({category:'system',content:'x',user_approved:true}),null);assert.equal(core.parseMemory({category:'mind',content:' ',user_approved:true}),null);assert.equal(core.parseMemory({category:'mind',content:'okay',user_approved:false}).user_approved,false);
(async()=>{
 let owner='a',calls=[];const auth={getState:()=>({user:{id:owner},isAuthenticated:true,token:'token',getCurrentUser:async()=>{}})};
 let release;const api=load('api/mentor.ts',{'@/store/auth-store':{useAuthStore:auth}},{fetch:async(url,init)=>{calls.push({url,init});await new Promise(r=>release=r);return{ok:true,status:200,json:async()=>({memories:[]})}}});
 const pending=api.listMentorMemories('a');owner='b';release();await assert.rejects(pending,/account changed/);assert.equal(calls.length,1);
 // The real Zustand store rejects late history and send responses after an account change.
 owner='a';let historyRelease,sendRelease;const actions=[];
 const chat=load('store/chat-store.ts',{'@/store/auth-store':{useAuthStore:auth},'@/lib/utils':{generateRandomId:()=>String(Math.random())},'@/supabase/functions/_shared/mentor':core,'@/api/mentor':{mentorRequest:async(id,body)=>{actions.push(body);if(body.action==='history')return new Promise(resolve=>historyRelease=resolve);return new Promise(resolve=>sendRelease=resolve)}}}).useChatStore;
 chat.getState().setUserId('a');const historyLoad=chat.getState().loadHistory();const sending=chat.getState().sendMessage('Keep this draft');historyRelease({conversations:[]});await historyLoad;assert.equal(chat.getState().chats.a.length,1,'Late history cannot replace a message in flight');
 owner='b';chat.getState().setUserId('b');sendRelease({conversationId:'old',message:{content:'Private answer'}});assert.equal(await sending,false);assert.equal(chat.getState().loading,false);assert.equal(chat.getState().getMessages().length,0);
 const retry=load('store/chat-store.ts',{'@/store/auth-store':{useAuthStore:auth},'@/lib/utils':{generateRandomId:()=>String(Math.random())},'@/supabase/functions/_shared/mentor':core,'@/api/mentor':{mentorRequest:async()=>{throw Error('Network failure')}}}).useChatStore;retry.getState().setUserId('b');assert.equal(await retry.getState().sendMessage('Keep my input'),false);assert.equal(retry.getState().loading,false);assert.equal(retry.getState().getMessages().length,0);assert.equal(retry.getState().error,'Network failure');
 // Actual Edge handler with mocked database/provider. Validate consent, ownership and request boundaries.
 const userId='11111111-1111-4111-8111-111111111111',conversation='22222222-2222-4222-8222-222222222222';
 let handler,providerCalls=0,providerBody,dbCalls=[],apiKey='configured';
 function client(url,key,options){return{auth:{getUser:async token=>({data:{user:token==='valid'?{id:userId}:null},error:token==='valid'?null:{}})},from:table=>{
  const q={table,filters:[],op:'select',columns:'',values:null};dbCalls.push(q);
  const chain={select:(cols,opts)=>{q.columns=cols;q.opts=opts;return chain},eq:(k,v)=>{q.filters.push([k,v]);return chain},gte:()=>chain,order:()=>chain,limit:()=>chain,update:v=>{q.op='update';q.values=v;return chain},insert:v=>{q.op='insert';q.values=v;return chain},delete:()=>{q.op='delete';return chain},maybeSingle:()=>result(true),single:()=>result(true),then:(a,b)=>Promise.resolve(result()).then(a,b)};
  function result(single=false){if(table==='ai_memories')return {data:q.op==='select'?[{category:'purpose',content:'Keep it manageable'}]:{id:'saved'},count:0,error:null};if(table==='ai_conversations')return{data:single?{id:conversation}:[],error:null};return{data:[],count:0,error:null}}return chain;
 }}}
 load('supabase/functions/treksor-ai/index.ts',{'jsr:@supabase/functions-js/edge-runtime.d.ts':{},'npm:@supabase/supabase-js@2.95.0':{createClient:client},'../_shared/mentor.ts':core},{Deno:{env:{get:k=>k==='OPENAI_API_KEY'?apiKey:'configured'},serve:fn=>handler=fn},fetch:async(url,init)=>{providerCalls++;providerBody=JSON.parse(init.body);return new Response(JSON.stringify({output:[{content:[{type:'output_text',text:'You recorded one session. What would feel manageable today?'}]}]}),{status:200})}});
 const request=(body,token='valid')=>handler(new Request('https://test',{method:'POST',headers:{Authorization:'Bearer '+token},body:JSON.stringify(body)}));
 assert.equal((await handler(new Request('https://test',{method:'OPTIONS'}))).status,204);
 assert.equal((await request({action:'history'},'wrong')).status,401);
 assert.equal((await request(null)).status,400);
 assert.equal((await request({message:'Review',brief})).status,400);assert.equal(providerCalls,0);
 assert.equal((await request({message:'Review',brief:{...brief,sets:-1},shareBrief:true})).status,400);
 assert.equal((await request({message:'x'.repeat(13000)})).status,413);
 assert.equal((await request({action:'save_memory',memory:{category:'mind',content:'A goal',user_approved:true,user_id:'other'}})).status,200);
 const inserted=dbCalls.find(q=>q.table==='ai_memories'&&q.op==='insert');assert.equal(inserted.values.user_id,userId);
 assert.equal((await request({action:'send',message:'Review',brief:{...brief,health:'SECRET'},shareBrief:true,mode:'weekly_review'})).status,200);assert.equal(providerCalls,1);assert.equal(providerBody.store,false);assert(!JSON.stringify(providerBody).includes('SECRET'));
 assert(!providerBody.instructions.includes('Keep it manageable'),'User memories are not system instructions');assert(providerBody.input[0].content.includes('Keep it manageable'));
 assert(dbCalls.filter(q=>q.table==='ai_memories'&&q.op==='select'&&!q.opts?.head).some(q=>q.filters.some(([k,v])=>k==='user_approved'&&v===true)));
 const saved=dbCalls.find(q=>q.table==='ai_messages'&&q.op==='insert');assert(saved.values[0].content.includes('Shared with Mentor'));assert(Date.parse(saved.values[1].created_at)>Date.parse(saved.values[0].created_at),'Persisted reply follows its user message');
 assert(dbCalls.filter(q=>q.table==='ai_messages'&&q.op==='select').every(q=>q.filters.some(([k,v])=>k==='user_id'&&v===userId)));
 assert(!dbCalls.some(q=>['health_snapshots','sleep_snapshots','app_progress'].includes(q.table)),'No automatic private-data reads');
 console.log('PASS Mentor totals, consent allowlist, real dates, account switch, memory ownership, HTTP validation, approved context and private-data exclusions');
})().catch(e=>{console.error(e);process.exitCode=1});
