'use strict';
// Treksor V1.2 — local, guarded adjustment. Does not pull, merge or reinstall.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const root = process.cwd();
const fail = message => { throw new Error(message + ' No se modifico nada.'); };
const git = args => cp.execFileSync('git', args, {cwd:root,encoding:'utf8'}).trim();
if (path.resolve(git(['rev-parse','--show-toplevel'])) !== path.resolve(root)) fail('Ejecuta desde ~/TreksorApp.');
try {
  cp.execFileSync('git', ['rev-parse','-q','--verify','MERGE_HEAD'], {cwd:root,stdio:'ignore'});
  fail('Hay un merge pendiente.');
} catch (e) {
  if (!String(e.message || '').includes('Command failed') && !e.status && !e.signal) throw e;
}
// Only edit the three requested files in the current working tree.
const files = ['theme/architect.ts','components/AppFrame.tsx','app/(tabs)/home/index.tsx'];
const data = new Map();
for (const file of files) {
  if (!fs.existsSync(file)) fail('Falta ' + file + '.');
  const bytes = fs.readFileSync(file);
  const raw = bytes.toString('utf8');
  data.set(file,{bytes,raw,eol:raw.includes('\r\n')?'\r\n':'\n'});
}
function applyTheme(s) {
  if (!s.includes("appearance: 'navy' | 'midnight' = 'navy'") &&
      !s.includes("appearance: 'navy' | 'midnight' = 'midnight'"))
    fail('No se reconocio la paleta de Treksor.');
  if (!s.includes("midnight: { background: '#05080D', surface: '#0B1017', surfaceRaised: '#121922' }"))
    fail('Falta la paleta original; no se tocara.');
  return s
    .replace("appearance: 'navy' | 'midnight' = 'navy'", "appearance: 'navy' | 'midnight' = 'midnight'")
    .replace('rgba(175,201,235,0.18)', 'rgba(245,244,241,0.10)')
    .replace('rgba(175,201,235,0.06)', 'rgba(245,244,241,0.045)');
}
function applyFrame(s) {
  const pickerOld = "picker:{flexDirection:'row',paddingHorizontal:16,paddingBottom:12,gap:8}";
  const pickerNew = "picker:{position:'absolute',top:'100%',left:12,right:12,zIndex:20,flexDirection:'row',padding:10,gap:8,backgroundColor:colors.background,borderWidth:1,borderColor:colors.border,borderRadius:14,elevation:12}";
  const chromeOld = "chrome:{backgroundColor:colors.background,borderBottomWidth:1,borderBottomColor:colors.border}";
  const chromeNew = "chrome:{backgroundColor:colors.background,borderBottomWidth:1,borderBottomColor:colors.border,zIndex:10,elevation:10}";
  if (!s.includes(pickerOld) && !s.includes(pickerNew)) fail('El selector de pilares ya no coincide con la version compatible.');
  if (!s.includes(chromeOld) && !s.includes(chromeNew)) fail('La barra fija ya no coincide con la version compatible.');
  if (!s.includes('bar:{paddingHorizontal:16,paddingVertical:10,') &&
      !s.includes('bar:{paddingHorizontal:16,paddingVertical:6,'))
    fail('No se reconocio el espacio de la barra fija.');
  return s.replace(pickerOld,pickerNew)
    .replace(chromeOld,chromeNew)
    .replace('bar:{paddingHorizontal:16,paddingVertical:10,','bar:{paddingHorizontal:16,paddingVertical:6,');
}
function applyHome(s) {
  const topOld=/(\btop:\s*\{[^\n{}]*\bmarginBottom:\s*)15\b/;
  const topDone=/(\btop:\s*\{[^\n{}]*\bmarginBottom:\s*)4\b/;
  const padOld=/(\bcontent:\s*\{[^\n{}]*\bpaddingTop:\s*)13\b/;
  const padDone=/(\bcontent:\s*\{[^\n{}]*\bpaddingTop:\s*)7\b/;
  if (!topOld.test(s)&&!topDone.test(s)) fail('El encabezado de Home es diferente.');
  if (!padOld.test(s)&&!padDone.test(s)) fail('El contenedor de Home es diferente.');
  return s.replace(topOld,(_,prefix)=>prefix+'4').replace(padOld,(_,prefix)=>prefix+'7');
}
const transforms = [applyTheme,applyFrame,applyHome];
const staged = new Map();
for (let i=0;i<files.length;i++) {
  const f=files[i],v=data.get(f);
  const normalized=v.raw.replace(/\r\n/g,'\n');
  const revised=transforms[i](normalized).replace(/\n/g,v.eol);
  if (revised !== v.raw) staged.set(f,revised);
}
if (!staged.size) {
  console.log('ESTOS TRES AJUSTES YA ESTAN APLICADOS; no se modifico nada.');
  process.exit(0);
}
const ts = require(require.resolve('typescript',{paths:[root]}));
for (const [f,next] of staged) {
  const oldErrors=ts.createSourceFile(f,data.get(f).raw,ts.ScriptTarget.Latest,true).parseDiagnostics.length;
  const newErrors=ts.createSourceFile(f,next,ts.ScriptTarget.Latest,true).parseDiagnostics.length;
  if (newErrors>oldErrors) fail('Se detecto un error de sintaxis nuevo en '+f+'.');
}
if (process.argv.includes('--check')) {
  console.log('COMPATIBLE. Se pueden ajustar '+staged.size+' archivos, sin escribir nada.');
  process.exit(0);
}
const backup = fs.mkdtempSync(path.join(path.dirname(root),'Treksor-v12-architect-backup-'));
const manifest=[];
for (const [file,next] of staged) {
  const copy=path.join(backup,file);
  fs.mkdirSync(path.dirname(copy),{recursive:true});
  fs.writeFileSync(copy,data.get(file).bytes);
  manifest.push({file,before:crypto.createHash('sha256').update(data.get(file).bytes).digest('hex')});
}
fs.writeFileSync(path.join(backup,'manifest.json'),JSON.stringify({timestamp:new Date().toISOString(),files:manifest},null,2));
const written=[];
try {
  for (const [file,next] of staged) {
    if (!fs.readFileSync(file).equals(data.get(file).bytes)) throw Error('El archivo cambio mientras se preparaba: '+file);
    written.push(file);
    fs.writeFileSync(file,next);
  }
} catch (e) {
  for (const f of written) fs.writeFileSync(f,data.get(f).bytes);
  throw e;
}
console.log('AJUSTES V1.2 APLICADOS: negro original, selector flotante y Home compacto.');
console.log('Archivos cambiados: '+[...staged.keys()].join(', '));
console.log('Respaldo local: '+backup);
console.log('No se tocaron caminatas, dependencias, Expo, otras pantallas, ramas ni GitHub develop.');
