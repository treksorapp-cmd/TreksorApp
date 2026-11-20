'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const file='components/AppFrame.tsx',rules=[["  const destination=trail.pillar?pillars[trail.pillar]:null;","  const destination=trail.pillar?pillars[trail.pillar]:null;\n  const pillarRoot=destination && pathname.replace(/\\/$/,'')===destination.route;\n  const showPillarShortcut=!!destination&&!pillarRoot&&!primaryTab;"],["<TouchableOpacity accessibilityRole=\"button\" accessibilityLabel={destination?`Return to ${destination.name}`:'Choose a pillar'} accessibilityState={destination?undefined:{expanded:picker}} style={s.icon} onPress={()=>destination?navigate(destination.route):setPicker(value=>!value)}><BrandIcon name={destination?.icon??'grid-outline'} size={22} color={colors.gold}/></TouchableOpacity>","<TouchableOpacity accessibilityRole=\"button\" accessibilityLabel=\"Choose a pillar\" accessibilityState={{expanded:picker}} style={s.icon} onPress={()=>setPicker(value=>!value)}><BrandIcon name=\"grid-outline\" size={22} color={colors.gold}/></TouchableOpacity>\n            {showPillarShortcut && destination && <TouchableOpacity accessibilityRole=\"button\" accessibilityLabel={`Return to ${destination.name}`} style={s.icon} onPress={()=>navigate(destination.route)}><BrandIcon name={destination.icon} size={22} color={colors.gold}/></TouchableOpacity>}"]];
const git=cp.spawnSync('git',['rev-parse','--show-prefix'],{encoding:'utf8'});
if(git.status!==0||git.stdout.trim())throw Error('Ejecutar desde TreksorDevCompleto');
const before=fs.readFileSync(file,'utf8');let after=before;
for(const [old,newText] of rules){if(after.includes(newText))continue;if(!after.includes(old))throw Error('Barra superior incompatible; no se modifico nada');after=after.replace(old,newText);}
if(after===before){console.log('NAVEGACION DE PILARES YA ACTUALIZADA');process.exit(0);}
console.log('NAVEGACION DE PILARES COMPATIBLE');
if(process.argv.includes('--check')){console.log('COMPATIBLE. No se modifico nada.');process.exit(0);}
const folder=fs.mkdtempSync(path.resolve(process.cwd(),'..','Treksor-pillar-nav-backup-'));fs.mkdirSync(path.join(folder,'components'),{recursive:true});fs.copyFileSync(file,path.join(folder,file));
fs.writeFileSync(file,after);console.log('NAVEGACION DE PILARES ACTUALIZADA. Respaldo: '+folder);
