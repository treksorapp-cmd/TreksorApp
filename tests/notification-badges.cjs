const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,mocks={},extra={}){const module={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true,jsx:ts.JsxEmit.ReactJSX}}).outputText;vm.runInNewContext(code,{module,exports:module.exports,require:n=>n in mocks?mocks[n]:require(n),console,Date,Map,Set,URLSearchParams,setTimeout,clearTimeout,...extra},{filename:file});return module.exports;}
const tick=()=>new Promise(setImmediate);
(async()=>{
 const model=load('lib/notification-inbox.ts');
 const n=(id,kind='thought',read=false)=>({id:`${kind}:${id}`,kind,title:id,route:kind==='article'?`/article/${id}`:'/mental/thoughts',date:'2026-11-25',read});
 assert.equal(model.noticeFromNotification('os',{data:{kind:'treksor-wake'}}),null,'Wake alarm ownership remains separate');
 assert.equal(model.noticeFromNotification('os',{data:{type:'powerThought',powerThoughtId:'a'}}).id,'thought:a');
 assert.equal(model.noticeFromNotification('os',{data:{treksorDailyThought:true,thoughtId:'a'}}).id,'thought:a');
 assert.equal(model.noticeFromNotification('os',{data:{type:'article',articleId:'b'}}).route,'/article/b');
 assert.equal(model.noticeFromNotification('os',{data:{source:'quick-notes',noteId:'c',owner:'A'}}).id,'reminder:c');
 assert.equal(model.safeNoticeRoute('https://evil.test'),null);assert.equal(model.safeNoticeRoute('/mental/../profile'),null);assert.equal(model.safeNoticeRoute('/mental/articles/a'),'/mental/articles/a');assert.equal(model.safeNoticeRoute('/(tabs)/articles/a'),'/(tabs)/articles/a');
 assert.equal(model.noticeCount(model.mergeNotices([n('a')],[n('a'),n('b')],{})),2);
 assert.equal(model.noticeCount(model.mergeNotices([n('a')],[n('a')],{'thought:a':true})),0,'Duplicate delivery never resurrects a read item');
 const disk=new Map();const storage={getItem:async k=>disk.get(k)||null,setItem:async(k,v)=>{await tick();disk.set(k,v)}};
 const makeStore=()=>load('store/notification-store.ts',{'@/lib/notification-inbox':model,'@react-native-async-storage/async-storage':storage}).useNotificationStore;
 let store=makeStore();await store.getState().activate('A');store.getState().receive([n('a'),n('b','article'),{...n('foreign'),owner:'B'}]);
 assert.equal(model.noticeCount(store.getState().items),2,'Reject another account’s notification');
 store.getState().markRead(['thought:a']);store.getState().receive([n('a')]);
 store.getState().sync('article',[n('b','article'),n('c','article')]);
 assert.equal(model.noticeCount(store.getState().items),2);
 store.getState().sync('article',[n('c','article')]);assert.equal(model.noticeCount(store.getState().items),1,'Withdrawn catalogue item removed');
 await store.getState().activate('B');assert.equal(store.getState().items.length,0);
 await store.getState().activate('A');assert.equal(model.noticeCount(store.getState().items),1,'Account-scoped state survives restart/switch');
 assert(store.getState().read['thought:a']);
 // Await the write queue before reloading; activate waits on outstanding saves.
 store.getState().markRead(['article:c']);await store.getState().activate('A');store=makeStore();await store.getState().activate('A');assert.equal(model.noticeCount(store.getState().items),0);
 const pending={};const delayed=load('store/notification-store.ts',{'@/lib/notification-inbox':model,'@react-native-async-storage/async-storage':{...storage,getItem:k=>new Promise(r=>pending[k]=r)}}).useNotificationStore;
 const a=delayed.getState().activate('A');await tick();const b=delayed.getState().activate('B');await tick();pending['treksor.notifications.v1.B'](null);await b;pending['treksor.notifications.v1.A'](JSON.stringify({items:[n('old')]}));await a;assert.equal(delayed.getState().owner,'B');assert.equal(delayed.getState().items.length,0,'Late previous-account hydration ignored');
 // Thought receipts persist across midnight and rapid consecutive reads.
 let rows=[{_id:'one',thought:'One',date:'2026-11-25'},{_id:'two',thought:'Two',date:'2026-11-25'}];
 let day='2026-11-25';const publication={publicationDay:()=>day};
 const thoughts=load('store/thought-store.ts',{'@/lib/content-publication':publication,'@react-native-async-storage/async-storage':storage,axios:{get:async()=>({data:{data:rows}})}}).usePowerThoughtStore;
 await thoughts.getState().fetchPowerThoughts();thoughts.getState().markPowerThoughtAsRead('one');thoughts.getState().markPowerThoughtAsRead('two');await thoughts.getState().flushReadState();day='2026-11-26';await thoughts.getState().fetchPowerThoughts();assert(thoughts.getState().powerThoughts.every(t=>t.isRead));
 const saved=JSON.parse(disk.get('treksor.thoughts.read.v1'));assert(saved.one && saved.two,'Serialized saves preserve both reads');
 // Scheduled local notification carries badge + stable ID + owner; reads cancel it.
 let scheduled=[],cancelled=[];
 const notifications={getPermissionsAsync:async()=>({granted:true}),getAllScheduledNotificationsAsync:async()=>scheduled, scheduleNotificationAsync:async value=>{scheduled.push({identifier:'scheduled',...value});return 'scheduled'},cancelScheduledNotificationAsync:async id=>cancelled.push(id),SchedulableTriggerInputTypes:{DATE:'date'}};
 const RealDate=Date;class Morning extends RealDate{constructor(...args){super(...(args.length?args:['2026-11-25T01:00:00']))}}
 const scheduler=load('lib/daily-thought-notification.ts',{'expo-notifications':notifications,'@react-native-async-storage/async-storage':storage,'@/store/notification-store':{useNotificationStore:store},'@/lib/notification-inbox':model},{Date:Morning});
 await scheduler.scheduleTodaysPowerThought('New','new');assert.equal(scheduled[0].content.badge,1);assert.equal(scheduled[0].content.data.thoughtId,'new');assert.equal(scheduled[0].content.data.owner,'A');await scheduler.scheduleTodaysPowerThought('New','new');assert.equal(scheduled.length,1);await scheduler.cancelThoughtReminder('new');assert.deepEqual(cancelled,['scheduled']);
 console.log('Notification badges: canonical IDs, safe routes, deduplication, durable reads, midnight, account isolation, hydration races, unpublishing and local payload/cancellation passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
