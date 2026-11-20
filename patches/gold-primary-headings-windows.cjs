'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const rules=[{"file":"components/BodyPageHeading.tsx","pairs":[["    style?: StyleProp<ViewStyle>;","    style?: StyleProp<ViewStyle>;\n    goldTitle?: boolean;"],["export default function BodyPageHeading({ title, trail, subtitle, pillar, navigation, onBack, style }: Props)","export default function BodyPageHeading({ title, trail, subtitle, pillar, navigation, onBack, style, goldTitle=false }: Props)"],["style={styles.title}>{displayLabel(title)}","style={[styles.title,goldTitle&&styles.goldTitle]}>{displayLabel(title)}"],["    withFixedHeader: { paddingTop: 0, marginTop: 0 },","    withFixedHeader: { paddingTop: 0, marginTop: 0 },\n    goldTitle: { color: colors.gold },"]]},{"file":"app/(tabs)/tracking/index.tsx","pairs":[["trail=\"YOUR JOURNEY\" title=\"Progress\"","trail=\"YOUR JOURNEY\" title=\"Progress\" goldTitle"],["heading:{paddingHorizontal:0,paddingTop:0,paddingBottom:0}","heading:{paddingHorizontal:0,paddingTop:0,paddingBottom:0,marginBottom:16}"],["padding:17,marginTop:17,gap:12","padding:17,marginTop:0,gap:12"]]},{"file":"app/(tabs)/community/index.tsx","pairs":[["title=\"Community\" style={{marginHorizontal:-20,marginTop:0}}","title=\"Community\" goldTitle style={{marginHorizontal:-20,marginTop:0,marginBottom:16}}"],["style={[type.body,{marginTop:10,marginBottom:20}]}","style={[type.body,{marginTop:0,marginBottom:20}]}"]]},{"file":"app/(tabs)/chat/index.tsx","pairs":[["import { colors, navyOverlay, type } from \"@/theme/architect\";","import { colors, navyOverlay, type } from \"@/theme/architect\";\nimport BodyPageHeading from \"@/components/BodyPageHeading\";"],["      {/* Single Chat title is provided by the tab navigation. */}","      <BodyPageHeading title=\"Guide\" trail=\"GUIDE\" goldTitle style={{paddingHorizontal:20,marginBottom:16}}/>"],["    padding: 20,\n    gap: 16,","    paddingHorizontal: 20,\n    paddingBottom: 20,\n    paddingTop: 0,\n    gap: 16,"]]},{"file":"components/mentor/MentorCompanion.tsx","pairs":[["outer:{paddingHorizontal:20,paddingTop:16,paddingBottom:12}","outer:{paddingHorizontal:20,paddingTop:0,paddingBottom:12}"]]}];
const git=cp.spawnSync('git',['rev-parse','--show-prefix'],{encoding:'utf8'});
if(git.status!==0||git.stdout.trim())throw Error('Ejecutar desde TreksorDevCompleto');
const changes=[];
for(const {file,pairs} of rules){
 const original=fs.readFileSync(file,'utf8');let next=original;
 if(file==='app/(tabs)/chat/index.tsx'){
  // Guide has several locally consolidated versions. Preserve its chat logic and
  // only add the heading at the known stable root when safe.
  if(!next.includes('import BodyPageHeading from "@/components/BodyPageHeading";')){
   const match=next.match(/^import [^\n]+\n/m);
   if(!match)throw Error('Guide sin imports reconocibles; no se modifico nada.');
   next=next.replace(match[0],match[0]+'import BodyPageHeading from "@/components/BodyPageHeading";\n');
  }
  if(!next.includes('<BodyPageHeading title="Guide"')){
   const anchor='<StatusBar style="light" />';
   if(!next.includes(anchor))throw Error('Guide sin ancla de pantalla segura; no se modifico nada.');
   next=next.replace(anchor,anchor+'\n      <BodyPageHeading title="Guide" trail="GUIDE" goldTitle style={{paddingHorizontal:20,marginBottom:16}}/>');
  }
  // Do not touch the local chat messages layout or Mentor logic.
 }else{
  for(const [old,updated] of pairs){if(next.includes(updated))continue;if(!next.includes(old))throw Error('Version incompatible en '+file+'. No se modifico nada.');next=next.replace(old,updated);}
 }
 if(next!==original)changes.push({file,original,next});
}
console.log('TITULOS DORADOS: '+changes.length+' archivos por actualizar.');
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se modifico nada.');process.exit(0);}
if(!changes.length){console.log('YA ACTUALIZADO');process.exit(0);}
const backup=fs.mkdtempSync(path.resolve(process.cwd(),'..','Treksor-gold-headings-backup-'));
for(const {file,original} of changes){const dest=path.join(backup,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,original);}
const written=[];
try{for(const {file,original,next} of changes){if(fs.readFileSync(file,'utf8')!==original)throw Error('Archivo cambio durante la actualizacion: '+file);fs.writeFileSync(file,next);written.push({file,original});}}
catch(e){for(const {file,original} of written)fs.writeFileSync(file,original);throw e;}
console.log('TITULOS DORADOS Y ESPACIADO ACTUALIZADOS. Respaldo: '+backup);
