#!/usr/bin/env node
// Non-destructive primary-heading alignment for the consolidated local Treksor tree.
const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=process.cwd();
if(!fs.existsSync(path.join(root,'app','(tabs)','chat','index.tsx')))throw Error('Ejecuta desde ~/TreksorDevCompleto.');
const specs=[
{file:'app/(tabs)/chat/index.tsx', rules:[
[/guideHeading:\s*\{[^}]*\}/,s=>s.replace(/paddingBottom:\s*\d+/,'paddingBottom:2')],
[/guideHeadingTitle:\s*\{[^}]*\}/,s=>s.replace(/color:\s*[^,}]+/,'color:colors.gold')],
[/welcomeAI:\s*\{[^}]*\}/,s=>s.replace(/marginTop:\s*\d+/,'marginTop:8')]
]},
{file:'app/(tabs)/tracking/index.tsx',rules:[
[/heading:\s*\{[^}]*\}/,s=>s.replace(/marginBottom:\s*\d+/,'marginBottom:8')]
]},
{file:'app/(tabs)/community/index.tsx',rules:[
[/<BodyPageHeading[^\n]*title="Community"[^\n]*\/>/,s=>s.replace(/marginBottom:\s*\d+/,'marginBottom:0')],
[/<Text style=\{\[type\.body,\{marginTop:[^\n]*?<\/Text>/,s=>s.replace(/marginTop:\s*\d+/,'marginTop:2').replace(/marginBottom:\s*\d+/,'marginBottom:12')]
]},
{file:'components/BodyPageHeading.tsx',rules:[
[/compactSubtitle:\s*\{[^}]*\}/,s=>s.includes('includeFontPadding')?s:s.replace(/\}\s*$/,' ,includeFontPadding:false }')]
]}
];
const pending=[];
for(const spec of specs){
 const file=path.join(root,spec.file);
 if(!fs.existsSync(file))throw Error('Falta archivo: '+spec.file);
 const original=fs.readFileSync(file,'utf8');let next=original;
 for(const [regex,change] of spec.rules){
  const m=next.match(regex);
  if(!m)throw Error('Formato local distinto en '+spec.file+'. No se modifico ningun archivo.');
  const replacement=change(m[0]);if(replacement===m[0])continue;
  next=next.replace(regex,replacement);
 }
 if(next!==original)pending.push({file,relative:spec.file,original,next});
}
if(!pending.length){console.log('TITULOS: ya compatibles; ningun cambio necesario.');process.exit(0)}
if(process.argv.includes('--check')){console.log('Revision OK: '+pending.map(x=>x.relative).join(', '));process.exit(0)}
const backup=path.resolve(root,'..','Treksor-headings-backup-'+Date.now());
for(const item of pending){const dest=path.join(backup,item.relative);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,item.original)}
for(const item of pending){fs.writeFileSync(item.file,item.next);console.log('CORREGIDO: '+item.relative)}
console.log('TITULOS UNIFICADOS. Respaldo: '+backup);
console.log('Expo: recarga el iPhone conectado. Si dice No apps connected, escanea el QR.');
