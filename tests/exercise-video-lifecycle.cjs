const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),React=require('react');
const source=ts.transpileModule(fs.readFileSync('components/workout/ExerciseVideo.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const flush=()=>new Promise(setImmediate);
function mount(){
 let index=0,focused=true,change,initialized=false,tree;const states=[],dependencies=[],cleanup=[],pending=[],calls=[],listeners={};
 const react={...React,useState:init=>{const i=index++;if(!(i in states))states[i]=typeof init==='function'?init():init;return[states[i],value=>states[i]=typeof value==='function'?value(states[i]):value]},useRef:init=>{const i=index++;return states[i]||(states[i]={current:init})},useCallback:(fn)=>fn,useEffect:(fn,deps)=>{const i=index++;if(!dependencies[i]||deps.some((d,k)=>d!==dependencies[i][k])){dependencies[i]=deps;pending.push(()=>{cleanup[i]?.();cleanup[i]=fn()})}}};
 const player={play:()=>calls.push('play'),pause:()=>calls.push('pause'),replaceAsync:async s=>{calls.push(s?'load':'unload')},addListener:(event,fn)=>{listeners[event]=fn;return{remove:()=>delete listeners[event]}}};
 const mocks={react,'react-native':{ActivityIndicator:'spinner',AppState:{currentState:'active',addEventListener:(_,fn)=>{change=fn;return{remove:()=>{}}}},StyleSheet:{create:s=>s},Text:'text',TouchableOpacity:'button',View:'view'},'@react-navigation/native':{useIsFocused:()=>focused},'@expo/vector-icons':{Ionicons:'icon'},'expo-video':{useVideoPlayer:(_,setup)=>{if(!initialized){setup(player);initialized=true}return player},VideoView:'video'},'@/lib/exercise-video':{cachedExerciseVideo:()=> 'https://example.test/demo.mp4',resolveExerciseVideo:async()=> 'https://example.test/demo.mp4'}};
 const module={exports:{}};vm.runInNewContext(source,{module,exports:module.exports,require:id=>mocks[id]||require(id),console});
 function render(props={}){index=0;tree=module.exports.default({exerciseId:'demo',...props});pending.splice(0).forEach(fn=>fn());return tree}
 function find(node,label){if(!node||typeof node!=='object')return;if(node.props?.accessibilityLabel===label)return node;for(const child of [node.props?.children].flat(Infinity)){const result=find(child,label);if(result)return result}}
 return{render,calls,player,setFocus:v=>focused=v,appState:v=>change(v),ready:()=>listeners.statusChange({status:'readyToPlay'}),press:label=>{const node=find(tree,label);assert(node,label);node.props.onPress()},unmount:()=>cleanup.forEach(fn=>fn?.())};
}
(async()=>{
 const m=mount();m.render();await flush();m.render();assert(m.calls.includes('play'),'Opens playing without a Play tap');assert.equal(m.player.muted,true);assert.equal(m.player.loop,true);
 m.calls.length=0;m.setFocus(false);m.render();m.ready();assert(!m.calls.includes('play'));assert(m.calls.includes('pause'));
 m.setFocus(true);m.render();m.calls.length=0;m.appState('background');m.render();m.ready();assert(!m.calls.includes('play'));assert(m.calls.includes('pause'));
 m.appState('active');m.render();m.press('Pause demonstration');m.render();m.calls.length=0;m.ready();assert(!m.calls.includes('play'),'Buffer events respect user pause');m.unmount();
 const next=mount();next.render({active:false});await flush();next.render({active:false});next.ready();assert(next.calls.includes('load'));assert(!next.calls.includes('play'),'Preloading the next exercise is silent and paused');next.calls.length=0;next.render({active:true});assert(next.calls.includes('play'),'Next exercise plays on becoming active');next.render({active:false,loadEnabled:false});next.render({active:false,loadEnabled:false});await flush();assert(next.calls.includes('unload'));next.unmount();
 console.log('PASS: autoplay, muted looping, focus/background pause, user pause, next-exercise preloading and distant-source release');
})().catch(error=>{console.error(error);process.exitCode=1});
