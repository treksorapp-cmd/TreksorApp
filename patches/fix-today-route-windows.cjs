'use strict';
// Fix only Expo Router's hidden legacy Today route. Safe to rerun.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd(),file='app/(tabs)/_layout.tsx';
const a='<Tabs.Screen name="today" options={{href:null}} />';
const b='<Tabs.Screen name="today/index" options={{href:null}} />';
function fail(msg){throw Error(msg+' No se modifico ningun archivo.');}
if(!fs.existsSync(file))fail('No se encontro el layout de Treksor.');
let top;
try{top=cp.execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8',cwd:root}).trim();}catch{fail('Abrir desde la carpeta TreksorDevCompleto.');}
if(path.resolve(root)!==path.resolve(top))fail('Abrir desde la raiz del proyecto.');
const old=fs.readFileSync(file,'utf8');
if(old.includes(b)){
 console.log('NAVEGACION TODAY/PROGRESS YA CORREGIDA.');
 process.exit(0);
}
if(old.split(a).length!==2)fail('La version local usa otra navegacion. No se reemplazo.');
const next=old.replace(a,b);
const backup=path.resolve(root,'..','Treksor-tabs-backup-'+Date.now()+'.tsx');
if(process.argv.includes('--check')){
 console.log('COMPATIBLE: solo se corregira el nombre de la ruta Today oculta.');
 process.exit(0);
}
fs.writeFileSync(backup,old);
if(fs.readFileSync(file,'utf8')!==old)fail('La pantalla se modifico mientras se preparaba el respaldo.');
try{fs.writeFileSync(file,next);}
catch(e){fs.writeFileSync(file,old);throw e;}
console.log('NAVEGACION TODAY/PROGRESS CORREGIDA.');
console.log('Respaldo:',backup);
console.log('No se perdieron datos ni se modificaron otras pantallas.');
