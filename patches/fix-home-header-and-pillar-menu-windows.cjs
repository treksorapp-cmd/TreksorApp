'use strict';
// Correct only Home's duplicate safe area and AppFrame's pillar dropdown.
// Compatible with the previous Treksor premium script. No git checkout/merge.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd();
const abort=msg=>{throw Error(msg+' No se modifico ningun archivo.')};
const top=cp.execFileSync('git',['rev-parse','--show-toplevel'],{cwd:root,encoding:'utf8'}).trim();
if(path.resolve(top)!==path.resolve(root))abort('Ejecutar dentro de TreksorApp.');
if(cp.spawnSync('git',['rev-parse','-q','--verify','MERGE_HEAD'],{cwd:root,stdio:'ignore'}).status===0)abort('Hay un merge incompleto.');
const frameFile='components/AppFrame.tsx',homeFile='app/(tabs)/home/index.tsx';
const contextFile='lib/navigation-frame-context.ts';
if(!fs.existsSync(contextFile))abort('Falta el contexto de navegacion fijo; no es seguro cambiar Home.');
const originals=new Map(),updated=new Map();
for(const file of [frameFile,homeFile]){
  if(!fs.existsSync(file))abort('No existe '+file+'.');
  originals.set(file,fs.readFileSync(file));
}
function transform(file,fn){
  const original=originals.get(file).toString('utf8');
  const eol=original.includes('\r\n')?'\r\n':'\n';
  const next=fn(original.replace(/\r\n/g,'\n')).replace(/\n/g,eol);
  if(next!==original)updated.set(file,next);
}
transform(frameFile,s=>{
  // Idempotent on the new version; reject unknown layouts instead of replacing the whole file.
  if(s.includes('style={[s.pickerOverlay,{top:headerHeight}]}')){
    if(!s.includes("chrome:{backgroundColor:colors.background,borderBottomWidth:1,borderBottomColor:colors.border,zIndex:40,elevation:40}"))
      abort('La capa del menu no coincide con la correccion.');
    return s;
  }
  const pickerLine='        {picker&&<View style={s.picker}>';
  const pickerStart=s.indexOf(pickerLine);
  const headerEnd='      </SafeAreaView>}';
  const pickerEnd=pickerStart<0?-1:s.indexOf(headerEnd,pickerStart);
  if(pickerStart<0 || pickerEnd<0)abort('El menu de pilares tiene una estructura diferente.');
  const pickerMarkup=s.slice(pickerStart,pickerEnd).trim();
  if(!pickerMarkup.startsWith('{picker&&<View style={s.picker}>')||!pickerMarkup.endsWith('</View>}'))
    abort('No se puede separar el menu de pilares con seguridad.');
  const menuContent=pickerMarkup.slice('{picker&&<View style={s.picker}>'.length,-'</View>}'.length);
  const chromeRe=/chrome:\{backgroundColor:colors\.background,borderBottomWidth:1,borderBottomColor:colors\.border(?:,zIndex:\d+,elevation:\d+)?\}/;
  if(!chromeRe.test(s))abort('La barra fija no coincide con la version compatible.');
  const pickerStyleRe=/picker:\{[^\n]+\}/;
  const styleHit=s.match(pickerStyleRe);
  if(!styleHit || !(styleHit[0].includes("position:'absolute',top:'100%'")||styleHit[0].includes("picker:{flexDirection:'row'")))
    abort('El estilo del menu no coincide con la version compatible.');
  const stateAnchor='  const [picker,setPicker]=useState(false);';
  const safeAnchor="{visible&&<SafeAreaView edges={['top','left','right']} style={s.chrome}>";
  if(!s.includes(stateAnchor)||!s.includes(safeAnchor))abort('Falta medir la barra fija.');
  s=s.replace(stateAnchor,
    stateAnchor+'\n  const [headerHeight,setHeaderHeight]=useState(0);');
  s=s.replace(safeAnchor,
    "{visible&&<SafeAreaView edges={['top','left','right']} style={s.chrome} onLayout={event=>{\n"+
    "        const height=event.nativeEvent.layout.height;\n"+
    "        setHeaderHeight(previous=>previous===height?previous:height);\n"+
    "      }}>");
  // Remove the menu from the SafeAreaView. The overlay is a sibling, never a child of chrome.
  s=s.replace(s.slice(pickerStart,pickerEnd)+headerEnd,
    headerEnd+"\n"+
    '      {visible && picker && headerHeight > 0 && <View pointerEvents="box-none" style={[s.pickerOverlay,{top:headerHeight}]}>\n'+
    '        <View style={s.picker}>'+menuContent+'</View>\n'+
    '      </View>}');
  s=s.replace(chromeRe,
    'chrome:{backgroundColor:colors.background,borderBottomWidth:1,borderBottomColor:colors.border,zIndex:40,elevation:40}');
  s=s.replace(pickerStyleRe,
    "pickerOverlay:{position:'absolute',left:0,right:0,zIndex:30,elevation:30,paddingHorizontal:12},\n"+
    "  picker:{flexDirection:'row',padding:10,gap:8,backgroundColor:colors.background,borderWidth:1,borderColor:colors.border,borderRadius:14}");
  return s;
});
transform(homeFile,s=>{
  const oldSafe='<SafeAreaView style={styles.screen} edges={["top"]}>';
  const newSafe='<SafeAreaView style={styles.screen} edges={hasFixedHeader ? [] : ["top"]}>';
  if(s.includes(newSafe))return s;
  if(!s.includes(oldSafe) || !s.includes('export default function HomeScreen() {'))
    abort('La pantalla Home tiene una estructura diferente.');
  const importAnchor='import { SafeAreaView } from "react-native-safe-area-context";';
  if(!s.includes(importAnchor))abort('La importacion de SafeAreaView cambio.');
  if(!s.includes('import { useFixedRouteHeader } from "@/lib/navigation-frame-context";'))
    s=s.replace(importAnchor,importAnchor+'\nimport { useFixedRouteHeader } from "@/lib/navigation-frame-context";');
  const screenAnchor='export default function HomeScreen() {';
  s=s.replace(screenAnchor,screenAnchor+
    '\n  // AppFrame already owns the iOS safe area above the fixed route header.'+
    '\n  const hasFixedHeader=useFixedRouteHeader();');
  return s.replace(oldSafe,newSafe);
});
const ts=require(require.resolve('typescript',{paths:[root]}));
for(const [file,next] of updated){
  const prev=ts.createSourceFile(file,originals.get(file).toString('utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const revised=ts.createSourceFile(file,next,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  if(revised.parseDiagnostics.length>prev.parseDiagnostics.length)
    abort('Nueva falla de sintaxis en '+file+': '+revised.parseDiagnostics[0]?.messageText);
}
console.log('CORRECCION TREKSOR: '+updated.size+' archivos para ajustar.');
for(const file of updated.keys())console.log('  '+file);
if(process.argv.includes('--check')){console.log('COMPATIBLE: inspeccion completada sin escribir archivos.');process.exit(0);}
if(!updated.size){console.log('AJUSTES YA APLICADOS. No hay nada que cambiar.');process.exit(0);}
const backup=fs.mkdtempSync(path.join(path.dirname(root),'Treksor-nav-backup-'));
for(const file of updated){
  const dest=path.join(backup,file[0]);
  fs.mkdirSync(path.dirname(dest),{recursive:true});
  fs.writeFileSync(dest,originals.get(file[0]));
}
const written=[];
try{
  for(const [file,next] of updated){
    if(!fs.readFileSync(file).equals(originals.get(file)))throw Error('El archivo cambio durante la aplicacion: '+file);
    fs.writeFileSync(file,next);written.push(file);
  }
}catch(error){for(const file of written)fs.writeFileSync(file,originals.get(file));throw error;}
console.log('CORRECCION APLICADA: barra visible, selector debajo y Home sin margen duplicado.');
console.log('Respaldo: '+backup);
console.log('Sin modificar colores, videos, ejercicios, caminatas, dependencias ni ramas Git.');
