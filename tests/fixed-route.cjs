const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),RN=require('react-native-web');
let pathname='/body/workout/library',origin,canBack=false;const calls=[];
const Insets=React.createContext({top:44,bottom:34,left:0,right:0});
const router={canGoBack:()=>canBack,back:()=>calls.push('back'),dismissTo:r=>calls.push(r)};
const cache=new Map();
const mocks={react:{...React,useEffect:()=>{},useState:value=>[value,()=>{}]},'react/jsx-runtime':require('react/jsx-runtime'),
 'react-native':RN,'expo-router':{router,usePathname:()=>pathname,useGlobalSearchParams:()=>({pillar:origin}),useLocalSearchParams:()=>({pillar:origin})},
 'react-native-safe-area-context':{SafeAreaView:({children})=>React.createElement('header',null,children),SafeAreaInsetsContext:Insets,useSafeAreaInsets:()=>({top:44,bottom:34,left:0,right:0})},
 '@/components/ui/BrandIcon':({name})=>React.createElement('span',{'data-icon':name}),
};
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);const m={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;vm.runInNewContext(code,{module:m,exports:m.exports,require:id=>id in mocks?mocks[id]:load((id.startsWith('@/')?id.slice(2):path.resolve(path.dirname(file),id))+(id.endsWith('AppFrame')||id.endsWith('BodyPageHeading')?'.tsx':'.ts'))});cache.set(file,m.exports);return m.exports;}
const {routeTrail}=load('lib/route-trail.ts');
for(const [p,expected,pillar] of [['/body/workout/library','Body / Gym / Exercise library','body'],['/body/walks','Body / Walks','body'],['/spiritual/mediation/123','Balance / Meditation / Details','balance'],['/mind/journal','Mind / Journal','mind'],['/chat','Guide',undefined],['/(tabs)/tracking','Progress',undefined]]){const result=routeTrail(p);assert.equal(result.label,expected);assert.equal(result.pillar,pillar)}
assert.equal(routeTrail('/mental/myspace/edit-entry/private-id','purpose').pillar,'purpose');
assert.equal(routeTrail('/login').visible,false);assert.equal(routeTrail('/').visible,false);
const Frame=load('components/AppFrame.tsx').default,Heading=load('components/BodyPageHeading.tsx').default;
const html=renderToStaticMarkup(React.createElement(Frame,{enabled:true},React.createElement(Heading,{title:'Exercise library',trail:'OLD DUPLICATE ROUTE'})));
assert(html.includes('Body / Gym / Exercise library'));assert(!html.includes('OLD DUPLICATE ROUTE'));
assert.equal((html.match(/aria-label="Go to Home"/g)||[]).length,1);
assert(html.includes('Return to Body'));assert(html.includes('data-icon="barbell-outline"'));
function descendants(node){if(!node||typeof node!=='object')return [];return [node,...React.Children.toArray(node.props?.children).flatMap(descendants)]}
let tree=Frame({enabled:true,children:React.createElement('main',null,'content')});let buttons=descendants(tree).filter(n=>n.props?.accessibilityRole==='button');
buttons.find(n=>n.props.accessibilityLabel==='Go back').props.onPress();assert.equal(calls.pop(),'/body');
canBack=true;buttons.find(n=>n.props.accessibilityLabel==='Go back').props.onPress();assert.equal(calls.pop(),'back');
buttons.find(n=>n.props.accessibilityLabel==='Go to Home').props.onPress();assert.equal(calls.pop(),'/(tabs)/home');
buttons.find(n=>n.props.accessibilityLabel==='Return to Body').props.onPress();assert.equal(calls.pop(),'/body');
pathname='/community';assert(renderToStaticMarkup(React.createElement(Frame,{enabled:true},'content')).includes('Choose a pillar'));
assert(!renderToStaticMarkup(React.createElement(Frame,{enabled:false},'content')).includes('<header>'));
console.log('PASS fixed route: accurate paths, hidden record IDs, Purpose context, one header, auth exclusion, back fallback and Home/pillar destinations');
