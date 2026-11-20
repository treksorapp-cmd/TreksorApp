'use strict';
// Treksor Home V1.2: integrate the brand row, profile avatar and greeting into
// one darker hero. No branch switches; preserve unrelated local changes.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd(),home='app/(tabs)/home/index.tsx',frame='components/AppFrame.tsx';
const abort=why=>{throw Error(why+' No se modifico ningun archivo.');};
const git=cp.spawnSync('git',['rev-parse','--show-toplevel'],{cwd:root,encoding:'utf8'});
if(git.status!==0||path.resolve(git.stdout.trim())!==path.resolve(root))abort('Ejecuta dentro de TreksorApp.');
if(cp.spawnSync('git',['rev-parse','-q','--verify','MERGE_HEAD'],{cwd:root,stdio:'ignore'}).status===0)abort('Hay un merge Git pendiente.');
const original=new Map(),prepared=new Map();
for(const file of [home,frame]){
 if(!fs.existsSync(file))abort('Falta '+file);
 original.set(file,fs.readFileSync(file));
}
function change(file,fn){
 const before=original.get(file).toString('utf8'),crlf=before.includes('\r\n');
 const updated=fn(before.replace(/\r\n/g,'\n')).replace(/\n/g,crlf?'\r\n':'\n');
 if(updated!==before)prepared.set(file,updated);
}
function exactly(s,from,to,file){
 const n=s.split(from).length-1;
 if(n!==1)abort(file+': el componente es distinto del esperado ('+from.slice(0,60)+').');
 return s.replace(from,to);
}
function style(s,key,expected,newValue){
 const pattern=new RegExp('^  '+key+':\\s*\\{[^\\n]*\\},$','m');
 const hit=s.match(pattern);
 if(!hit||!expected.test(hit[0]))abort('Home: estilo '+key+' incompatible; conservar version local.');
 return s.replace(hit[0],hit[0].slice(0,hit[0].indexOf('{'))+newValue+',');
}
change(home,s=>{
 // Earlier Treksor versions duplicated the safe area even with AppFrame.
 if(s.includes('<SafeAreaView style={styles.screen} edges={["top"]}>')){
   s=exactly(s,'import { SafeAreaView } from "react-native-safe-area-context";',
     'import { SafeAreaView } from "react-native-safe-area-context";\nimport { useFixedRouteHeader } from "@/lib/navigation-frame-context";',home);
   s=exactly(s,'export default function HomeScreen() {',
     'export default function HomeScreen() {\n  const hasFixedHeader=useFixedRouteHeader();',home);
   s=exactly(s,'<SafeAreaView style={styles.screen} edges={["top"]}>',
     '<SafeAreaView style={styles.screen} edges={hasFixedHeader ? [] : ["top"]}>',home);
 }
 const brandAnchor='        <View style={styles.top}>';
 const heroAnchor='        <Animated.View style={[styles.hero,';
 const first=s.indexOf(brandAnchor),firstHero=s.indexOf(heroAnchor);
 if(first<0||firstHero<0)abort('No se encontro la cabecera de Home.');
 if(first>firstHero){
   // Both already part of the same image block. Confirm the matching new styles.
   if(!s.includes('minHeight: 328')||!s.includes('marginBottom:17')||!s.includes('navyOverlay(0.96)'))
      abort('Home tiene otra variante de la cabecera. No se sobrescribio.');
   return s;
 }
 const brand=s.slice(first,firstHero).trimEnd();
 if(!brand.includes('<Image source={require("@/assets/images/appicon-treksor.png")}')||
    !brand.includes('style={styles.profile}')||!brand.endsWith('</View>'))
   abort('El bloque del logo o avatar ya fue personalizado.');
 s=s.slice(0,first)+s.slice(firstHero);
 const gradient='          <LinearGradient colors={[navyOverlay(0.08), navyOverlay(0.45), colors.background]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />';
 const darker='          <LinearGradient colors={[navyOverlay(0.96), navyOverlay(0.70), navyOverlay(0.50), colors.background]} locations={[0, 0.22, 0.57, 1]} style={StyleSheet.absoluteFill} />';
 s=exactly(s,gradient,darker+'\n'+brand,home);
 const greetingLine=s.split('\n').find(line=>line.includes('<View style={styles.heroGreetingWrap}>'));
 if(!greetingLine||!greetingLine.includes('styles.heroGreeting'))abort('El saludo de Home tiene otro formato.');
 s=exactly(s,greetingLine+'\n','',home);
 s=exactly(s,'          <View style={styles.heroContent}>',
   '          <View style={styles.heroContent}>\n'+greetingLine,home);
 s=style(s,'content',/paddingHorizontal: 20, paddingTop: (?:0|7|12), paddingBottom: 28/,
   '{ paddingHorizontal: 20, paddingTop: 0, paddingBottom: 28 }');
 s=style(s,'hero',/minHeight: 276, marginHorizontal: -20, marginTop: (?:-24|-8|0), marginBottom: 26/,
   '{ minHeight: 328, marginHorizontal: -20, marginTop: 0, marginBottom: 18, overflow: "hidden", backgroundColor: colors.surface }');
 s=style(s,'heroContent',/flex: 1, paddingTop: 88, justifyContent: "flex-end", paddingHorizontal: 24, paddingBottom: 28/,
   '{ flex: 1, paddingTop: 16, justifyContent: "flex-end", paddingHorizontal: 24, paddingBottom: 30 }');
 s=style(s,'top',/flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: (?:0|4|12)/,
   '{ height: 74, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 15, paddingBottom: 15 }');
 s=style(s,'topRight',/flexDirection:"column",alignItems:"flex-end",gap:5/,
   '{alignItems:"center",justifyContent:"center"}');
 s=style(s,'heroGreetingWrap',/position:"absolute",top:14,right:20/,
   '{flexDirection:"row",alignItems:"center",alignSelf:"flex-start",gap:8,marginBottom:17}');
 s=style(s,'profileImage',/width:40,height:40,borderRadius:20/,
   '{width:44,height:44,borderRadius:22}');
 s=style(s,'logo',/width: 38, height: 38, borderRadius: 11/,
   '{ width: 40, height: 40, borderRadius: 11 }');
 s=style(s,'profile',/height: 42, width: 42, borderRadius: 21/,
   '{ height: 44, width: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" }');
 return s;
});
change(frame,s=>{
 // The top bar must not show a second Home button when already in Home.
 const btn=s.split('\n').find(line=>line.includes('accessibilityLabel="Go to Home"'));
 if(!btn)return s; // A different navigation structure stays untouched.
 if(btn.includes('!isHome'))return s;
 if(s.includes('  const isHome='))abort('AppFrame has a custom Home condition.');
 s=exactly(s,'  const visible=enabled&&trail.visible;',
   "  const visible=enabled&&trail.visible;\n  const isHome=pathname==='/home'||pathname==='/(tabs)/home'||pathname==='/';",frame);
 s=exactly(s,btn,'            {!isHome && '+btn.trim()+'}',frame);
 return s;
});
const ts=require(require.resolve('typescript',{paths:[root]}));
for(const [file,next] of prepared){
 const kind=ts.ScriptKind.TSX;
 const before=ts.createSourceFile(file,original.get(file).toString('utf8'),ts.ScriptTarget.Latest,true,kind);
 const after=ts.createSourceFile(file,next,ts.ScriptTarget.Latest,true,kind);
 if(after.parseDiagnostics.length>before.parseDiagnostics.length)abort('Error de sintaxis nuevo en '+file);
}
console.log('TREKSOR HOME INTEGRADO: '+prepared.size+' archivos compatibles para actualizar.');
for(const file of prepared.keys())console.log('  '+file);
if(process.argv.includes('--check'))console.log('COMPATIBLE — no se escribio nada.');
else if(!prepared.size)console.log('HOME INTEGRADO YA APLICADO.');
else{
 const backup=fs.mkdtempSync(path.join(path.dirname(root),'Treksor-home-integrated-backup-'));
 for(const file of prepared.keys()){
   const dest=path.join(backup,file);fs.mkdirSync(path.dirname(dest),{recursive:true});
   fs.writeFileSync(dest,original.get(file));
 }
 const written=[];
 try{
   for(const [file,next] of prepared){
     if(!fs.readFileSync(file).equals(original.get(file)))throw Error('El archivo cambio durante la aplicacion: '+file);
     written.push(file);fs.writeFileSync(file,next);
   }
 }catch(error){
   for(const file of written)fs.writeFileSync(file,original.get(file));
   throw error;
 }
 console.log('HOME INTEGRADO APLICADO — respaldo: '+backup);
 console.log('Logo y avatar equilibrados, saludo alineado, imagen oscurecida y barra Home sin icono duplicado.');
}
