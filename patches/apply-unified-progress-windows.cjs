'use strict';
/**
 * Treksor V1.4: Today + Daily Work + Progress -> one simple Progress tab.
 * Safe Git Bash patch for an existing TreksorDevCompleto worktree.
 * Never changes git branches, resets, databases or stored activity records.
 */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const root=process.cwd();
const BASE='021e03d945a775d00ef42de5c46969a345b7879d';
const REVIEW='feature/v14-unified-simple-progress-20261120';
const REMOTE=process.env.TREKSOR_SIMPLE_PROGRESS_REF||'refs/remotes/origin/'+REVIEW;
const BASE_REF=process.env.TREKSOR_SIMPLE_PROGRESS_BASE||BASE;
const files=[
 'app/(tabs)/_layout.tsx',
 'app/(tabs)/today/index.tsx',
 'app/(tabs)/tracking/index.tsx',
 'components/DailyWork.tsx',
 'lib/route-trail.ts',
];
const error=msg=>{throw Error(msg+'\nNo se modifico ningun archivo de Treksor.');};
const command=(args)=>{const r=cp.spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});if(r.status!==0)throw Error(r.stderr||'Git failed');return r.stdout;};
try{if(path.resolve(command(['rev-parse','--show-toplevel']).trim())!==path.resolve(root))error('Abrir Git Bash dentro de TreksorDevCompleto.');}
catch(e){error('La carpeta no es el directorio principal del repositorio. '+String(e));}
if(cp.spawnSync('git',['rev-parse','-q','--verify','MERGE_HEAD'],{cwd:root,stdio:'ignore'}).status===0)error('Hay un merge pendiente.');
let ref,base;
try{ref=command(['rev-parse','--verify',REMOTE+'^{commit}']).trim();base=command(['rev-parse','--verify',BASE_REF+'^{commit}']).trim();}
catch{error('Falta la rama de actualizacion. Ejecuta el git fetch indicado antes de aplicar.');}
const target=(file)=>command(['show',ref+':'+file]).replace(/\r\n/g,'\n');
const previous=(file)=>command(['show',base+':'+file]).replace(/\r\n/g,'\n');
if(!target(files[0]).includes('<Tabs.Screen name="today" options={{href:null}} />')
 || !target(files[1]).includes('Redirect href="/(tabs)/tracking"')
 || !target(files[2]).includes('<DailyWork embedded/>')
 || !target(files[3]).includes('embedded=false'))
 error('La revision descargada no corresponde a Progress unificado.');
for(const prereq of ['lib/daily-activities.ts','hooks/useDailyActivities.ts','components/JourneyCard.tsx','components/WeeklyHabits.tsx','lib/progress-metrics.ts']){
 if(!fs.existsSync(prereq))error('Esta version local es anterior y le falta '+prereq+'. Usa la carpeta TreksorDevCompleto consolidada.');
}
if(!fs.readFileSync('lib/progress-metrics.ts','utf8').includes('dailyWorkCount:'))
 error('La version local no contiene las metricas de Daily Work. Usa TreksorDevCompleto consolidado.');
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'treksor-unified-progress-'));
const original=new Map(),prepared=new Map(),conflicts=[];
const ts=require(require.resolve('typescript',{paths:[root]}));
function tmp(name,text){const f=path.join(scratch,name);fs.writeFileSync(f,text);return f;}
try{
 for(let i=0;i<files.length;i++){
  const file=files[i];
  if(!fs.existsSync(file)){conflicts.push(file+' - falta el archivo');continue;}
  const bytes=fs.readFileSync(file),local=bytes.toString('utf8').replace(/\r\n/g,'\n');
  const old=previous(file),reviewed=target(file);
  if(local===reviewed)continue;
  let merged=reviewed;
  if(local!==old){
   const ours=tmp('local-'+i,local),ancestor=tmp('base-'+i,old),theirs=tmp('new-'+i,reviewed);
   const m=cp.spawnSync('git',['merge-file','-p','-L','LOCAL','-L','BASE','-L','TREKSOR',ours,ancestor,theirs],
     {cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
   if(m.status!==0||!m.stdout||m.stdout.includes('<<<<<<< LOCAL')){conflicts.push(file+' - existen modificaciones que se superponen');continue;}
   merged=m.stdout;
  }
  const before=ts.createSourceFile(file,local,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  const after=ts.createSourceFile(file,merged,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  if(after.parseDiagnostics.length>before.parseDiagnostics.length){conflicts.push(file+' - nuevo error de sintaxis');continue;}
  original.set(file,bytes);
  if(local!==merged)prepared.set(file,bytes.toString('utf8').includes('\r\n')?merged.replace(/\n/g,'\r\n'):merged);
 }
 if(conflicts.length){
  console.error('Se encontraron incompatibilidades; se conservaron todos los archivos:');
  conflicts.forEach(line=>console.error(' - '+line));
  error('Envia la salida para resolver las diferencias sin perder cambios.');
 }
 console.log('PROGRESS UNIFICADO: '+files.length+' archivos revisados, '+prepared.size+' por actualizar.');
 for(const file of prepared.keys())console.log('  '+file);
 if(process.argv.includes('--check'))console.log('COMPATIBLE. No se escribio nada.');
 else if(!prepared.size)console.log('PROGRESS UNIFICADO YA INSTALADO.');
 else{
  const backup=fs.mkdtempSync(path.join(path.dirname(root),'Treksor-progress-backup-'));
  for(const file of prepared.keys()){const dest=path.join(backup,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,original.get(file));}
  const written=[];
  try{
   for(const [file,code] of prepared){
    if(!fs.readFileSync(file).equals(original.get(file)))throw Error('Cambio simultaneo de '+file);
    fs.writeFileSync(file,code);written.push(file);
   }
  }catch(e){for(const file of written)fs.writeFileSync(file,original.get(file));throw e;}
  console.log('PROGRESS UNIFICADO INSTALADO. Respaldo: '+backup);
  console.log('Un solo tab Progress; actividades, habitos, notas y direccion diaria conservados.');
 }
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
