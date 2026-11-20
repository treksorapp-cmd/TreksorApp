'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const rules=[{"file":"components/AppFrame.tsx","pairs":[["          <Text accessibilityRole=\"header\" accessibilityLabel={`Current location: ${trail.label}`} style={s.trail}>{trail.label}</Text>","          {primaryTab ? <View style={s.trail}/> : <Text accessibilityRole=\"header\" accessibilityLabel={`Current location: ${trail.label}`} style={s.trail}>{trail.label}</Text>}"]]},{"file":"app/(tabs)/community/index.tsx","pairs":[["return <SafeAreaView edges={['top']} style={s.screen}>","return <SafeAreaView edges={[]} style={s.screen}>"],["style={{marginHorizontal:-20,marginTop:layout.compactTop}}","style={{marginHorizontal:-20,marginTop:0}}"],["import {colors,surface,type,layout} from '@/theme/architect';","import {colors,surface,type} from '@/theme/architect';"]]}];
const git=cp.spawnSync('git',['rev-parse','--show-prefix'],{encoding:'utf8'});
if(git.status!==0||git.stdout.trim())throw Error('Ejecutar desde la raiz de TreksorDevCompleto');
const changes=[];
for(const {file,pairs} of rules){
 const original=fs.readFileSync(file,'utf8');let next=original;
 for(const [old,updated] of pairs){if(next.includes(updated))continue;if(!next.includes(old))throw Error('Version incompatible en '+file+'. No se modifico nada.');next=next.replace(old,updated);}
 if(next!==original)changes.push({file,original,next});
}
console.log('NAVEGACION Y COMMUNITY: '+changes.length+' archivos por actualizar.');
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se modifico nada.');process.exit(0);}
if(!changes.length){console.log('YA ACTUALIZADO');process.exit(0);}
const backup=fs.mkdtempSync(path.resolve(process.cwd(),'..','Treksor-header-alignment-backup-'));
for(const {file,original} of changes){const dest=path.join(backup,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,original);}
const written=[];
try{for(const {file,original,next} of changes){if(fs.readFileSync(file,'utf8')!==original)throw Error('Archivo cambio durante la actualizacion: '+file);fs.writeFileSync(file,next);written.push({file,original});}}
catch(e){for(const {file,original} of written)fs.writeFileSync(file,original);throw e;}
console.log('ENCABEZADOS ACTUALIZADOS. Respaldo: '+backup);
