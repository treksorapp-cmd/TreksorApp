const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), ts = require('typescript');
function load(file, mocks={}, globals={}) {
 const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText;
 vm.runInNewContext(code,{module,exports:module.exports,require:name=>name in mocks?mocks[name]:require(name),console,Date,Map,Set,URLSearchParams,setInterval,clearInterval,...globals},{filename:file});return module.exports;
}
const publication=load('lib/content-publication.ts');
assert.equal(publication.publicationDay(new Date('2026-10-27T13:59:59Z')),'2026-10-27');
assert.equal(publication.publicationDay(new Date('2026-10-27T14:00:00Z')),'2026-10-28');
assert(publication.matchesCategory('Mind','Mental'));assert(publication.matchesCategory('Balance','Spiritual'));assert(!publication.matchesCategory('Body','Purpose'));
let thoughtRows=[], articleRows=[], fail=false;
const storage={getItem:async()=>null,setItem:async()=>{}};
const mocks={
 '@/lib/content-publication':publication,
 '@react-native-async-storage/async-storage':storage,
 'zustand/middleware':{persist:fn=>fn,createJSONStorage:()=>storage},
 '@/lib/utils':{countRead:rows=>rows.filter(r=>r.isRead).length,errorHandler:()=>{}},
 '@/api/axios':{api:{get:async()=>({data:{data:[]}})}},
 axios:{get:async url=>{if(fail)throw Error('offline');return {data:{data:url.includes('thoughts')?thoughtRows:articleRows,publicationDate:publication.publicationDay()}}}},
};
(async()=>{
 const thoughts=load('store/thought-store.ts',mocks).usePowerThoughtStore;
 await thoughts.getState().fetchPowerThoughts(); assert.equal(thoughts.getState().powerThoughts.length,0);
 thoughtRows=[{_id:'thought',thought:'Newly published',date:publication.publicationDay()}];
 await thoughts.getState().fetchPowerThoughts(); assert.equal(thoughts.getState().powerThoughts.length,1);assert(thoughts.getState().powerThoughts[0].isToday);
 const articles=load('store/article-store.ts',mocks).useArticleStore;
 articleRows=[{_id:'mind',category:'Mind',title:'Mind article'},{_id:'balance',category:'Balance',title:'Balance article'}];
 assert.equal((await articles.getState().fetchArticleById({id:'mind'}))._id,'mind','Cold deep link loads the catalogue');
 await articles.getState().fetchArticles('category=Mental');assert.equal(articles.getState().articles.Mental[0]._id,'mind');
 articles.getState().markArticleAsRead('Mental','mind');
 await articles.getState().fetchArticles('category=all');assert(articles.getState().articles['All Articles'].find(a=>a._id==='mind').isRead);
 await articles.getState().fetchArticles('category=Spiritual');assert.equal(articles.getState().articles.Spiritual[0]._id,'balance');
 fail=true;await articles.getState().fetchArticles('category=all');assert(articles.getState().error);assert.equal(articles.getState().articles['All Articles'].length,2);
 fail=false;articleRows=[];await articles.getState().fetchArticles('category=all');assert.equal(articles.getState().articles['All Articles'].length,0,'Unpublished content removed on refresh');
 // Render after asynchronous arrival: no mount-time animation array may hide cards.
 const React=require('react'),RN=require('react-native-web');const {renderToStaticMarkup}=require('react-dom/server');
 const screen=load('app/mental/thoughts/index.tsx',{
  '@/hooks/useContentRefresh':{useContentRefresh:()=>{}},'@/components/BodyPageHeading':()=>null,
  '@/store/thought-store':{usePowerThoughtStore:()=>thoughts.getState()},'react-native':RN,
  '@expo/vector-icons':{Ionicons:()=>null},'expo-linear-gradient':{LinearGradient:({children})=>React.createElement('div',null,children)},
  'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:0})},'expo-router':{router:{}},'expo-status-bar':{StatusBar:()=>null}
 }).default;
 assert(renderToStaticMarkup(React.createElement(screen)).includes('Newly published'));
 // Screen lifecycle refreshes immediately, on foreground and periodically; blur cleans up.
 let focus, changed, tick, removed=false, cleared=false, refreshes=0;
 const appState={currentState:'active',addEventListener:(_event,fn)=>{changed=fn;return {remove:()=>removed=true}}};
 const hook=load('hooks/useContentRefresh.ts',{'react':{useCallback:fn=>fn},'expo-router':{useFocusEffect:fn=>focus=fn},'react-native':{AppState:appState}},{setInterval:fn=>{tick=fn;return 1},clearInterval:()=>cleared=true});
 hook.useContentRefresh(async()=>{refreshes++});const cleanup=focus();await new Promise(setImmediate);assert.equal(refreshes,1);
 appState.currentState='background';await tick();assert.equal(refreshes,1);
 appState.currentState='active';changed('active');await new Promise(setImmediate);assert.equal(refreshes,2);
 await tick();assert.equal(refreshes,3);cleanup();assert(removed&&cleared);
 console.log('Content sync: timezone boundary, pillar mapping, async thought rendering, read state, errors and unpublishing passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
