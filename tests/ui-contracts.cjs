// Server renders exercise the actual React hierarchy, without pretending to be a native screenshot.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ts=require('typescript');
const React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const RN=require('react-native-web');
let pathname='/body/nutrition/beverage-details',params={};
let meditation={id:'beginner',title:'A calmer beginning',audioUrl:'https://example.invalid/audio',content:{description:'A clear introduction to this practice.',experience:['Notice your breath.']},tip:'Take your time.',isRead:false};
let isLocked=false;
const navigation=[];
const router={dismissTo:v=>navigation.push(v),push:v=>navigation.push(v),replace:v=>navigation.push(v),back:()=>{},canGoBack:()=>true};
const wrap=({children})=>React.createElement(RN.View,null,children);
const media=({children,...props})=>React.createElement('div',{'data-media':'true','aria-label':props.accessibilityLabel},children);
const store={mediation:[meditation],locked:[],markMediationAsRead:()=>{},myspaces:[],deleteMySpace:()=>{}};
const mocks={
 'react-native':{...RN,Alert:{alert:()=>{}},Image:media},
 'expo-router':{router,usePathname:()=>pathname,useLocalSearchParams:()=>params},
 'react-native-safe-area-context':{SafeAreaView:wrap,useSafeAreaInsets:()=>({top:44,bottom:34,left:0,right:0})},
 'expo-image':{Image:media,ImageBackground:media},'expo-linear-gradient':{LinearGradient:wrap},'expo-blur':{BlurView:wrap},
 'expo-status-bar':{StatusBar:()=>null},
 '@expo/vector-icons':{Ionicons:({name})=>React.createElement('span',{'data-icon':name}),Entypo:()=>null},
 'expo-av':{Audio:{}},'expo-file-system':{},
 '@/store/mediation-store':{useMediationStore:selector=>selector({...store,locked:isLocked?['beginner']:[]})},
 '@/store/myspace-store':{useMySpaceStore:()=>store},
};
const cache=new Map();
function load(name){
 const file=path.resolve(name);if(cache.has(file))return cache.get(file);
 const module={exports:{}};cache.set(file,module.exports);
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const req=n=>{
  if(n in mocks)return mocks[n];
  if(/\.(png|jpg|jpeg)$/.test(n))return 1;
  if(n.startsWith('@/')||n.startsWith('.')){
   const base=n.startsWith('@/')?path.resolve(n.slice(2)):path.resolve(path.dirname(file),n);
   for(const suffix of ['','.tsx','.ts','/index.tsx','/index.ts'])if(fs.existsSync(base+suffix)&&fs.statSync(base+suffix).isFile())return load(base+suffix);
   throw new Error(`Unresolved local import: ${n}`);
  }
  return require(n);
 };
 vm.runInNewContext(code,{module,exports:module.exports,require:req,console,setTimeout,clearTimeout,Date,Promise},{filename:file});
 cache.set(file,module.exports);return module.exports;
}
const {resolvePillar,reflectionHome,reflectionOrigin,displayLabel}=load('lib/pillar-navigation.ts');
assert.equal(resolvePillar('/spiritual/mediation/beginner'),'balance');
assert.equal(resolvePillar('/mental/myspace/edit-entry/123','purpose'),'purpose');
assert.equal(resolvePillar('/body/workout','purpose'),'body');
assert.equal(resolvePillar('/purpose/my-space'),'purpose');
assert.equal(resolvePillar('/(tabs)/community'),undefined);
assert.equal(reflectionHome(reflectionOrigin('/purpose/my-space')),'/purpose/my-space');
assert.equal(displayLabel('BUILD MY PLAN'),'Build my plan');
assert.equal(displayLabel('AI SUPPORT'),'AI support');
assert.equal(displayLabel('Omega-3'),'Omega-3');
const Heading=load('components/BodyPageHeading.tsx').default;
for(const [route,pillar] of [['/body/workout','Body'],['/mental/myspace','Mind'],['/spiritual/mediation/beginner','Balance'],['/purpose/vision-board','Purpose']]){
 pathname=route;params={};
 const title='A longer heading that must retain its complete text';
 const html=renderToStaticMarkup(React.createElement(Heading,{trail:'YOUR JOURNEY',title}));
 assert(html.includes(`Return to ${pillar}`));assert(html.includes('Go to Home'));
 assert(html.indexOf(`Return to ${pillar}`)<html.indexOf(title));
 assert.equal(html.split(title).length-1,1);
}
pathname='/mental/myspace';params={pillar:'purpose'};
assert(renderToStaticMarkup(React.createElement(Heading,{title:'Goals & reflections',trail:'PURPOSE'})).includes('Return to Purpose'));
pathname='/body/nutrition/beverage-details';
const nutrition=load('mock/nutrition.ts').Nutritions;
params={id:nutrition.beverages.data[0].id};
let html=renderToStaticMarkup(React.createElement(load('app/body/nutrition/beverage-details.tsx').default));
const beverageName=displayLabel(nutrition.beverages.data[0].name);
assert(html.indexOf(beverageName)<html.indexOf('data-media="true"'),'Drink heading must precede its photo');
pathname='/spiritual/mediation/beginner';params={id:'beginner'};
const Meditation=load('app/spiritual/mediation/[id].tsx').default;
html=renderToStaticMarkup(React.createElement(Meditation));
assert(html.includes('Return to Balance'));
assert(html.indexOf(meditation.title)<html.indexOf(meditation.content.description));
assert(html.indexOf(meditation.content.description)<html.indexOf('data-media="true"'));
assert(html.indexOf('data-media="true"')<html.indexOf('Play meditation'));
isLocked=true;html=renderToStaticMarkup(React.createElement(Meditation));assert(html.includes('Complete the previous level first'));isLocked=false;
pathname='/purpose/my-space';params={};
html=renderToStaticMarkup(React.createElement(load('app/mental/myspace/index.tsx').default));
assert(html.includes('Return to Purpose'));assert(html.includes('Goals &amp; reflections'));assert(html.includes('Start with one thought'));
// Static layout regressions: headings must not return to floating coordinates.
for(const file of ['components/BodyPageHeading.tsx','components/PillarMenuScreen.tsx']){
 const source=fs.readFileSync(file,'utf8');assert(!source.includes('adjustsFontSizeToFit'));assert(!source.includes('numberOfLines='));
}
assert(!fs.readFileSync('app/_layout.tsx','utf8').includes('isPillarDetail'));
assert(!fs.readFileSync('app/(tabs)/tracking/_layout.tsx','utf8').includes('<Header'));
console.log('PASS: pillar navigation, Purpose return context, full heading text, beverage/meditation order, completion state, reflection empty state and duplicate-header regressions');
