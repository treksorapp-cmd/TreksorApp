'use strict';
// Small reversible Community change for Treksor Windows / Git Bash.
// Caller must fetch the reviewed branch first. No checkout, merge or reinstall.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd(),page='app/(tabs)/community/index.tsx',helper='lib/community-weekly-question.ts';
const abort=msg=>{throw Error(msg+' No se modifico nada.');};
const git=args=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trimEnd();
if(path.resolve(git(['rev-parse','--show-toplevel']))!==path.resolve(root))abort('Ejecutar dentro de TreksorApp.');
if(cp.spawnSync('git',['rev-parse','-q','--verify','MERGE_HEAD'],{cwd:root,stdio:'ignore'}).status===0)abort('Merge sin resolver.');
if(!fs.existsSync(page))abort('No se encontro Community.');
let moduleSource;
try{moduleSource=git(['show','FETCH_HEAD:'+helper])+'\n';}
catch{abort('No se encontro la rama descargada. Ejecuta primero git fetch.');}
if(!moduleSource.includes('COMMUNITY_WEEKLY_QUESTIONS')||!moduleSource.includes('MONDAY_ANCHOR'))
 abort('La rama descargada no contiene las dos preguntas correctas.');
const original=fs.readFileSync(page),raw=original.toString('utf8'),eol=raw.includes('\r\n')?'\r\n':'\n';
let next=raw.replace(/\r\n/g,'\n');
if(!next.includes('setInterval(()=>setNow(Date.now()),60000)')||!next.includes('accessibilityLabel="City and country"'))
 abort('La pantalla Community es diferente.');
const substitutions=[
  [
    "import {cleanPlace,localActivityUrl,upcomingEvents,communityRoute} from '@/lib/community-location';",
    "import {cleanPlace,localActivityUrl,upcomingEvents,communityRoute} from '@/lib/community-location';\nimport {communityQuestionForWeek} from '@/lib/community-weekly-question';"
  ],
  [
    ' <View style={s.searchCard}><Text style={type.eyebrow}>WHERE WOULD YOU LIKE TO CONNECT?</Text><Text style={[type.card,{marginVertical:8}]}>Your city. Or your next destination.</Text>',
    ' <View style={s.searchCard}>\n  <Text style={type.eyebrow}>THIS WEEK\'S INVITATION</Text>\n  <Text accessibilityRole="header" style={s.weeklyQuestion}>{communityQuestionForWeek(new Date(now))}</Text>\n  <Text style={s.searchHint}>Choose your city or next destination to explore what is happening nearby.</Text>'
  ],
  [
    'searchCard:{...surface.card,gap:6},card:{...surface.card,gap:10,marginVertical:12}',
    'searchCard:{...surface.card,gap:6},weeklyQuestion:{...type.section,fontSize:21,lineHeight:29,marginTop:5,marginBottom:5},searchHint:{...type.caption,fontSize:12,lineHeight:19,marginBottom:12},card:{...surface.card,gap:10,marginVertical:12}'
  ]
];
for(const [from,to] of substitutions){
 if(next.includes(to))continue;
 if(!next.includes(from)||next.indexOf(from)!==next.lastIndexOf(from))abort('El buscador local tiene un formato distinto.');
 next=next.replace(from,to);
}
const ts=require(require.resolve('typescript',{paths:[root]}));
const before=ts.createSourceFile(page,raw,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const after=ts.createSourceFile(page,next,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const moduleAST=ts.createSourceFile(helper,moduleSource,ts.ScriptTarget.Latest,true);
if(after.parseDiagnostics.length>before.parseDiagnostics.length||moduleAST.parseDiagnostics.length)
 abort('La nueva interfaz presenta errores de sintaxis.');
next=next.replace(/\n/g,eol);
const savedModule=fs.existsSync(helper)?fs.readFileSync(helper):null;
if(savedModule&&savedModule.toString('utf8').replace(/\r\n/g,'\n').trimEnd()!==moduleSource.trimEnd())
 abort('Ya existe una version personalizada del modulo semanal.');
const updateScreen=next!==raw,createModule=!savedModule;
console.log('Community: '+Number(updateScreen)+' pantalla y '+Number(createModule)+' modulo para actualizar.');
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se modifico nada.');process.exit(0);}
if(!updateScreen&&!createModule){console.log('PREGUNTA SEMANAL YA APLICADA.');process.exit(0);}
const backup=fs.mkdtempSync(path.join(path.dirname(root),'Treksor-community-backup-'));
const dest=path.join(backup,page);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,original);
const written=[];
try{
 if(createModule){if(fs.existsSync(helper))throw Error('El modulo cambio durante la comprobacion.');fs.writeFileSync(helper,moduleSource);written.push(helper);}
 if(updateScreen){if(!fs.readFileSync(page).equals(original))throw Error('Community cambio durante la comprobacion.');fs.writeFileSync(page,next);written.push(page);}
}catch(error){
 if(written.includes(page))fs.writeFileSync(page,original);
 if(written.includes(helper))fs.unlinkSync(helper);
 throw error;
}
console.log('COMMUNITY SEMANAL ACTUALIZADO. Respaldo: '+backup);
console.log('Se conservo el buscador, los permisos y las opciones de Community.');
