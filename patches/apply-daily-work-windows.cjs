'use strict';
// Apply Daily Work to the current local Treksor checkout without changing branches.
// Full source is fetched for NEW files only. Existing screens receive small, validated insertions.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd(),changed=new Map(),originals=new Map();
const abort=msg=>{throw Error(msg+' No se modifico ningun archivo.')};
const git=args=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024}).trimEnd();
if(path.resolve(git(['rev-parse','--show-toplevel']))!==path.resolve(root))abort('Ejecuta desde TreksorApp.');
if(cp.spawnSync('git',['rev-parse','-q','--verify','MERGE_HEAD'],{cwd:root,stdio:'ignore'}).status===0)abort('Hay un merge en curso.');
const ref='refs/remotes/origin/feature/v12-daily-work-activities-progress-20261119';
const remote=file=>git(['show',ref+':'+file])+'\n';
const newFiles=['lib/daily-activities.ts','hooks/useDailyActivities.ts','components/DailyWork.tsx'];
const editedFiles=['app/(tabs)/today/index.tsx','app/(tabs)/tracking/index.tsx','lib/progress-metrics.ts','components/progress/ProgressDashboard.tsx'];
// The catalog marker verifies the fetched branch is the expected feature.
const catalog=remote(newFiles[0]);
if(!catalog.includes("DAILY_ACTIVITY_OPTIONS")||!catalog.includes("treksor.daily-work.v1."))abort('Descargaste otra rama. Vuelve a ejecutar git fetch de Daily Work.');
function source(file) {
 if(!fs.existsSync(file))abort('Falta '+file+'. No se sobrescribiran pantallas con una version diferente.');
 const bytes=fs.readFileSync(file);originals.set(file,bytes);
 return bytes.toString('utf8').replace(/\r\n/g,'\n');
}
function keep(file,updated){
 const bytes=originals.get(file),crlf=bytes.toString('utf8').includes('\r\n');
 const next=crlf?updated.replace(/\n/g,'\r\n'):updated;
 if(next!==bytes.toString('utf8'))changed.set(file,next);
}
function one(src,from,to,label){
 if(src.includes(to))return src;
 if(!src.includes(from)||src.indexOf(from)!==src.lastIndexOf(from))abort('Estructura diferente en '+label+'.');
 return src.replace(from,to);
}
for(const file of newFiles){
 const content=remote(file);
 if(fs.existsSync(file)){
  const old=fs.readFileSync(file);
  originals.set(file,old);
  if(old.toString('utf8').replace(/\r\n/g,'\n').trimEnd()!==content.trimEnd())
   abort('Ya existe un archivo personalizado: '+file+'.');
 }else changed.set(file,content);
}
{
 const file=editedFiles[0];let s=source(file);
 s=one(s,'import WeeklyHabits from "@/components/WeeklyHabits";',
   'import WeeklyHabits from "@/components/WeeklyHabits";\nimport DailyWork from "@/components/DailyWork";',file);
 s=one(s,'      <WeeklyHabits />','      <DailyWork />\n      <WeeklyHabits />',file);
 keep(file,s);
}
{
 const file=editedFiles[1];let s=source(file);
 s=one(s,'import { useWalks } from "@/hooks/useWalks";',
   'import { useWalks } from "@/hooks/useWalks";\nimport { useDailyActivities } from "@/hooks/useDailyActivities";\nimport Icon from "@/components/ui/BrandIcon";',file);
 s=one(s,'  const walks = useWalks();','  const walks = useWalks();\n  const dailyWork = useDailyActivities();',file);
 s=one(s,'buildProgressOverview({ walks: walks.rows, checkIns, gymSets,',
   'buildProgressOverview({ walks: walks.rows, dailyActivities: dailyWork.entries, checkIns, gymSets,',file);
 const start='<TouchableOpacity accessibilityRole="button" accessibilityLabel="Open Daily Work to log an activity"';
 if(!s.includes(start)){
   const current=remote(file),from=current.indexOf('      '+start),to=current.indexOf('      <WalkingSummary',from);
   if(from<0||to<0)abort('El resumen Daily Work remoto es incompatible.');
   const marker='      <WalkingSummary rows={walks.rows} now={walks.now} loading={walks.loading} error={walks.error}/>';
   if(!s.includes(marker))abort('La tarjeta de caminatas de Progress es diferente.');
   s=s.replace(marker,current.slice(from,to)+marker);
 }
 keep(file,s);
}
{
 const file=editedFiles[2];let s=source(file),fromRemote=remote(file);
 s=one(s,
  '  id: string; date: string; kind: "session" | "set" | "reflection" | "journal" | "habit" | "checkin" | "moment" | "walk";',
  '  id: string; date: string; kind: "session" | "set" | "reflection" | "journal" | "habit" | "checkin" | "moment" | "walk" | "activity";',file);
 s=one(s,
  '  walks?: {id:string;date:string;minutes:number|null}[];',
  '  walks?: {id:string;date:string;minutes:number|null}[];\n  dailyActivities?: {id:string;date:string;kind:string;title:string;minutes:number|null}[];',file);
 const eventStart=fromRemote.indexOf('  // Daily Work and Body Walks feed one dated timeline.');
 const eventEnd=fromRemote.indexOf('  events.sort(',eventStart);
 if(eventStart<0||eventEnd<0)abort('El historial remoto cambio.');
 const eventBlock=fromRemote.slice(eventStart,eventEnd);
 if(!s.includes('  // Daily Work and Body Walks feed one dated timeline.')){
   const marker='  events.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));';
   if(!s.includes(marker))abort('El historial local no coincide.');
   s=s.replace(marker,eventBlock+marker);
 }
 const statStart=fromRemote.indexOf('    dailyWorkCount:'),statEnd=fromRemote.indexOf('    meditation:',statStart);
 if(statStart<0||statEnd<0)abort('Las metricas Daily Work remotas no coinciden.');
 if(!s.includes('    dailyWorkCount:')){
   const marker='    meditation: { completed:';
   if(!s.includes(marker))abort('Las metricas locales tienen otro formato.');
   s=s.replace(marker,fromRemote.slice(statStart,statEnd)+marker);
 }
 keep(file,s);
}
{
 const file=editedFiles[3];let s=source(file);
 const edits=[
  ['daily check-in, life moment or completed tracker item. The selected window',
   'daily check-in, life moment, Daily Work activity, walk or completed tracker item. The selected window'],
  ['Training: sessions and sets you save. Mind: saved reflections and journal dates. Balance: practices you mark complete. Purpose: saved vision prompts. Personal trackers: checkmarks you enter for scheduled dates.',
   'Training: sessions and sets you save. Daily Work: completed walks and other activities you log, including your own. Mind: saved reflections and journal dates. Balance: practices you mark complete. Purpose: saved vision prompts. Personal trackers: checkmarks you enter for scheduled dates.'],
  ['Supported progress summaries sync to your web profile. Journal text, moods and vision answers stay on this device.',
   'Some progress summaries sync to your web profile; Daily Work is currently saved only on this iPhone. Journal text, moods and vision answers stay on this device.'],
  ['event.kind === "walk" ? "walk-outline" : event.kind === "session"',
   'event.kind === "walk" ? "walk-outline" : event.kind === "activity" ? "trail-sign-outline" : event.kind === "session"'],
  ['Complete a session, save a reflection or log a habit. Its source and date will appear here.',
   'Complete a session, log Daily Work, save a reflection or mark a habit. Its source and date will appear here.']
 ];
 for(const [a,b] of edits)s=one(s,a,b,file);
 keep(file,s);
}
const ts=require(require.resolve('typescript',{paths:[root]}));
for(const [file,text] of changed) {
 if(!file.endsWith('.tsx')&&!file.endsWith('.ts'))continue;
 const before=originals.has(file)?ts.createSourceFile(file,originals.get(file).toString('utf8'),ts.ScriptTarget.Latest,true):null;
 const after=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
 if(after.parseDiagnostics.length>(before?.parseDiagnostics.length||0))
  abort('Error nuevo de sintaxis en '+file+'.');
}
console.log('DAILY WORK: '+changed.size+' archivos compatibles para instalar.');
for(const f of changed.keys())console.log('  '+f);
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se escribio nada.');process.exit(0);}
if(!changed.size){console.log('DAILY WORK YA APLICADO.');process.exit(0);}
const backup=fs.mkdtempSync(path.join(path.dirname(root),'Treksor-daily-work-backup-'));
for(const file of changed.keys()){
 if(originals.has(file)){
  const dest=path.join(backup,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,originals.get(file));
 }
}
const written=[];
try{
 for(const [file,code] of changed){
  if(originals.has(file)&&!fs.readFileSync(file).equals(originals.get(file)))throw Error('Archivo modificado durante la instalacion: '+file);
  if(!originals.has(file)&&fs.existsSync(file))throw Error('Archivo creado durante la instalacion: '+file);
  fs.mkdirSync(path.dirname(file),{recursive:true});
  written.push(file);fs.writeFileSync(file,code);
 }
}catch(error){
 for(const f of written) {if(originals.has(f))fs.writeFileSync(f,originals.get(f));else if(fs.existsSync(f))fs.unlinkSync(f);}
 throw error;
}
console.log('DAILY WORK ACTUALIZADO. Respaldo: '+backup);
console.log('Sin merges, cambios de rama, dependencias, migraciones ni reinstalaciones.');
