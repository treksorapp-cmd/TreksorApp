'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const file='app/notes/index.tsx';
const root=cp.spawnSync('git',['rev-parse','--show-prefix'],{encoding:'utf8'});
if(root.status!==0||root.stdout.trim())throw Error('Ejecutar desde TreksorDevCompleto');
const before=fs.readFileSync(file,'utf8');
const old=String.raw`!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)||!/^([01]\\d|2[0-3]):[0-5]\\d$/.test(time)`;
const nextPattern=String.raw`!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)`;
if(before.includes(nextPattern)){console.log('QUICK NOTES: fecha y hora ya corregidas');process.exit(0);}
if(!before.includes(old)||!before.includes('const parseReminder='))throw Error('Quick Notes no coincide con version revisada; no se modifico nada');
console.log('QUICK NOTES: validacion de fecha/hora compatible');
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se modifico nada.');process.exit(0);}
const folder=fs.mkdtempSync(path.resolve(process.cwd(),'..','Treksor-notes-backup-'));fs.mkdirSync(path.join(folder,'app/notes'),{recursive:true});fs.copyFileSync(file,path.join(folder,file));
fs.writeFileSync(file,before.replace(old,nextPattern));console.log('QUICK NOTES CORREGIDO. Respaldo: '+folder);
