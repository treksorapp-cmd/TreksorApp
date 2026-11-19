'use strict';
// Restore Treksor Architect for original token files and optional palette-switch versions.
// Does not fetch, checkout, merge or install dependencies.
const fs=require('node:fs'), path=require('node:path'), cp=require('node:child_process');
const root=process.cwd();
function abort(s){throw Error(s+' No se modifico nada.')}
const git=cp.execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
if(path.resolve(git)!==path.resolve(root))abort('Ejecutar en TreksorApp.');
if(cp.spawnSync('git',['rev-parse','-q','--verify','MERGE_HEAD'],{cwd:root,stdio:'ignore'}).status===0)abort('Merge pendiente.');
const names=['theme/architect.ts','components/AppFrame.tsx','app/(tabs)/home/index.tsx'];
const originals=new Map(),updates=new Map(),warnings=[];
for(const f of names)if(fs.existsSync(f))originals.set(f,fs.readFileSync(f));
if(!originals.has(names[0]))abort('Falta theme/architect.ts.');
function stage(name,fn){
  if(!originals.has(name)){warnings.push('Omitido porque falta: '+name);return;}
  const raw=originals.get(name).toString('utf8'),eol=raw.includes('\r\n')?'\r\n':'\n';
  const next=fn(raw.replace(/\r\n/g,'\n')).replace(/\n/g,eol);
  if(next!==raw)updates.set(name,next);
}
stage(names[0],s=>{
  if(/export const appearance\b/.test(s)){
    const selector=/(export const appearance[^\n=]*=\s*)(['"])(navy|midnight)\2/;
    if(!selector.test(s)||!/midnight:\s*\{[^}]*#05080D[^}]*#0B1017[^}]*#121922/i.test(s))abort('Tema nuevo desconocido.');
    s=s.replace(selector,(_m,p,q)=>p+q+'midnight'+q);
  }else{
    if(!/export const colors\s*=/.test(s))abort('Tema original desconocido.');
    for(const [key,target,possible] of [
      ['background','#05080D',['#05080D','#0B1930']],
      ['surface','#0B1017',['#0B1017','#132640']],
      ['surfaceRaised','#121922',['#121922','#1B3352']]
    ]){
      const re=new RegExp('(\\b'+key+'\\s*:\\s*)(["\\x27])(#[a-fA-F0-9]{6})\\2');
      const hit=s.match(re);
      if(!hit||!possible.some(v=>v.toLowerCase()===hit[3].toLowerCase()))abort('Color inesperado '+key+'.');
      s=s.replace(re,(_m,p,q)=>p+q+target+q);
    }
  }
  const suffix='$'+'{opacity}';
  return s.replaceAll('rgba(175,201,235,0.18)','rgba(245,244,241,0.10)')
    .replaceAll('rgba(175,201,235,0.06)','rgba(245,244,241,0.045)')
    .replaceAll('rgba(11,25,48,'+suffix+')','rgba(5,8,13,'+suffix+')');
});
stage(names[1],s=>{
  const from="picker:{flexDirection:'row',paddingHorizontal:16,paddingBottom:12,gap:8}";
  const to="picker:{position:'absolute',top:'100%',left:12,right:12,zIndex:20,flexDirection:'row',padding:10,gap:8,backgroundColor:colors.background,borderWidth:1,borderColor:colors.border,borderRadius:14,elevation:12}";
  const frame="chrome:{backgroundColor:colors.background,borderBottomWidth:1,borderBottomColor:colors.border}";
  const raised="chrome:{backgroundColor:colors.background,borderBottomWidth:1,borderBottomColor:colors.border,zIndex:10,elevation:10}";
  if(!s.includes(from)&&!s.includes(to)){warnings.push('Barra personalizada: no se modifica.');return s;}
  return s.replace(from,to).replace(frame,raised)
    .replace('bar:{paddingHorizontal:16,paddingVertical:10,','bar:{paddingHorizontal:16,paddingVertical:6,');
});
stage(names[2],s=>{
  const top=/(\btop:\s*\{[^\n{}]*\bmarginBottom:\s*)15\b/;
  const pad=/(\bcontent:\s*\{[^\n{}]*\bpaddingTop:\s*)13\b/;
  if(!top.test(s)&&!pad.test(s))warnings.push('Home: margenes originales ya ajustados o diferentes.');
  return s.replace(top,(_m,p)=>p+'4').replace(pad,(_m,p)=>p+'7');
});
if(updates.size){
  const ts=require(require.resolve('typescript',{paths:[root]}));
  for(const [f,text] of updates){
    const was=ts.createSourceFile(f,originals.get(f).toString('utf8'),ts.ScriptTarget.Latest,true);
    const now=ts.createSourceFile(f,text,ts.ScriptTarget.Latest,true);
    if(now.parseDiagnostics.length>was.parseDiagnostics.length)abort('Error nuevo de sintaxis en '+f);
  }
}
console.log('Cambios preparados: '+updates.size);for(const f of updates.keys())console.log('  '+f);
for(const line of warnings)console.log('AVISO: '+line);
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se escribio nada.');process.exit(0);}
if(!updates.size){console.log('El tema ya esta aplicado.');process.exit(0);}
const backup=fs.mkdtempSync(path.join(path.dirname(root),'Treksor-premium-backup-'));
const written=[];
for(const [f] of updates){const dest=path.join(backup,f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,originals.get(f));}
try{
  for(const [f,v] of updates){
    if(!fs.readFileSync(f).equals(originals.get(f)))throw Error('Cambio simultaneo en '+f);
    fs.writeFileSync(f,v);written.push(f);
  }
}catch(e){for(const f of written)fs.writeFileSync(f,originals.get(f));throw e;}
console.log('TREKSOR PREMIUM APLICADO. Respaldo: '+backup);
console.log('No se cambio la rama, las dependencias ni los datos de usuario.');
