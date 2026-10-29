const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('app/spiritual/mediation/[id].tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function mount({cached=false,status=200,pending=false}={}){
 const effects=[],states=[],calls=[];let resolver;
 const Button=()=>null;
 const sound={getStatusAsync:async()=>({isLoaded:true,isPlaying:true}),pauseAsync:async()=>calls.push('pause'),playAsync:async()=>calls.push('play'),replayAsync:async()=>calls.push('replay'),unloadAsync:async()=>calls.push('unload')};
 const task={downloadAsync:()=>{calls.push('download');return pending?new Promise(r=>resolver=r):Promise.resolve({uri:'partial',status})},pauseAsync:async()=>calls.push('pause-download')};
 const state={mediation:[{id:'beginner',title:'Practice',audioUrl:'https://example.invalid/audio.mp3',content:{description:'Description',experience:[]}}],locked:[],markMediationAsRead:()=>{}};
 const react={useEffect:fn=>effects.push(fn),useRef:value=>({current:value}),useState:value=>{const i=states.length;states.push(value);return[value,v=>states[i]=v]}};
 const mocks={react,'react-native':{Image:'image',ScrollView:'scroll',Text:'text',View:'view',StyleSheet:{create:x=>x}},'expo-router':{useLocalSearchParams:()=>({id:'beginner'})},'react-native-safe-area-context':{useSafeAreaInsets:()=>({top:44,bottom:34})},'expo-av':{Audio:{setAudioModeAsync:async()=>calls.push('mode'),Sound:{createAsync:async()=>{calls.push('create');return{sound}}}}},'expo-file-system':{cacheDirectory:'cache/',getInfoAsync:async()=>({exists:cached}),createDownloadResumable:()=>task,moveAsync:async()=>calls.push('move'),deleteAsync:async()=>calls.push('delete-partial')},'@expo/vector-icons':{Ionicons:'icon'},'@/store/mediation-store':{useMediationStore:fn=>fn(state)},'@/components/BodyPageHeading':{__esModule:true,default:'heading'},'@/components/ui/Button':{__esModule:true,default:Button},'@/theme/architect':{colors:{},surface:{card:{}},type:{}}};
 const exports={};vm.runInNewContext(source,{exports,require:n=>n in mocks?mocks[n]:n.endsWith('.png')?1:require(n),console,Date});
 const tree=exports.default();const cleanup=effects[0]();
 function find(node){if(!node||typeof node!=='object')return;if(node.type===Button&&node.props.onPress)return node;for(const child of [node.props?.children].flat(Infinity)){const found=find(child);if(found)return found;}}
 const play=find(tree);assert(play,'play control should exist');
 return{press:()=>play.props.onPress(),cleanup,states,calls,resolve:()=>resolver({uri:'partial',status})};
}
(async()=>{
 let m=mount({cached:true});m.press();m.press();await flush();assert.equal(m.calls.filter(c=>c==='create').length,1,'double taps must not create duplicate sounds');assert(!m.calls.includes('download'));m.cleanup();await flush();assert(m.calls.includes('unload'));
 m=mount();m.press();await flush();assert(m.calls.indexOf('move')<m.calls.indexOf('create'),'only a completed file can become the playable cache');m.cleanup();
 m=mount({status:404});m.press();await flush();assert(!m.calls.includes('create'));assert(m.calls.includes('delete-partial'));assert(m.states.some(v=>typeof v==='string'&&v.includes('Unable to play')));
 m=mount({pending:true});m.press();await flush();m.cleanup();m.resolve();await flush();assert(!m.calls.includes('create'),'leaving during download must not start audio');assert(m.calls.includes('pause-download'));assert(m.calls.includes('delete-partial'));
 console.log('PASS: cached playback, duplicate-tap protection, atomic download completion, failed-download retry state and cancellation cleanup');
})().catch(error=>{console.error(error);process.exitCode=1});
