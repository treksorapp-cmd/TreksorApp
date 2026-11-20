'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const file='app/(tabs)/chat/index.tsx';
const git=cp.spawnSync('git',['rev-parse','--show-prefix'],{encoding:'utf8'});
if(git.status!==0||git.stdout.trim())throw Error('Ejecutar desde TreksorDevCompleto');
const original=fs.readFileSync(file,'utf8');let next=original;
const heading='<View style={styles.guideHeading}><Text accessibilityRole="header" style={styles.guideHeadingTitle}>Guide</Text></View>';
const old='<BodyPageHeading title="Guide" trail="GUIDE" goldTitle style={{paddingHorizontal:20,marginBottom:16}}/>';
if(next.includes(old))next=next.replace(old,heading);
else if(!next.includes(heading)){
 const anchor='<StatusBar style="light" />';
 if(!next.includes(anchor))throw Error('Guide no tiene encabezado reconocido. No se modifico nada.');
 next=next.replace(anchor,anchor+'\n      '+heading);
}
next=next.replace('import BodyPageHeading from "@/components/BodyPageHeading";\n','');
const styles='  guideHeading: { paddingHorizontal:20, paddingTop:0, paddingBottom:16 },\n  guideHeadingTitle: { ...type.page, color:colors.gold, includeFontPadding:false },';
if(!next.includes('guideHeadingTitle:')){
 const marker='  container: {';
 if(!next.includes(marker))throw Error('Estilos de Guide no reconocidos. No se modifico nada.');
 next=next.replace(marker,styles+'\n'+marker);
}
if(!next.includes('import { colors, navyOverlay, type } from "@/theme/architect";'))throw Error('Falta el tema Architect; no se modifico nada.');
if(next===original){console.log('GUIDE YA ALINEADO Y DORADO');process.exit(0);}
console.log('GUIDE: correccion compatible');
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se modifico nada.');process.exit(0);}
const backup=fs.mkdtempSync(path.resolve(process.cwd(),'..','Treksor-guide-heading-backup-'));fs.mkdirSync(path.join(backup,'app/(tabs)/chat'),{recursive:true});fs.writeFileSync(path.join(backup,file),original);
fs.writeFileSync(file,next);console.log('GUIDE ALINEADO Y DORADO. Respaldo: '+backup);
