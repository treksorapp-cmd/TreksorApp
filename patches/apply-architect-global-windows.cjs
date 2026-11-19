'use strict';
/**
 * Treksor — The Architect global mobile polish.
 * Merges only the reviewed UI/text changes into the CURRENT local checkout,
 * preserving non-overlapping local changes. Never checkout, pull, reset, or merge a branch.
 *
 * Usage after git fetch origin fix/v12-architect-global-page-rhythm-20261119:
 *   node <downloaded-script> --check
 *   node <downloaded-script>
 */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const root=process.cwd();
const DEFAULT_BASE='961b741866b8d47b9c6b4aae6e5675340e0aca75';
const base=process.env.TREKSOR_ARCHITECT_TEST_BASE||DEFAULT_BASE;
const remote=process.env.TREKSOR_ARCHITECT_TEST_REMOTE||'FETCH_HEAD';
const abort=reason=>{throw Error(reason+' No se escribio ningun archivo.');};
const git=(args,options={})=>{
 const r=cp.spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024,...options});
 if(r.status!==0)throw Error(r.stderr||'Fallo git '+args.slice(0,2).join(' '));
 return r.stdout;
};
if(path.resolve(git(['rev-parse','--show-toplevel']).trim())!==path.resolve(root))abort('Ejecutar desde TreksorApp.');
if(cp.spawnSync('git',['rev-parse','-q','--verify','MERGE_HEAD'],{cwd:root,stdio:'ignore'}).status===0)
 abort('Hay un merge pendiente.');
if(!/^[0-9a-f]{40}$/.test(base))abort('Referencia base incorrecta.');
for(const ref of [base,remote])try{git(['rev-parse','--verify',ref+'^{commit}']);}catch{abort('Falta la rama de origen. Ejecuta primero el comando git fetch indicado.');}
const remoteTheme=git(['show',remote+':theme/architect.ts']);
if(!remoteTheme.includes('export const layout = {')||!remoteTheme.includes("background: '#05080D'"))
 abort('La rama descargada no es la correccion The Architect.');
const screenPaths=git(['diff','--name-only','--diff-filter=M',base,remote,'--','app','components','theme'])
 .split(/\r?\n/).filter(Boolean).filter(file=>/\.(tsx?|jsx?)$/.test(file));
if(!screenPaths.length)abort('No se reconocieron archivos de la revision The Architect.');
const original=new Map(),prepared=new Map(),errors=[];
const scratch=fs.mkdtempSync(path.join(os.tmpdir(),'treksor-architect-'));
const ts=require(require.resolve('typescript',{paths:[root]}));
const normalize=text=>text.replace(/\r\n/g,'\n');
const writeTemp=(name,content)=>{const p=path.join(scratch,name);fs.writeFileSync(p,normalize(content),'utf8');return p;};
try{
 for(let i=0;i<screenPaths.length;i++){
   const file=screenPaths[i];
   if(!fs.existsSync(file)){errors.push(file+' — no existe en tu carpeta local');continue;}
   const bytes=fs.readFileSync(file);
   const local=normalize(bytes.toString('utf8'));
   let previous,next;
   try{
     previous=normalize(git(['show',base+':'+file]));
     next=normalize(git(['show',remote+':'+file]));
   }catch(e){errors.push(file+' — no se pudo leer la revision original');continue;}
   if(local===next)continue;
   // Fast path for a clean file. Otherwise use a conservative 3-way merge.
   // Unrelated local edits stay untouched; conflicts never reach the real file.
   let result=next;
   if(local!==previous){
     const ours=writeTemp('local-'+i,local),ancestor=writeTemp('base-'+i,previous),theirs=writeTemp('target-'+i,next);
     const merge=cp.spawnSync('git',['merge-file','-p','-L','LOCAL','-L','BASE','-L','TREKSOR',ours,ancestor,theirs],
       {cwd:root,encoding:'utf8',maxBuffer:16*1024*1024});
     if(merge.status!==0||!merge.stdout||merge.stdout.includes('<<<<<<< LOCAL')){
       errors.push(file+' — cambios locales y nuevos se superponen; revisar antes de aplicar');continue;
     }
     result=merge.stdout;
   }
   if(result===local)continue;
   const oldAst=ts.createSourceFile(file,local,ts.ScriptTarget.Latest,true,
     file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
   const newAst=ts.createSourceFile(file,result,ts.ScriptTarget.Latest,true,
     file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
   if(newAst.parseDiagnostics.length>oldAst.parseDiagnostics.length){
     errors.push(file+' — se detecto un error nuevo de sintaxis');continue;
   }
   original.set(file,bytes);
   prepared.set(file,bytes.toString('utf8').includes('\r\n')?result.replace(/\n/g,'\r\n'):result);
 }
 if(errors.length){
   console.error('La revision encontro '+errors.length+' incompatibilidades. No se modifico nada:');
   errors.forEach(item=>console.error('  '+item));
   abort('Envia esta salida para adaptar la correccion sin perder tu trabajo.');
 }
 console.log('THE ARCHITECT — '+screenPaths.length+' pantallas/componentes revisados.');
 console.log('Archivos con cambios pendientes: '+prepared.size);
 for(const file of prepared.keys())console.log('  '+file);
 if(process.argv.includes('--check'))console.log('COMPATIBLE. Sin escribir archivos.');
 else if(!prepared.size)console.log('THE ARCHITECT YA ACTUALIZADO.');
 else {
 const backup=fs.mkdtempSync(path.join(path.dirname(root),'Treksor-architect-backup-'));
 for(const file of prepared.keys()){
   const dest=path.join(backup,file);
   fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,original.get(file));
 }
 const written=[];
 try{
   for(const [file,content] of prepared){
     if(!fs.readFileSync(file).equals(original.get(file)))throw Error('El archivo cambio durante la instalacion: '+file);
     fs.writeFileSync(file,content);
     written.push(file);
   }
 }catch(err){
   for(const file of written)fs.writeFileSync(file,original.get(file));
   throw err;
 }
 console.log('THE ARCHITECT GLOBAL APLICADO. Respaldo: '+backup);
 console.log('Sin reemplazar tu rama, datos, rutinas, videos, smartwatch, website ni dependencias.');
 }
}finally{fs.rmSync(scratch,{recursive:true,force:true});}
