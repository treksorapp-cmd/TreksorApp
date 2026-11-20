'use strict';
// Apply the compact top rhythm to an existing TreksorDevCompleto without switching branches.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd();
const files=[
 {file:'theme/architect.ts',rules:[['    pageTop: 8,\n    compactTop: 4,','    pageTop: 4,\n    compactTop: 0,']]},
 {file:'components/BodyPageHeading.tsx',rules:[['    return <View style={[styles.container, style]}>','    return <View style={[styles.container, fixed && styles.withFixedHeader, style]}>'],['    container: { paddingHorizontal: 22 },','    container: { paddingHorizontal: 22 },\n    withFixedHeader: { paddingTop: 0, marginTop: 0 },']]},
 {file:'app/(tabs)/tracking/index.tsx',rules:[['  content:{paddingHorizontal:20,paddingBottom:38},','  content:{paddingHorizontal:20,paddingTop:0,paddingBottom:38,flexGrow:1},'],['  heading:{paddingHorizontal:0,paddingTop:layout.compactTop,paddingBottom:0},','  heading:{paddingHorizontal:0,paddingTop:0,paddingBottom:0},'],['import { colors, layout } from "@/theme/architect";','import { colors } from "@/theme/architect";']]}
];
function fail(message){throw Error(message+'\nNo se modifico ningun archivo.');}
const result=cp.spawnSync('git',['rev-parse','--show-prefix'],{cwd:root,encoding:'utf8'});
if(result.status!==0||result.stdout.trim())fail('Abri Git Bash en la raiz de TreksorDevCompleto.');
const changes=[];
for(const item of files){
 if(!fs.existsSync(item.file))fail('Falta '+item.file);
 const original=fs.readFileSync(item.file),crlf=original.toString('utf8').includes('\r\n');
 let text=original.toString('utf8').replace(/\r\n/g,'\n'),next=text;
 for(const [old,value] of item.rules){
  if(next.includes(old))next=next.replace(old,value);
  else if(!next.includes(value))fail('Version diferente en '+item.file+'. Envia la captura para conservar los cambios locales.');
 }
 if(next!==text)changes.push({file:item.file,original,next:crlf?next.replace(/\n/g,'\r\n'):next});
}
console.log('REVISION DE ESPACIADO: '+changes.length+' archivos por ajustar.');
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se modifico nada.');process.exit(0);}
if(!changes.length){console.log('ESPACIADO YA CORREGIDO.');process.exit(0);}
const backup=fs.mkdtempSync(path.resolve(root,'..','Treksor-spacing-backup-'));
for(const item of changes){const dest=path.join(backup,item.file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,item.original);}
const written=[];
try{
 for(const item of changes){
  if(!fs.readFileSync(item.file).equals(item.original))throw Error('El archivo cambio durante la actualizacion: '+item.file);
  fs.writeFileSync(item.file,item.next);written.push(item);
 }
}catch(error){for(const item of written)fs.writeFileSync(item.file,item.original);throw error;}
console.log('ESPACIADO SUPERIOR COMPACTO APLICADO. Respaldo: '+backup);
