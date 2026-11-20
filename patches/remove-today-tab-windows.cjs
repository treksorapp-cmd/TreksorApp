'use strict';
// Treksor V1.5 — permanently remove Today from the bottom tabs.
// Progress stays untouched. Old /today links redirect to Progress outside tabs.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd(),tabs='app/(tabs)/_layout.tsx',legacy='app/(tabs)/today/index.tsx',alias='app/today.tsx',progress='app/(tabs)/tracking/index.tsx';
const aliasContent='import { Redirect } from "expo-router";\n\n/** Legacy /today links stay valid, but Today is no longer a tab. */\nexport default function LegacyTodayRedirect() {\n  return <Redirect href="/(tabs)/tracking" />;\n}\n';
function fail(reason){throw Error(reason+' No se modifico ningun archivo.');}
let top;try{top=cp.execFileSync('git',['rev-parse','--show-toplevel'],{cwd:root,encoding:'utf8'}).trim();}catch{fail('Ejecuta desde TreksorDevCompleto.');}
if(path.resolve(top)!==path.resolve(root))fail('Ejecuta desde la raiz de TreksorDevCompleto.');
if(!fs.existsSync(tabs)||!fs.existsSync(progress))fail('Falta la navegacion o la pantalla Progress.');
if(!fs.readFileSync(progress,'utf8').includes('<DailyWork embedded/>'))
 fail('Progress aun no contiene Daily Work. No se oculta Today hasta tener las funciones unificadas.');
const raw=fs.readFileSync(tabs),original=raw.toString('utf8'),crlf=original.includes('\r\n');
let next=original.replace(/\r\n/g,'\n');
const known=[
 '<Tabs.Screen name="today/index" options={{href:null}} />',
 '<Tabs.Screen name="today" options={{href:null}} />',
 '<Tabs.Screen name="today" options={{title:"Today",tabBarIcon:({color})=><View style={styles.iconContainer}><Ionicons name="today-outline" size={23} color={color}/></View>}} />'
];
const present=known.filter(entry=>next.includes(entry));
if(present.length>1)fail('Hay multiples configuraciones de Today; no se altero ninguna.');
if(present.length===1) {
 next=next.replace(present[0],'');
 next=next.replace(/\n[ \t]*\{\/\* Legacy Today links redirect into the unified Progress screen\. \*\/\}/,'');
 next=next.replace(/\n[ \t]+(?=\n)/g,'\n').replace(/\n{3,}/g,'\n\n');
}
if(/<Tabs\.Screen[^>]*name=["']today(?:\/index)?["']/.test(next))
 fail('Existe una configuracion de Today desconocida. No se reemplazara a ciegas.');
if(!/name="tracking"/.test(next)||!(/name="home"/.test(next)&&/name="chat"/.test(next)&&/name="community"/.test(next)))
 fail('La barra principal no tiene las cuatro rutas esperadas.');
const legacyRaw=fs.existsSync(legacy)?fs.readFileSync(legacy):null;
if(legacyRaw) {
 const src=legacyRaw.toString('utf8');
 if(!src.includes('Redirect href="/(tabs)/tracking"'))
  fail('Today contiene cambios locales o una pantalla anterior. No se eliminara ese codigo.');
 const dir=fs.readdirSync(path.dirname(legacy));
 if(dir.some(file=>file!=='index.tsx'))fail('La carpeta de Today contiene otros archivos. No se borraran.');
}
const aliasRaw=fs.existsSync(alias)?fs.readFileSync(alias):null;
if(aliasRaw&&aliasRaw.toString('utf8').replace(/\r\n/g,'\n').trim()!==aliasContent.trim())
 fail('Ya existe una ruta /today personalizada. No se reemplazara.');
next=crlf?next.replace(/\n/g,'\r\n'):next;
const changed=next!==original,remove=!!legacyRaw,add=!aliasRaw;
console.log('TREKSOR: solo cuatro pestañas visibles — Home, Guide, Progress, Community.');
console.log('Cambios: '+Number(changed)+' navegacion, '+Number(remove)+' pantalla Today retirada, '+Number(add)+' enlace heredado creado.');
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se modifico nada.');process.exit(0);}
if(!changed&&!remove&&!add){console.log('CUATRO PESTANAS YA CONFIGURADAS.');process.exit(0);}
const backup=fs.mkdtempSync(path.resolve(root,'..','Treksor-four-tabs-backup-'));
fs.mkdirSync(path.join(backup,path.dirname(tabs)),{recursive:true});
fs.writeFileSync(path.join(backup,tabs),raw);
if(legacyRaw){fs.mkdirSync(path.join(backup,path.dirname(legacy)),{recursive:true});fs.writeFileSync(path.join(backup,legacy),legacyRaw);}
const written=[];
try {
 if(add){if(fs.existsSync(alias))throw Error('La ruta /today cambio durante la actualizacion.');fs.writeFileSync(alias,aliasContent);written.push(alias);}
 if(changed){if(!fs.readFileSync(tabs).equals(raw))throw Error('La navegacion cambio durante la actualizacion.');fs.writeFileSync(tabs,next);written.push(tabs);}
 if(remove){if(!fs.readFileSync(legacy).equals(legacyRaw))throw Error('Today cambio durante la actualizacion.');fs.unlinkSync(legacy);written.push(legacy);}
}catch(error){
 for(const file of written.reverse()){
  if(file===legacy&&legacyRaw)fs.writeFileSync(legacy,legacyRaw);
  if(file===tabs)fs.writeFileSync(tabs,raw);
  if(file===alias)fs.unlinkSync(alias);
 }
 throw error;
}
console.log('TODAY ELIMINADO DEL MENU. PROGRESS UNIFICADO CONSERVADO.');
console.log('Respaldo: '+backup);
console.log('Cierra TODOS los servidores Expo anteriores y reinicia Metro con --clear.');
