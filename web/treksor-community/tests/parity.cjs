const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const elements=new Map();
const stateData={events:[],groceries:[],writes:[]};
const getNode=key=>{if(!elements.has(key))elements.set(key,{innerHTML:"",textContent:"",classList:{add(){},remove(){},toggle(){}},setAttribute(){},showModal(){},close(){}});return elements.get(key)};
const db={from(table){
 let filters={},mode="select",body=null;
 const query={
  select(){return query},eq(key,value){filters[key]=value;return query},order(){return query},limit(){return query},
  update(payload){mode="update";body=payload;return query},
  delete(){mode="delete";return query},
  insert(payload){mode="insert";body=payload;return query},
  upsert(payload){stateData.writes.push({table,mode:"upsert",payload});if(table==="treksor_sync_events"&&!stateData.events.some(e=>e.user_id===payload.user_id&&e.event_key===payload.event_key))stateData.events.push(payload);return Promise.resolve({data:null,error:null})},
  then(resolve){let rows=(table==="treksor_sync_events"?stateData.events:stateData.groceries).filter(x=>Object.entries(filters).every(([k,v])=>x[k]===v));
   if(mode==="insert"){const item={id:"new",...body};stateData.groceries.push(item);rows=[item];stateData.writes.push({table,mode,payload:body})}
   if(mode==="update"){for(const x of rows)Object.assign(x,body);stateData.writes.push({table,mode,payload:body,filters})}
   if(mode==="delete"){stateData.groceries=stateData.groceries.filter(x=>!rows.includes(x));stateData.writes.push({table,mode,filters})}
   return Promise.resolve({data:rows,error:null}).then(resolve);
  }
 };
 return query;
}};
const context=vm.createContext({console,Date,Intl,Map,Set,Promise,setTimeout,clearTimeout,location:{hash:"#/today"},document:{querySelector:getNode,querySelectorAll:()=>[]},window:{crypto:{randomUUID:()=>"11111111-1111-4111-8111-111111111111"},TREKSOR_CONFIG:{url:"https://example.invalid",key:"test"},supabase:{createClient:()=>db}}});
for(const filename of ["app.js","community.js","portal.js","today.js","groceries.js"]){vm.runInContext(fs.readFileSync("dist/"+filename,"utf8"),context,{filename})}
const run=s=>vm.runInContext(s,context);
(async()=>{
 run("async function render() {}");
 await run("renderToday(0)");
 assert.match(getNode("#main").innerHTML,/One account/,"Today requires sign-in");
 assert.equal(stateData.writes.length,0,"No signed-out writes");
 run("state.user={id:'account-a',email:'a@example.invalid',user_metadata:{name:'A'}}");
 stateData.events=[{user_id:"other-account",kind:"today_completed",event_key:"2026-11-13",source:"web"}];
 await run("renderToday(0)");
 assert.doesNotMatch(getNode("#main").innerHTML,/2026-11-13/,"Another account's history must not be visible");
 assert.match(getNode("#main").innerHTML,/Only record completion/,"Date-only completion is explicit");
 await run("completeTodayWeb()");
 assert.equal(stateData.writes[0].table,"treksor_sync_events");
 assert.equal(stateData.writes[0].payload.user_id,"account-a");
 assert.equal(stateData.writes[0].payload.kind,"today_completed");
 assert.equal(JSON.stringify(stateData.writes[0].payload.payload),'{}');
 assert.equal(stateData.writes[0].payload.source,"web");
 stateData.groceries=[{id:"item-1",user_id:"account-a",name:"Oats",checked:false,created_at:"2026-11-15"},{id:"item-2",user_id:"other-account",name:"secret other user's goods",checked:false,created_at:"2026-11-15"}];
 await run("renderGroceries(0)");
 const html=getNode("#main").innerHTML;
 assert.match(html,/Oats/);
 assert.doesNotMatch(html,/secret other/);
 await run("updateGroceryWeb('check','item-1',false)");
 assert.equal(stateData.groceries[0].checked,true,"Web check updates shared record");
 await run("addGroceryWeb('Coffee')");
 assert.equal(stateData.groceries.length,3);
 assert.equal(stateData.groceries[2].user_id,"account-a");
 await run("updateGroceryWeb('delete','item-1',false)");
 assert(!stateData.groceries.some(x=>x.id==="item-1"));
 stateData.groceries.push({id:"escaped",user_id:"account-a",name:"<script>alert(1)</script>",checked:false});
 await run("renderGroceries(0)");
 assert(!getNode("#main").innerHTML.includes("<script>"),"User content must be escaped");
 assert(getNode("#main").innerHTML.includes("&lt;script&gt;"));
 console.log("PASS: signed-in and signed-out access, Today owner isolation, date-only events, grocery create/check/delete, HTML escaping");
})().catch(e=>{console.error(e);process.exitCode=1});
