'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const file='app/(tabs)/tracking/index.tsx',root=process.cwd();
const check=cp.spawnSync('git',['rev-parse','--show-prefix'],{encoding:'utf8'});
if(check.status!==0||check.stdout.trim())throw Error('Abrir desde la raiz de TreksorDevCompleto');
const before=fs.readFileSync(file,'utf8'),old='return <SafeAreaView edges={["top"]} style={styles.screen}>',updated='return <SafeAreaView edges={[]} style={styles.screen}>';
if(before.includes(updated)){console.log('PROGRESS: SAFE AREA YA CORREGIDA');process.exit(0);}
if(!before.includes(old)||!before.includes('YOUR RHYTHM')||!before.includes('JourneyDashboard'))throw Error('Version Progress no compatible; ningun archivo modificado');
console.log('PROGRESS: Correccion de doble espacio superior compatible');
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se modifico nada.');process.exit(0);}
const folder=fs.mkdtempSync(path.resolve(root,'..','Treksor-progress-insets-backup-'));fs.mkdirSync(path.join(folder,'app/(tabs)/tracking'),{recursive:true});fs.copyFileSync(file,path.join(folder,file));
fs.writeFileSync(file,before.replace(old,updated));console.log('PROGRESS: safe-area ajustada. Respaldo: '+folder);
