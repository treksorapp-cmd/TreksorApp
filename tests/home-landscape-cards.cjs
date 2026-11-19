'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const file='app/(tabs)/home/index.tsx';
const source=fs.readFileSync(file,'utf8');
const patch=path.resolve('patches/compact-home-pillar-cards-windows.cjs');
// No portrait-size tiles remain. Preserve all text, overlays, routes and side-scroll.
assert(source.includes('pillarCardHeight=Math.max(204,Math.round(pillarCardWidth*0.60))'));
assert(source.includes('minHeight:pillarCardHeight'));
assert(!source.includes('minHeight:Math.max(390,260*fontScale)'));
for(const str of [
  'horizontal','snapToInterval={pillarStep}', 'onPress={()=>router.push(pillar.route)}',
  'accessibilityLabel={\`\${pillar.name}, \${index+1} of \${pillars.length}: \${pillar.subtitle}\`}',
  '{pillar.subtitle}', 'ENTER {pillar.name.toUpperCase()}', 'paddingRight:Math.max(PILLAR_INSET',
  'color:colors.text', 'colors.border', 'navyOverlay(0.98)'
])assert(source.includes(str),'Missing landscape card contract: '+str);
const parent=fs.mkdtempSync(path.join(os.tmpdir(),'treksor-landscape-fixture-'));
const project=path.join(parent,'TreksorApp');fs.mkdirSync(project);
try {
  cp.execFileSync('git',['init',project],{stdio:'ignore'});
  fs.symlinkSync(path.resolve('node_modules'),path.join(project,'node_modules'),'dir');
  const dest=path.join(project,file);fs.mkdirSync(path.dirname(dest),{recursive:true});
  const old=source
    .replace('minHeight:pillarCardHeight','minHeight:Math.max(390,260*fontScale)')
    .replace('sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }',
      'sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 17 }')
    .replace('  // Panoramic editorial cards: keep the entire pillar identity visible without\n  // making visitors scroll through a tall portrait card.\n  // Additional height preserves readability at larger accessibility text sizes.\n  const pillarCardHeight=Math.max(204,Math.round(pillarCardWidth*0.60))+Math.max(0,Math.ceil((fontScale-1)*88));\n','');
  fs.writeFileSync(dest,old);
  const run=(...args)=>cp.execFileSync(process.execPath,[patch,...args],{cwd:project,encoding:'utf8'});
  assert.match(run('--check'),/COMPATIBLE/);
  assert.equal(fs.readFileSync(dest,'utf8'),old,'Dry run must never modify file');
  assert.match(run(),/TARJETAS HORIZONTALES APLICADAS/);
  assert.equal(fs.readFileSync(dest,'utf8'),source,'Patch should reconstruct exact landscape UI');
  assert.match(run(),/TARJETAS HORIZONTALES YA APLICADAS/);
  assert.equal(fs.readdirSync(parent).filter(x=>x.startsWith('Treksor-cards-backup-')).length,1);
  console.log('PASS: landscape cards, content and snap retained, Windows patch reversible/idempotent');
}finally{fs.rmSync(parent,{force:true,recursive:true})}
