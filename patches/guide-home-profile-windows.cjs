'use strict';
// V1.2 Guide + navigation polish; never changes the current Git branch.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd();
const abort=msg=>{throw Error(msg+' No se modifico nada.')};
const gitTop=cp.execFileSync('git',['rev-parse','--show-toplevel'],{cwd:root,encoding:'utf8'}).trim();
if(path.resolve(root)!==path.resolve(gitTop))abort('Abrir en la carpeta TreksorApp.');
if(cp.spawnSync('git',['rev-parse','-q','--verify','MERGE_HEAD'],{cwd:root,stdio:'ignore'}).status===0)abort('Hay un merge Git pendiente.');
const originals=new Map(),nextFiles=new Map(),notes=[];
const files=[
 'design/brand/icons.json','components/ui/BrandIcon.tsx','app/(tabs)/_layout.tsx',
 'app/(tabs)/chat/index.tsx','components/ChatModal.tsx','components/AppFrame.tsx',
 'components/ui/Header.tsx','components/BodyPageHeading.tsx','app/(tabs)/home/index.tsx'
];
for(const f of files){if(!fs.existsSync(f))abort('No existe '+f+'.');originals.set(f,fs.readFileSync(f));}
function replaceOne(s,from,to,file){
 if(s.includes(to))return s;
 if(!s.includes(from))abort('El formato de '+file+' es diferente: '+from.slice(0,55));
 if(s.indexOf(from)!==s.lastIndexOf(from))abort('Ancla duplicada en '+file);
 return s.replace(from,to);
}
function replaceAllExpected(s,from,to,count,file){
 if(s.includes(from)){
   if(s.split(from).length-1!==count)abort('Iconos diferentes en '+file);
   return s.split(from).join(to);
 }
 if(s.split(to).length-1===count)return s;
 abort('No coinciden los iconos de '+file);
}
function stage(file,fn){
 const original=originals.get(file).toString('utf8'),eol=original.includes('\r\n')?'\r\n':'\n';
 const updated=fn(original.replace(/\r\n/g,'\n')).replace(/\n/g,eol);
 if(updated!==original)nextFiles.set(file,updated);
}
stage(files[0],s=>{
 const j=JSON.parse(s);
 if(!Array.isArray(j.guide))abort('No se encontro el icono Guide.');
 j.guide=[
   ['path',{d:'M3 19h18'}],['path',{d:'M5 15a7 7 0 0 1 14 0'}],
   ['path',{d:'M12 3v3'}],['path',{d:'m5.5 7.5 2.1 2.1'}],
   ['path',{d:'m18.5 7.5-2.1 2.1'}],['path',{d:'M2 14h2'}],
   ['path',{d:'M20 14h2'}],
 ];
 const val=JSON.stringify(j,null,2)+'\n';
 return val;
});
stage(files[1],s=>{
 s=replaceOne(s,
   "'sparkles-outline':'guide', sparkles:'guide', 'analytics-outline':'progress',",
   "'guide-outline':'guide', 'sparkles-outline':'guide', sparkles:'guide', 'analytics-outline':'progress',",files[1]);
 s=replaceOne(s,
   "'people-outline':'community', people:'community', 'home-outline':'home', home:'home',",
   "'people-outline':'community', people:'community', 'home-outline':'home', home:'home', 'home-sharp':'home',",files[1]);
 s=replaceOne(s,
   "type Props = Omit<React.ComponentProps<typeof Ionicons>, 'name'> & {name: React.ComponentProps<typeof Ionicons>['name'] | 'brain'};",
   "export const GUIDE_ICON = 'guide-outline' as const;\nexport const HOME_ICON = 'home-outline' as const;\ntype Props = Omit<React.ComponentProps<typeof Ionicons>, 'name'> & {name: React.ComponentProps<typeof Ionicons>['name'] | 'brain' | typeof GUIDE_ICON};",files[1]);
 return s;
});
stage(files[2],s=>{
 s=replaceOne(s,"import Ionicons from '@/components/ui/BrandIcon';",
   "import Ionicons, { GUIDE_ICON, HOME_ICON } from '@/components/ui/BrandIcon';",files[2]);
 s=replaceOne(s,'<Ionicons name="chatbubble-ellipses-outline" size={23} color={color} />',
   '<Ionicons name={GUIDE_ICON} size={23} color={color} />',files[2]);
 s=replaceOne(s,'<Ionicons name="home-outline" size={23} color={color} />',
   '<Ionicons name={HOME_ICON} size={23} color={color} />',files[2]);
 return s;
});
const avatarOld='  aiAvatar: {\n    width: 32,\n    height: 32,\n    borderRadius: 16,\n    backgroundColor: "#D7B877",\n    alignItems: "center",\n    justifyContent: "center",\n  },';
const avatarNew='  aiAvatar: {\n    width: 32,\n    height: 32,\n    borderRadius: 16,\n    backgroundColor: colors.surfaceRaised,\n    borderWidth: 1,\n    borderColor: colors.border,\n    alignItems: "center",\n    justifyContent: "center",\n  },';
for(const [index,n] of [[3,2],[4,3]]){
 stage(files[index],s=>{
  s=replaceOne(s,"import Ionicons from '@/components/ui/BrandIcon';",
    "import Ionicons, { GUIDE_ICON } from '@/components/ui/BrandIcon';",files[index]);
  s=replaceAllExpected(s,
    '<Ionicons name="sparkles-outline" size={24} color={colors.gold} accessibilityLabel="Guide AI" />',
    '<Ionicons name={GUIDE_ICON} size={22} color={colors.gold} accessibilityLabel="Guide" />',
    n,files[index]);
  s=replaceOne(s,avatarOld,avatarNew,files[index]);
  s=replaceOne(s,'>Typing...</Text>','>Reflecting…</Text>',files[index]);
  return s;
 });
}
stage(files[5],s=>{
 s=replaceOne(s,"import BrandIcon from '@/components/ui/BrandIcon';",
   "import BrandIcon, { HOME_ICON } from '@/components/ui/BrandIcon';",files[5]);
 s=replaceOne(s,'  const visible=enabled&&trail.visible;',
   "  const visible=enabled&&trail.visible;\n  // The Home destination is redundant when the current screen is already Home.\n  const isHome=pathname==='/home'||pathname==='/(tabs)/home'||pathname==='/';",files[5]);
 s=replaceOne(s,
   '            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go to Home" style={s.icon} onPress={()=>navigate(trail.home)}><BrandIcon name="home-outline" size={21} color={colors.text}/></TouchableOpacity>',
   '            {!isHome && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go to Home" style={s.icon} onPress={()=>navigate(trail.home)}><BrandIcon name={HOME_ICON} size={21} color={colors.text}/></TouchableOpacity>}',files[5]);
 return s;
});
for(const i of [6,7]){
 stage(files[i],s=>{
  // Some page headers have no Home control at all; leave those untouched.
  if(!s.includes('name="home-outline"') && !s.includes('name={HOME_ICON}'))return s;
  s=replaceOne(s,"import Ionicons from '@/components/ui/BrandIcon';",
   "import Ionicons, { HOME_ICON } from '@/components/ui/BrandIcon';",files[i]);
  s=replaceOne(s,'name="home-outline"','name={HOME_ICON}',files[i]);
  return s;
 });
}
stage(files[8],s=>{
 // The newer integrated Home hero already includes balanced profile spacing.
 // Leave its self-contained composition intact when replaying the older Guide patch.
 if(s.includes('hero: { minHeight: 328') && s.includes('paddingTop: 15, paddingBottom: 15'))return s;
 s=replaceOne(s,
  'content: { paddingHorizontal: 20, paddingTop: 7, paddingBottom: 28 }',
  'content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }',files[8]);
 s=replaceOne(s,
  'hero: { minHeight: 276, marginHorizontal: -20, marginTop: -8, marginBottom: 26',
  'hero: { minHeight: 276, marginHorizontal: -20, marginTop: 0, marginBottom: 26',files[8]);
 s=replaceOne(s,
  'top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }',
  'top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }',files[8]);
 return s;
});
// Validate entire prepared patch before touching any file.
const ts=require(require.resolve('typescript',{paths:[root]}));
for(const [file,next] of nextFiles){
 if(file.endsWith('.json')){JSON.parse(next);continue;}
 const kind=ts.ScriptKind.TSX;
 const before=ts.createSourceFile(file,originals.get(file).toString('utf8'),ts.ScriptTarget.Latest,true,kind);
 const after=ts.createSourceFile(file,next,ts.ScriptTarget.Latest,true,kind);
 if(after.parseDiagnostics.length>before.parseDiagnostics.length)abort('Error nuevo de sintaxis en '+file);
}
console.log('TREKSOR GUIDE / HOME: '+nextFiles.size+' archivos para actualizar.');
for(const file of nextFiles.keys())console.log('  '+file);
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se modifico nada.');process.exit(0);}
if(!nextFiles.size){console.log('CAMBIOS YA APLICADOS.');process.exit(0);}
const backup=fs.mkdtempSync(path.join(path.dirname(root),'Treksor-guide-backup-'));
for(const [file] of nextFiles){
 const dest=path.join(backup,file);
 fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,originals.get(file));
}
const written=[];
try{
 for(const [file,next] of nextFiles){
  if(!fs.readFileSync(file).equals(originals.get(file)))throw Error('Cambio simultaneo en '+file);
  fs.writeFileSync(file,next);written.push(file);
 }
}catch(err){for(const file of written)fs.writeFileSync(file,originals.get(file));throw err;}
console.log('TREKSOR GUIDE / HOME ACTUALIZADO. Respaldo: '+backup);
console.log('No se hicieron cambios en otros modulos, datos, dependencias o ramas Git.');
