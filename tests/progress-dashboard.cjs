const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),RN=require('react-native-web');
const {renderToStaticMarkup}=require('react-dom/server');
process.env.TZ='Australia/Brisbane';
const noop=()=>{};
let width=390,fontScale=1;
const glyphs=require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
const wrap=({children,...props})=>React.createElement(RN.View,props,children);
const mocks={
 'react-native':{...RN,Modal:({visible,children})=>visible?React.createElement(RN.View,null,children):null,useWindowDimensions:()=>({width,height:844,scale:1,fontScale}),Alert:{alert:noop}},
 '@expo/vector-icons':{Ionicons:({name,size,color})=>React.createElement('span',{'aria-hidden':true,style:{fontFamily:'Ionicons',fontSize:size,color}},String.fromCodePoint(glyphs[name]||glyphs['ellipse-outline']))},
 'expo-linear-gradient':{LinearGradient:({colors,start,end,...props})=>React.createElement(RN.View,{...props,style:[props.style,{backgroundImage:`linear-gradient(135deg,${colors.join(',')})`}]})},
 'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:44,bottom:34,left:0,right:0})},
 'expo-router':{usePathname:()=>'/tracking',useLocalSearchParams:()=>({}),router:{push:noop,dismissTo:noop}},
};
function loader(overrides={}){
 const cache=new Map();
 function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const module={exports:{}};
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2020,esModuleInterop:true}}).outputText;
 const req=name=>{if(name in overrides)return overrides[name];if(name in mocks)return mocks[name];if(name.startsWith('@/')){const base=name.slice(2);for(const ext of ['.ts','.tsx',''])if(fs.existsSync(base+ext))return load(base+ext);}return require(name)};
 vm.runInNewContext(code,{module,exports:module.exports,require:req,console,Date,Set,Map,Promise,setTimeout,clearTimeout},{filename:file});cache.set(file,module.exports);return module.exports;}
 return load;
}
const load=loader();
const metrics=load('lib/progress-metrics.ts');
const {dayKey,dayDate,recordedDay,recentDays,trackerCompletion,makeTrackerRecords,applyTrackerDay,buildProgressOverview}=metrics;
const now=new Date(2026,9,26,12);
assert.equal(dayKey(new Date('2026-10-25T14:30:00Z')),'2026-10-26');
assert.equal(recordedDay('October 26, 2026'),'2026-10-26');
assert.equal(recordedDay('2026-10-25T14:30:00Z'),'2026-10-26');
assert.equal(recordedDay('February 30, 2026'),null);
assert.equal(dayDate('2026-02-30'),null);
assert.equal(recentDays(7,now)[0],'2026-10-20');
assert.equal(Object.keys(makeTrackerRecords(2,new Date(2026,9,26,0,1))).join(','),'2026-10-26,2026-10-27');
for(const invalid of [0,-1,1.5,366,NaN])assert.throws(()=>makeTrackerRecords(invalid,now));
const item={id:'walk',label:'Walk outside',value:'3',record:{'2026-10-25':true,'2026-10-26':true,'2026-10-27':false}};
const corrected=applyTrackerDay([item],'2026-10-26',{walk:false},'2026-10-26');
assert.equal(corrected[0].record['2026-10-26'],false);assert.equal(item.record['2026-10-26'],true);
assert.equal(corrected[0].record['2026-10-25'],true);
assert.equal(applyTrackerDay([item],'2026-10-24',{walk:true},'2026-10-26')[0].record['2026-10-24'],undefined);
assert.equal(applyTrackerDay([item],'2026-10-27',{walk:true},'2026-10-26')[0].record['2026-10-27'],false);
assert.equal(trackerCompletion([item],'2026-10-26').percentage,100);
assert.equal(trackerCompletion(corrected,'2026-10-26').percentage,50);
assert.equal(trackerCompletion([],'2026-10-26').percentage,null);
const tracker={id:'habit',title:'Morning routine',custom:true,percentage:99,items:[{...item,record:{'2026-10-22':true,'2026-10-23':false,'2026-10-26':false,'2026-10-27':true}}]};
const input={checkIns:{a:['2026-10-26T01:00:00Z','2026-10-18T01:00:00Z'],b:['2026-10-26T01:00:00Z','2026-10-27T01:00:00Z']},gymSets:[{id:'set',exerciseName:'Cable row',kg:30,reps:10,recordedAt:'2026-10-26T01:00:00Z'}],reflections:[{id:'reflection',date:'October 25, 2026',text:'SECRET REFLECTION'},{id:'reflection',date:'October 25, 2026'},{id:'bad',date:'unknown'}],journalDates:['2026-10-24','2026-10-23','2026-10-24'],trackers:[tracker],meditations:[{id:'a',isRead:true},{id:'a',isRead:false},{id:'b',isRead:false}],articles:{Body:[{_id:'a',isRead:true}],All:[{_id:'a',isRead:false},{_id:'b'}]},visionAnswers:['SECRET VISION','',null,'   ']};
const seven=buildProgressOverview(input,7,now),month=buildProgressOverview(input,30,now);
assert.equal(seven.activeDays,5);assert.equal(seven.sessions,1);assert.equal(seven.sets,1);assert.equal(seven.reflections,1);assert.equal(seven.journalEntries,2);assert.equal(seven.habits,1);assert.equal(month.sessions,2);
assert.equal(seven.meditation.completed,1);assert.equal(seven.meditation.total,2);assert.equal(seven.reading.completed,1);assert.equal(seven.reading.total,2);assert.equal(seven.vision.completed,1);
assert(!JSON.stringify(seven).includes('SECRET'));
assert.equal(buildProgressOverview({...input,trackers:[{...tracker,title:'Body',percentage:0}]},7,now).sessions,1,'Custom labels never alter a pillar score');
assert.equal(buildProgressOverview({...input,visionAnswers:null},7,now).vision,null,'Unavailable is not zero');
const emptyInput={checkIns:{},gymSets:[],reflections:[],journalDates:[],trackers:[],meditations:[{id:'a'},{id:'b'},{id:'c'}],articles:{},visionAnswers:[]};
const empty=buildProgressOverview(emptyInput,7,now);assert.equal(empty.activeDays,0);assert.equal(empty.events.length,0);

const Dashboard=load('components/progress/ProgressDashboard.tsx').default;
const props={data:seven,period:7,onPeriod:noop,trackers:[tracker],today:'2026-10-26',journalLoading:false,visionLoading:false,journalError:false,visionError:false,onRetry:noop,onRoute:noop,onLog:noop,onCreate:noop,onCalendar:noop};
const html=renderToStaticMarkup(React.createElement(Dashboard,props));
for(const label of ['Your rhythm','What counts?','Four pillars. Real progress.','My plan','Personal trackers','Your activity trail','Data sources'])assert(html.toLowerCase().includes(label.toLowerCase()),label);
assert(html.includes('All time'));assert(html.includes('Last 7 days'));assert(!html.includes('99%'));
const emptyHTML=renderToStaticMarkup(React.createElement(Dashboard,{...props,data:empty,trackers:[]}));assert(emptyHTML.includes('Create your first tracker'));assert(emptyHTML.includes('No dated actions yet'));

// Drive the real log component's handlers with controlled hook state.
function harness(file,overrides={}){
 let state=[],index=0,effects=[],deps=[];
 const same=(a,b)=>a&&b&&a.length===b.length&&a.every((v,i)=>Object.is(v,b[i]));
 const hooks={...React,useState:init=>{const at=index++;if(!(at in state))state[at]=typeof init==='function'?init():init;return [state[at],value=>{state[at]=typeof value==='function'?value(state[at]):value}]},useEffect:(effect,d)=>{const at=index++;if(!same(deps[at],d)){effects.push(effect);deps[at]=d}}};
 const Component=loader({...overrides,react:hooks})(file).default;
 return args=>{index=0;let tree=Component(args);if(effects.length){const run=effects;effects=[];run.forEach(e=>e());index=0;tree=Component(args);}return tree;};
}
function nodes(node,predicate,out=[]){if(!node||typeof node!=='object')return out;if(predicate(node))out.push(node);React.Children.forEach(node.props?.children,child=>nodes(child,predicate,out));return out;}
let categories=[{...tracker,items:[item]},{id:'other',custom:true,title:'Other',items:[{...item,id:'second'}]}],closed=0;
const store={getState:()=>({trackingData:categories,updateTrackingCategory:(id,patch)=>{categories=categories.map(t=>t.id===id?{...t,...patch}:t)},deleteTrackingCategory:noop})};
const log=harness('components/ActivityLogModal.tsx',{'@/store/tracking-store':{useTrackingStore:store},'@/lib/progress-metrics':{...metrics,dayKey:()=> '2026-10-26'}});
const logProps={visible:true,onClose:()=>closed++,selectedDate:'2026-10-26',selectedCategory:'habit'};
let logTree=log(logProps);let checks=nodes(logTree,n=>n.props?.accessibilityRole==='checkbox');assert.equal(checks.length,1,'Selected tracker filters the log');checks[0].props.onPress();logTree=log(logProps);
const save=nodes(logTree,n=>n.props?.onPress&&nodes(n,c=>c.props?.children==='Save changes').length)[0];save.props.onPress();assert.equal(categories[0].items[0].record['2026-10-26'],false);assert.equal(categories[1].items[0].record['2026-10-26'],true);assert.equal(closed,1);
log({...logProps,visible:false});logTree=log(logProps);assert.equal(nodes(logTree,n=>n.props?.accessibilityRole==='checkbox')[0].props.accessibilityState.checked,false,'Reopen reflects saved state');
// Explanations and period controls call the real dashboard handlers.
let chosenPeriod=7;
const dashboard=harness('components/progress/ProgressDashboard.tsx');
let dashboardTree=dashboard({...props,onPeriod:value=>chosenPeriod=value});
const monthTab=nodes(dashboardTree,n=>n.props?.accessibilityRole==='tab')[1];monthTab.props.onPress();assert.equal(chosenPeriod,30);
const bodyCard=nodes(dashboardTree,n=>n.props?.accessibilityLabel?.startsWith('Body:'))[0];bodyCard.props.onPress();dashboardTree=dashboard(props);
assert(nodes(dashboardTree,n=>typeof n.props?.children==='string'&&n.props.children.includes('Finish workout')).length);
let navigated='';dashboardTree=dashboard({...props,onRoute:route=>navigated=route});
const sourceAction=nodes(dashboardTree,n=>n.props?.onPress&&nodes(n,c=>c.props?.children==='Open my plan').length)[0];sourceAction.props.onPress();assert.equal(navigated,'/body/workout/my-plan');

// Refreshing built-in summaries must never overwrite a personal tracker named Body.
const emptyStore=state=>({getState:()=>state});
const trackingLoader=loader({
 '@/lib/utils':{calcPercentage:(n,d)=>d?Math.round(n/d*100):0,errorHandler:e=>{throw e},generateRandomId:()=>Math.random().toString(36).slice(2)},
 'zustand/middleware':{persist:initializer=>initializer,createJSONStorage:noop},
 '@react-native-async-storage/async-storage':{},
 './article-store':{useArticleStore:emptyStore({articles:{}})},
 './mediation-store':{useMediationStore:emptyStore({mediation:[]})},
 './myspace-store':{useMySpaceStore:emptyStore({myspaces:[]})},
 './thought-store':{usePowerThoughtStore:emptyStore({powerThoughts:[]})},
 './workout-store':{useWorkoutStore:emptyStore({workouts:[]})},
});
const trackingStore=trackingLoader('store/tracking-store.ts').useTrackingStore;
const bodyTracker={...tracker,title:'Body'};
trackingStore.setState({trackingData:[bodyTracker]});
void trackingStore.getState().fetchTrackingData().then(()=>{
 const retained=trackingStore.getState().trackingData.find(t=>t.id===bodyTracker.id);
 assert.equal(retained.custom,true);assert.equal(retained.items[0].label,'Walk outside');
 assert.equal(retained.items[0].record['2026-10-22'],true);
 assert(trackingStore.getState().trackingData.some(t=>t.title==='BODY'&&!t.custom));
 console.log('PASS: custom tracker survives built-in summary refresh');
}).catch(error=>{console.error(error);process.exitCode=1});
console.log('PASS: local dates, real period filtering, source deduplication, private-text exclusion, no fabricated scores, scheduled tracker corrections, selected-tracker isolation and empty states');

if(process.env.TREKSOR_QA_DIR){
 const dir=process.env.TREKSOR_QA_DIR;fs.mkdirSync(dir,{recursive:true});
 fs.copyFileSync('node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf',path.join(dir,'Ionicons.ttf'));
 const Heading=load('components/BodyPageHeading.tsx').default;
 const snapshots=[['populated',props],['empty',{...props,data:empty,trackers:[]}],['month',{...props,data:month,period:30}],['unavailable',{...props,journalError:true,visionError:true,data:{...seven,vision:null}}]];
 for(const size of [320,390,430])for(const [name,p] of snapshots){width=size;const markup=renderToStaticMarkup(React.createElement(RN.View,{style:{padding:20,backgroundColor:'#02050C'}},React.createElement(Heading,{trail:'YOUR JOURNEY',title:'Progress',subtitle:'See the steps. Understand the progress.',style:{paddingHorizontal:0}}),React.createElement(Dashboard,p)));const css=RN.StyleSheet.getSheet().textContent;fs.writeFileSync(path.join(dir,`${name}-${size}.html`),`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>@font-face{font-family:Ionicons;src:url('./Ionicons.ttf')}html,body{margin:0;background:#02050C}*{box-sizing:border-box}${css}</style></head><body>${markup}</body></html>`);}
}
