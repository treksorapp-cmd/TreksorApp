'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const file='app/(tabs)/home/index.tsx',pairs=[["accessibilityLabel=\"Open Today daily practice\"","accessibilityLabel=\"Open daily practice in Progress\""],["router.push(\"/(tabs)/today\" as Href)","router.push(\"/(tabs)/tracking\" as Href)"],["<Text style={styles.todayShortcutTitle}>Today</Text>","<Text style={styles.todayShortcutTitle}>Daily practice</Text>"],["<Text style={styles.todayShortcutHint}>One priority. Three small actions.</Text>","<Text style={styles.todayShortcutHint}>Activities, habits and daily direction in Progress</Text>"]];
const git=cp.spawnSync('git',['rev-parse','--show-prefix'],{encoding:'utf8'});
if(git.status!==0||git.stdout.trim())throw Error('Ejecutar desde TreksorDevCompleto');
const original=fs.readFileSync(file,'utf8');let next=original;
for(const [old,updated] of pairs){if(next.includes(updated))continue;if(!next.includes(old))throw Error('Home incompatible. No se modifico nada: '+old);next=next.replace(old,updated);}
if(next===original){console.log('HOME DAILY PRACTICE YA CORREGIDO');process.exit(0);}
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se modifico nada.');process.exit(0);}
const backup=fs.mkdtempSync(path.resolve(process.cwd(),'..','Treksor-home-today-backup-'));const dest=path.join(backup,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,original);fs.writeFileSync(file,next);
console.log('HOME TODAY REPARADO: abre Progress. Respaldo: '+backup);
