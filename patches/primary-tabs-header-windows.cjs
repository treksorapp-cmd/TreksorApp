'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const file='components/AppFrame.tsx';
const check=cp.spawnSync('git',['rev-parse','--show-prefix'],{encoding:'utf8'});
if(check.status!==0||check.stdout.trim())throw Error('Ejecutar desde la raiz de TreksorDevCompleto');
const before=fs.readFileSync(file,'utf8');
const oldHome="  const isHome=pathname==='/home'||pathname==='/(tabs)/home'||pathname==='/';";
const newHome=oldHome+"\n  const primaryTab=new Set(['/','/home','/chat','/tracking','/community','/(tabs)/home','/(tabs)/chat','/(tabs)/tracking','/(tabs)/community']).has(pathname);";
const oldBack='            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"';
const newBack='            {!primaryTab && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back"';
const oldEnd='else navigate(trail.parent)}}><BrandIcon name="arrow-back" size={21} color={colors.text}/></TouchableOpacity>';
const newEnd=oldEnd+'}';
const oldHomeButton='            {!isHome && <TouchableOpacity';
const newHomeButton='            {!primaryTab && !isHome && <TouchableOpacity';
const rules=[[oldHome,newHome],[oldBack,newBack],[oldEnd,newEnd],[oldHomeButton,newHomeButton]];
let next=before;
for(const [a,b] of rules){
 if(next.includes(b))continue;
 if(!next.includes(a))throw Error('AppFrame diferente; se conserva el codigo actual');
 next=next.replace(a,b);
}
if(next===before){console.log('BARRA SUPERIOR YA ACTUALIZADA');process.exit(0);}
console.log('BARRA SUPERIOR: cuatro tabs compatibles');
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se modifico nada.');process.exit(0);}
const folder=fs.mkdtempSync(path.resolve(process.cwd(),'..','Treksor-header-backup-'));fs.mkdirSync(path.join(folder,'components'),{recursive:true});fs.copyFileSync(file,path.join(folder,file));
fs.writeFileSync(file,next);console.log('BARRA SUPERIOR ACTUALIZADA. Respaldo: '+folder);
