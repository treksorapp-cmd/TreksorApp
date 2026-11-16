// Run from the user's existing TreksorApp checkout. No branch/dependency changes.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const SOURCE = '2bf591950bbecdb8ad7bc8685ad27186addc4b66';
const UPDATE = '56bee4edb1f1a01fb7f76d83df56a1ec8faaba3f';
const root = process.cwd();
const git = args => cp.execFileSync('git', args, {cwd:root, encoding:'utf8', maxBuffer:16*1024*1024});
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const fail = message => {throw Error(message)};
if (path.resolve(git(['rev-parse','--show-toplevel']).trim()) !== root) fail('Ejecuta este comando desde la carpeta TreksorApp.');
if (fs.existsSync(path.resolve(root,git(['rev-parse','--git-path','MERGE_HEAD']).trim()))) fail('Hay un merge pendiente. No se modifico nada.');
const ts = require(require.resolve('typescript',{paths:[root]}));
require.resolve('react-native-svg/package.json',{paths:[root]});
const staged = new Map();
const originals = new Map();
function stage(file, value) {
  const before = fs.existsSync(file) ? fs.readFileSync(file) : null;
  if (before?.equals(Buffer.from(value))) return;
  originals.set(file,before); staged.set(path.resolve(file),String(value));
}
const bundled = ['components/ui/BrandIcon.tsx','components/CommunityMentors.tsx','design/brand/icons.json','design/brand/LICENSE-lucide'];
for (const file of bundled) {
  const content = git(['show',`${SOURCE}:${file}`]);
  if (fs.existsSync(file) && fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n') !== content.replace(/\r\n/g,'\n')) fail(`Ya existe una version diferente de ${file}. No se modifico nada.`);
  stage(file,content);
}
const aiFiles = new Set([
  'app/(tabs)/_layout.tsx','app/(tabs)/chat/_layout.tsx','app/(tabs)/chat/index.tsx',
  'components/mentor/MentorCompanion.tsx','components/PremiumInterestCard.tsx',
  'components/progress/ProgressDashboard.tsx','components/ConnectedJourney.tsx',
  'components/PremiumPillarScreen.tsx','components/SubscriptionScreen.tsx','components/JourneyCard.tsx',
  'lib/connected-journey.ts','lib/guided-discovery.ts','app/progress/connections.tsx','app/body/nutrition/index.tsx',
]);
function renameCopy(file, source) {
  const parsed=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
  const edits=[];
  function visit(node) {
    if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)||ts.isJsxText(node)||ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node)){
      const start=node.getStart(parsed),end=node.getEnd(),old=source.slice(start,end);
      const next=old.replace(/\bMentor\b/g,'Guide').replace(/\bMENTOR\b/g,'GUIDE');
      if(next!==old)edits.push({start,end,next});
    }
    ts.forEachChild(node,visit);
  }
  visit(parsed);
  for(const {start,end,next} of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,start)+next+source.slice(end);
  return source;
}
for (const file of git(['ls-files','-z','app','components','lib']).split('\0').filter(f=>/\.tsx?$/.test(f))) {
  if (!fs.existsSync(file) || bundled.includes(file)) continue;
  const original=fs.readFileSync(file,'utf8'),eol=original.includes('\r\n')?'\r\n':'\n';
  let source=original.replace(/\r\n/g,'\n');
  if(aiFiles.has(file))source=renameCopy(file,source);
  if(file.endsWith('.tsx'))source=source.replace(/import \{([^}]*\bIonicons\b[^}]*)\} from (["'])@expo\/vector-icons\2;?/,(_,items)=>{
    const rest=items.split(',').map(x=>x.trim()).filter(x=>x!=='Ionicons');
    return "import Ionicons from '@/components/ui/BrandIcon';"+(rest.length?`\nimport { ${rest.join(', ')} } from '@expo/vector-icons';`:'');
  });
  if(['app/(tabs)/home/index.tsx','components/BodyPageHeading.tsx'].includes(file))source=source.replace(/import \{ MaterialCommunityIcons \} from '@expo\/vector-icons';\n/,'').replace(/<MaterialCommunityIcons name="brain"/g,'<Ionicons name="brain"');
  if(['components/ConnectedJourney.tsx','components/WeeklyReview.tsx','components/progress/ProgressDashboard.tsx'].includes(file))source=source.replace(/(id: "mind"[^\n]*icon: )"book-outline"/g,'$1"brain"').replace(/(id: "balance"[^\n]*icon: )"shield-outline"/g,'$1"leaf-outline"');
  if(['app/(tabs)/chat/index.tsx','components/ChatModal.tsx'].includes(file))source=source.replace(/<Image\s+source=\{require\("@\/assets\/images\/(?:bot|chatbot)\.png"\)\}\s+style=\{\{[^}]+\}\}\s*\/>/g,'<Ionicons name="sparkles-outline" size={24} color={colors.gold} accessibilityLabel="Guide AI" />').replace('>Ai</Text>','>Guide · AI</Text>');
  if(file==='components/mentor/MentorCompanion.tsx')source=source.replace('YOUR GUIDE','YOUR AI GUIDE');
  if(file==='app/(tabs)/community/index.tsx'&&!source.includes('<CommunityMentors')){
    const heading=/<BodyPageHeading\b[^]*?\/>/;
    if(!heading.test(source))fail('La estructura de Comunidad cambio. No se modifico nada.');
    source="import CommunityMentors from '@/components/CommunityMentors';\n"+source.replace(heading,match=>match+'\n <CommunityMentors/>');
  }
  if(file==='components/CommunityConnections.tsx')source=source.replace(/^.*title: "Connect with a mentor".*\n/m,'');
  stage(file,source.replace(/\n/g,eol));
}
for(const file of ['app/(tabs)/chat/index.tsx','app/(tabs)/chat/_layout.tsx','app/(tabs)/community/index.tsx'])if(!fs.existsSync(file))fail(`Falta ${file}. No se modifico nada.`);
const chat=staged.get(path.resolve('app/(tabs)/chat/index.tsx'))||fs.readFileSync('app/(tabs)/chat/index.tsx','utf8');
if(/images\/(bot|chatbot)\.png/.test(chat)||!chat.includes('Guide'))fail('No se pudo reconocer el chat. No se modifico nada.');
// Extend the user's existing screens instead of transplanting an advanced branch.
const newFiles=['components/AppFrame.tsx','components/WalkingSummary.tsx','hooks/useWalks.ts','lib/navigation-frame-context.ts','lib/route-trail.ts','lib/walks.ts','app/body/walks.tsx'];
for(const file of newFiles){const content=git(['show',`${UPDATE}:${file}`]);if(fs.existsSync(file)&&fs.readFileSync(file,'utf8').replace(/\r\n/g,'\n')!==content.replace(/\r\n/g,'\n'))fail(`Ya existe una version diferente de ${file}. No se modifico nada.`);stage(file,content)}
function edit(file,transform){if(!fs.existsSync(file))fail(`Falta ${file}. No se modifico nada.`);const source=staged.get(path.resolve(file))??fs.readFileSync(file,'utf8'),eol=source.includes('\r\n')?'\r\n':'\n';stage(file,transform(source.replace(/\r\n/g,'\n')).replace(/\n/g,eol))}
edit('app/_layout.tsx',s=>{if(s.includes('<AppFrame'))return s;const stack=/<Stack\b[^]*?\/>/;if(!stack.test(s)||!s.includes('isAuthenticated'))fail('No se reconocio el navegador principal. No se modifico nada.');return 'import AppFrame from "@/components/AppFrame";\n'+s.replace(stack,match=>'<AppFrame enabled={isAuthenticated}>'+match+'</AppFrame>')});
edit('components/BodyPageHeading.tsx',s=>{if(s.includes('useFixedRouteHeader'))return s;const start=s.indexOf('<View style={styles.topRow}>'),end=s.indexOf('    <Text accessibilityRole="header"',start);if(start<0||end<0)fail('El encabezado de pilar cambio. No se modifico nada.');let row=s.slice(start,end);const closing=row.lastIndexOf('</View>');row='{!fixed && '+row.slice(0,closing)+'</View>}'+row.slice(closing+7);s=s.slice(0,start)+row+s.slice(end);s=s.replace('    const pathname =','    const fixed = useFixedRouteHeader();\n    const pathname =');return "import {useFixedRouteHeader} from '@/lib/navigation-frame-context';\n"+s});
edit('components/ui/Header.tsx',s=>{if(s.includes('useFixedRouteHeader'))return s;return "import {useFixedRouteHeader} from '@/lib/navigation-frame-context';\n"+s.replace('    const insets =','    const fixed = useFixedRouteHeader();\n    const insets =').replace('<Text style={styles.eyebrow}>TREKSOR / {title ? displayLabel(title).toUpperCase() : "YOUR JOURNEY"}</Text>','{!fixed && <Text style={styles.eyebrow}>TREKSOR / {title ? displayLabel(title).toUpperCase() : "YOUR JOURNEY"}</Text>}').replace('{showBackButton && <TouchableOpacity','{showBackButton && !fixed && <TouchableOpacity')});
edit('app/body/index.tsx',s=>{if(s.includes('useWalks'))return s;if(!s.includes('export default function BodyScreen() {')||!s.includes('{ label: "Workout",'))fail('El menu Body cambio. No se modifico nada.');return 'import {useWalks} from "@/hooks/useWalks";\nimport {walkTotals} from "@/lib/walks";\n'+s.replace('export default function BodyScreen() {','export default function BodyScreen() {\n  const walks=useWalks();\n  const walkLabel=walks.loading||walks.error?"Daily walks":`Daily walks · ${walkTotals(walks.rows,walks.now).today} today`;').replace('{ label: "Workout",','{ label: walkLabel, icon: "walk-outline", href: "/body/walks" as any },\n    { label: "Workout",')});
edit('app/(tabs)/tracking/index.tsx',s=>{if(s.includes('useWalks'))return s;if(!s.includes('export default function TrackingScreen() {')||!/<ProgressSyncStatus\s*\/>/.test(s))fail('La pantalla Progress cambio. No se modifico nada.');return 'import WalkingSummary from "@/components/WalkingSummary";\nimport {useWalks} from "@/hooks/useWalks";\n'+s.replace('export default function TrackingScreen() {','export default function TrackingScreen() {\n  const walks=useWalks();').replace(/buildProgressOverview\(\{/, 'buildProgressOverview({ walks:walks.rows,').replace(/<ProgressSyncStatus\s*\/>/,'<WalkingSummary rows={walks.rows} now={walks.now} loading={walks.loading} error={walks.error}/><ProgressSyncStatus/>')});
edit('lib/progress-metrics.ts',s=>{if(s.includes('walks?:'))return s;if(!s.includes('"moment";')||!s.includes('  events.sort((a, b)'))fail('El calculo de progreso cambio. No se modifico nada.');return s.replace('"moment";','"moment" | "walk";').replace('export interface ProgressInput {','export interface ProgressInput {\n  walks?: {id:string;date:string;minutes:number|null}[];').replace('  events.sort((a, b)','  [...new Map((input.walks||[]).map(row=>[row.id,row])).values()].forEach(row=>add({id:`walk:${row.id}`,kind:"walk",title:"Walk completed",source:row.minutes===null?"Body · Manually recorded walk":`Body · Walk · ${row.minutes} minutes`,route:"/body/walks"},row.date));\n  events.sort((a, b)')});
edit('components/progress/ProgressDashboard.tsx',s=>s.includes('event.kind === "walk"')?s:s.replace('name={event.kind === "session"','name={event.kind === "walk" ? "walk-outline" : event.kind === "session"'));
edit('theme/architect.ts',s=>{
  if(s.includes('palettes[appearance]'))return s;
  for(const [key,value]of Object.entries({background:'#0B1930',surface:'#132640',surfaceRaised:'#1B3352',border:'rgba(175,201,235,0.18)',glass:'rgba(175,201,235,0.06)'})){
    const pattern=new RegExp('\\b'+key+':\\s*(["\x27])[^"\x27]+\\1');if(!pattern.test(s))fail('La paleta actual no coincide: '+key);s=s.replace(pattern,`${key}: "${value}"`);
  }
  if(!s.includes('export const navyOverlay'))s+='\nexport const navyOverlay=(opacity:number)=>`rgba(11,25,48,${opacity})`;\n';return s;
});
const transformModule={exports:{}};
require('node:vm').runInNewContext(git(['show',`${UPDATE}:patches/mobile-navy-transform.cjs`]),{module:transformModule});
for(const file of git(['ls-files','-z','app','components']).split('\0').filter(f=>/\.tsx?$/.test(f)&&fs.existsSync(f)))edit(file,s=>transformModule.exports(file,s,ts));
edit('components/ui/Button.tsx',s=>{if(!s.includes('@/theme/architect'))s='import {colors} from "@/theme/architect";\n'+s;return s.replace(/colors=\{\s*disabled\s*\? \[[^\]]+\]\s*:\s*\[[^\]]+\]\s*\}/,'colors={[colors.border, colors.border]}').replace(/colors=\{disabled \? \[[^\]]+\] : \[[^\]]+\]\}/,'colors={[colors.surface, colors.surface]}')});
for(const file of ['components/ui/TextInput.tsx','components/ui/OtpInput.tsx'])if(fs.existsSync(file))edit(file,s=>s.replace(/error \? "rgba\(255, 100, 100, 0\.5\)" : "rgba\(255, 255, 255, 0\.3\)"/g,'error ? colors.danger : colors.border').replace(/error \? "rgba\(255, 50, 50, 0\.6\)" : "rgba\(255, 255, 255, 0\.4\)"/g,'error ? colors.danger : colors.border'));
console.log('Verificando compatibilidad con TU codigo y dependencias...');
const configFile=fs.existsSync('tsconfig.mobile.json')?'tsconfig.mobile.json':'tsconfig.json';
const config=ts.readConfigFile(configFile,ts.sys.readFile);if(config.error)fail('No se pudo leer TypeScript.');
const parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,root);
function diagnostics(virtual) {
  const host=ts.createCompilerHost({...parsed.options,noEmit:true});
  const read=host.readFile,exists=host.fileExists;
  const directoryExists=host.directoryExists;
  host.directoryExists=directory=>[...virtual.keys()].some(file=>file.startsWith(path.resolve(directory)+path.sep))||!!directoryExists?.(directory);
  host.readFile=file=>virtual.get(path.resolve(file))??read(file);
  host.fileExists=file=>virtual.has(path.resolve(file))||exists(file);
  host.getSourceFile=(file,languageVersion)=>{const text=host.readFile(file);return text===undefined?undefined:ts.createSourceFile(file,text,languageVersion,true)};
  const files=[...new Set([...parsed.fileNames,...[...virtual.keys()].filter(file=>/\.tsx?$/.test(file))])];
  return ts.getPreEmitDiagnostics(ts.createProgram(files,{...parsed.options,noEmit:true},host));
}
const key=d=>(d.file?path.relative(root,d.file.fileName):'')+':'+d.code+':'+ts.flattenDiagnosticMessageText(d.messageText,' ');
const before=new Set(diagnostics(new Map()).map(key));
const added=diagnostics(staged).filter(d=>!before.has(key(d)));
if(added.length)fail('No se modifico nada. Nuevos errores:\n'+added.slice(0,8).map(key).join('\n'));
if(process.argv.includes('--check')){console.log(`COMPATIBLE: ${staged.size} archivos preparados; no se escribio nada.`);process.exit(0)}
if(!staged.size){console.log('GUIDE E ICONOS YA ACTUALIZADOS.');process.exit(0)}
const backup=fs.mkdtempSync(path.join(path.dirname(root),'Treksor-guide-backup-'));
const manifest=[];
for(const [file,original] of originals){
  if(original){const dest=path.join(backup,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,original)}
  manifest.push({file,existed:original!==null,before:original?hash(original):null,after:hash(staged.get(path.resolve(file)))});
}
fs.writeFileSync(path.join(backup,'manifest.json'),JSON.stringify({source:UPDATE,files:manifest},null,2));
const written=[];
try{
  for(const [absolute,content] of staged){const file=path.relative(root,absolute).split(path.sep).join('/'),original=originals.get(file);const current=fs.existsSync(file)?fs.readFileSync(file):null;if(original===null?current!==null:!current?.equals(original))fail(`El archivo cambio durante la comprobacion: ${file}`);fs.mkdirSync(path.dirname(absolute),{recursive:true});written.push(file);fs.writeFileSync(absolute,content)}
}catch(error){for(const file of written.reverse()){const original=originals.get(file);if(original===null)fs.unlinkSync(file);else fs.writeFileSync(file,original)}throw error}
console.log(`TREKSOR ACTUALIZADO: GUIDE, ICONOS, RUTA FIJA, AZUL Y CAMINATAS.\nRespaldo completo: ${backup}\nHome y tus cambios locales fueron conservados.\nNo se modificaron dependencias, configuracion nativa ni rama.`);
