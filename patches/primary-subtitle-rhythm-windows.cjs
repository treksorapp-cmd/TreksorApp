'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const rules=[{"file":"app/(tabs)/chat/index.tsx","pairs":[["guideHeading: { paddingHorizontal:20, paddingTop:0, paddingBottom:16 }","guideHeading: { paddingHorizontal:20, paddingTop:0, paddingBottom:6 }"]]},{"file":"app/(tabs)/tracking/index.tsx","pairs":[["style={styles.heading}/>","style={styles.heading} compactSubtitle/>"],["heading:{paddingHorizontal:0,paddingTop:0,paddingBottom:0,marginBottom:16}","heading:{paddingHorizontal:0,paddingTop:0,paddingBottom:0,marginBottom:10}"]]},{"file":"app/(tabs)/community/index.tsx","pairs":[["title=\"Community\" goldTitle style={{marginHorizontal:-20,marginTop:0,marginBottom:16}}","title=\"Community\" goldTitle style={{marginHorizontal:-20,marginTop:0,marginBottom:2}}"],["style={[type.body,{marginTop:0,marginBottom:20}]}","style={[type.body,{marginTop:0,marginBottom:16,lineHeight:20}]}"]]},{"file":"components/BodyPageHeading.tsx","pairs":[["    goldTitle?: boolean;","    goldTitle?: boolean;\n    compactSubtitle?: boolean;"],["style, goldTitle=false }: Props)","style, goldTitle=false, compactSubtitle=false }: Props)"],["<Text style={styles.subtitle}>{subtitle}</Text>","<Text style={[styles.subtitle,compactSubtitle&&styles.compactSubtitle]}>{subtitle}</Text>"],["    goldTitle: { color: colors.gold },","    goldTitle: { color: colors.gold },\n    compactSubtitle: { marginTop:2, lineHeight:20 },"]]},{"file":"components/mentor/MentorCompanion.tsx","pairs":[["outer:{paddingHorizontal:20,paddingTop:0,paddingBottom:12}","outer:{paddingHorizontal:20,paddingTop:0,paddingBottom:6}"]]}];
const git=cp.spawnSync('git',['rev-parse','--show-prefix'],{encoding:'utf8'});
if(git.status!==0||git.stdout.trim())throw Error('Ejecutar desde TreksorDevCompleto');
const changes=[];
for(const {file,pairs} of rules){
 const original=fs.readFileSync(file,'utf8');let next=original;
 for(const [old,updated] of pairs){if(next.includes(updated))continue;if(!next.includes(old))throw Error('Version incompatible en '+file+'. No se modifico nada.');next=next.replace(old,updated);}
 if(next!==original)changes.push({file,original,next});
}
console.log('RITMO VERTICAL: '+changes.length+' archivos por ajustar.');
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se modifico nada.');process.exit(0);}
if(!changes.length){console.log('YA ACTUALIZADO');process.exit(0);}
const backup=fs.mkdtempSync(path.resolve(process.cwd(),'..','Treksor-vertical-rhythm-backup-'));
for(const {file,original} of changes){const dest=path.join(backup,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,original);}
const written=[];
try{for(const {file,original,next} of changes){if(fs.readFileSync(file,'utf8')!==original)throw Error('Archivo cambio durante la actualizacion: '+file);fs.writeFileSync(file,next);written.push({file,original});}}
catch(e){for(const {file,original} of written)fs.writeFileSync(file,original);throw e;}
console.log('ESPACIADO GUIDE PROGRESS COMMUNITY ACTUALIZADO. Respaldo: '+backup);
