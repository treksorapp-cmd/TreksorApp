'use strict';
// Release channel: append future reviewed, idempotent installers to this list.
// Never checkout, reset, merge, or modify unrelated local files.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const releases=[
 {id:'compact-screen-top-v1',script:'patches/compact-screen-top-windows.cjs'},
 {id:'progress-safe-area-v2',script:'patches/progress-safe-area-windows.cjs'},
 {id:'primary-tabs-header-v3',script:'patches/primary-tabs-header-windows.cjs'},
 {id:'quick-notes-date-v4',script:'patches/quick-notes-date-windows.cjs'},
 {id:'primary-tab-labels-community-v5',script:'patches/primary-tab-labels-community-windows.cjs'},
 {id:'nested-pillar-shortcut-v6',script:'patches/pillar-shortcut-windows.cjs'}
];
const root=process.cwd();
const git=(...args)=>cp.spawnSync('git',args,{cwd:root,encoding:'utf8'});
const rev=git('rev-parse','--show-prefix');
if(rev.status!==0||rev.stdout.trim())throw Error('Ejecutar desde la raiz de TreksorDevCompleto.');
const fetch=git('rev-parse','FETCH_HEAD');
if(fetch.status!==0)throw Error('No se encontro la version descargada.');
const revision=fetch.stdout.trim();
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'treksor-update-'));
const pending=[];
try{
 for(const item of releases){
  const result=git('show',revision+':'+item.script);
  if(result.status!==0)throw Error('No se pudo obtener '+item.id);
  const file=path.join(temp,item.id+'.cjs');
  fs.writeFileSync(file,result.stdout);
  const check=cp.spawnSync(process.execPath,[file,'--check'],{cwd:root,encoding:'utf8'});
  process.stdout.write(check.stdout||'');
  if(check.status!==0){process.stderr.write(check.stderr||'');throw Error('Actualizacion detenida antes de modificar archivos: '+item.id);}
  pending.push({item,file});
 }
 for(const {item,file} of pending){
  console.log('Aplicando '+item.id+'...');
  const applied=cp.spawnSync(process.execPath,[file],{cwd:root,encoding:'utf8'});
  process.stdout.write(applied.stdout||'');
  if(applied.status!==0){process.stderr.write(applied.stderr||'');throw Error('Actualizacion interrumpida en '+item.id+'. Revisa respaldo indicado.');}
 }
 console.log('ACTUALIZACIONES COMPLETADAS. No se cerro Expo ni se cambio la rama local.');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
