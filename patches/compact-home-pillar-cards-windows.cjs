'use strict';
// Treksor V1.2: compact landscape pillar cards in Home only.
// Does not switch branches, alter native builds, content, or user data.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd(),file='app/(tabs)/home/index.tsx';
const abort=msg=>{throw Error(msg+' No se modifico nada.')};
const top=cp.execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();
if(path.resolve(top)!==path.resolve(root))abort('Ejecuta este comando desde TreksorApp.');
if(cp.spawnSync('git',['rev-parse','-q','--verify','MERGE_HEAD'],{cwd:root,stdio:'ignore'}).status===0)abort('Hay un merge de Git pendiente.');
if(!fs.existsSync(file))abort('No se encontro Home.');
const bytes=fs.readFileSync(file),raw=bytes.toString('utf8'),eol=raw.includes('\r\n')?'\r\n':'\n';
let source=raw.replace(/\r\n/g,'\n');
const updates=[
  [
    '  const pillarStep=pillarCardWidth+PILLAR_GAP;',
    '  // Panoramic editorial cards: keep the entire pillar identity visible without\n'+
    '  // making visitors scroll through a tall portrait card.\n'+
    '  // Additional height preserves readability at larger accessibility text sizes.\n'+
    '  const pillarCardHeight=Math.max(204,Math.round(pillarCardWidth*0.60))+Math.max(0,Math.ceil((fontScale-1)*88));\n'+
    '  const pillarStep=pillarCardWidth+PILLAR_GAP;'
  ],
  [
    'style={[styles.pillarSlide,{minHeight:Math.max(390,260*fontScale)}]}',
    'style={[styles.pillarSlide,{minHeight:pillarCardHeight}]}'
  ],
  [
    '<LinearGradient colors={[navyOverlay(0.08),navyOverlay(0.3),navyOverlay(0.96)]} locations={[0,0.42,1]} style={StyleSheet.absoluteFill}/>',
    '<LinearGradient colors={[navyOverlay(0.04),navyOverlay(0.32),navyOverlay(0.98)]} locations={[0,0.32,1]} style={StyleSheet.absoluteFill}/>'
  ],
  [
    'pillarSlide:{flex:1,borderRadius:20,overflow:"hidden",backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border}',
    'pillarSlide:{flex:1,borderRadius:18,overflow:"hidden",backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border}'
  ],
  [
    'slideTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",padding:18}',
    'slideTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingHorizontal:16,paddingTop:14}'
  ],
  [
    'pillarIcon:{width:42,height:42,borderRadius:13,alignItems:"center",justifyContent:"center",backgroundColor:navyOverlay(0.58),borderWidth:1,borderColor:colors.border}',
    'pillarIcon:{width:36,height:36,borderRadius:12,alignItems:"center",justifyContent:"center",backgroundColor:navyOverlay(0.58),borderWidth:1,borderColor:colors.border}'
  ],
  [
    'slideBottom:{flex:1,justifyContent:"flex-end",padding:22}',
    'slideBottom:{flex:1,justifyContent:"flex-end",paddingHorizontal:18,paddingBottom:14,paddingTop:12}'
  ],
  [
    'slideTitle:{color:colors.text,fontSize:32,lineHeight:38,fontWeight:"600",letterSpacing:-0.5}',
    'slideTitle:{color:colors.text,fontSize:26,lineHeight:32,fontWeight:"600",letterSpacing:-0.5}'
  ],
  [
    'slideCaption:{color:"#D2CDC4",fontSize:14,lineHeight:21,marginTop:6}',
    'slideCaption:{color:"#E5DED2",fontSize:12,lineHeight:17,marginTop:3}'
  ],
  [
    'slideAction:{marginTop:20,paddingTop:16,borderTopWidth:1,borderTopColor:colors.border,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}',
    'slideAction:{marginTop:9,paddingTop:9,borderTopWidth:1,borderTopColor:colors.border,flexDirection:"row",alignItems:"center",justifyContent:"space-between"}'
  ],
  [
    'sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 17 }',
    'sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }'
  ]
];
if(!source.includes("const PILLAR_PEEK = 32;")||!source.includes('data={pillars}')||!source.includes('keyExtractor={pillar=>pillar.name}'))abort('La galeria de pilares tiene un formato diferente.');
let count=0;
for(const [from,to] of updates){
  if(source.includes(to))continue;
  const i=source.indexOf(from);
  if(i<0)abort('Version de Home no compatible. Ajuste '+(count+1)+' no reconocido.');
  if(source.indexOf(from,i+from.length)>=0)abort('La misma regla aparece varias veces; cancelado.');
  source=source.replace(from,to);count++;
}
if(!source.includes('minHeight:pillarCardHeight')||!source.includes('pillarCardHeight=Math.max(204,'))abort('El formato horizontal no quedo consistente.');
const ts=require(require.resolve('typescript',{paths:[root]}));
const before=ts.createSourceFile(file,raw,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const after=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
if(after.parseDiagnostics.length>before.parseDiagnostics.length)abort('Se detecto un error de sintaxis en Home.');
console.log('Treksor Home — tarjetas horizontales; ajustes pendientes: '+count);
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se modifico nada.');process.exit(0);}
if(!count){console.log('TARJETAS HORIZONTALES YA APLICADAS.');process.exit(0);}
const backup=fs.mkdtempSync(path.join(path.dirname(root),'Treksor-cards-backup-'));
fs.mkdirSync(path.join(backup,'app/(tabs)/home'),{recursive:true});
fs.writeFileSync(path.join(backup,file),bytes);
if(!fs.readFileSync(file).equals(bytes))abort('Home cambio durante la preparacion.');
fs.writeFileSync(file,source.replace(/\n/g,eol));
console.log('TARJETAS HORIZONTALES APLICADAS. Respaldo: '+backup);
console.log('Solamente se modifico Home; no se tocaron datos, navegacion, videos ni colores.');
