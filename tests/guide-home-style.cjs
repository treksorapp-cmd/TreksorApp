'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const files=[
 'design/brand/icons.json','components/ui/BrandIcon.tsx','app/(tabs)/_layout.tsx',
 'app/(tabs)/chat/index.tsx','components/ChatModal.tsx','components/AppFrame.tsx',
 'components/ui/Header.tsx','components/BodyPageHeading.tsx','app/(tabs)/home/index.tsx'
];
const script=path.resolve('patches/guide-home-profile-windows.cjs');
const updated=new Map(files.map(p=>[p,fs.readFileSync(p,'utf8')]));
const icons=JSON.parse(updated.get(files[0]));
assert.equal(icons.guide.length,7,'Guide must remain an organic sunrise mark');
const brand=updated.get(files[1]);
assert(brand.includes("export const GUIDE_ICON = 'guide-outline' as const;"));
assert(brand.includes("export const HOME_ICON = 'home-outline' as const;"));
assert(brand.includes("'home-sharp':'home'"));
const tab=updated.get(files[2]);
assert(tab.includes('name={GUIDE_ICON}'));
assert(tab.includes('name={HOME_ICON}'));
for(const file of [files[3],files[4]]){
 const source=updated.get(file);
 assert(source.includes('import Ionicons, { GUIDE_ICON }'));
 assert(!source.includes('name="sparkles-outline"'));
 assert(source.includes('>Reflecting…</Text>'));
 assert(source.includes('backgroundColor: colors.surfaceRaised'));
 assert(source.includes('borderColor: colors.border'));
 assert.equal(source.split('name={GUIDE_ICON}').length-1,file===files[3]?2:3);
}
const nav=updated.get(files[5]),home=updated.get(files[8]);
assert(nav.includes('!isHome && <TouchableOpacity'));
assert(nav.includes('name={HOME_ICON}'));
assert(nav.includes("pathname==='/home'||pathname==='/(tabs)/home'||pathname==='/'"));
assert(home.includes('content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }'));
assert(home.includes('top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }'));
assert(home.includes('hero: { minHeight: 276, marginHorizontal: -20, marginTop: 0, marginBottom: 26'));
const parent=fs.mkdtempSync(path.join(os.tmpdir(),'treksor-guide-fixture-'));
const root=path.join(parent,'TreksorApp');
fs.mkdirSync(root);cp.execFileSync('git',['init',root],{stdio:'ignore'});
fs.symlinkSync(path.resolve('node_modules'),path.join(root,'node_modules'),'dir');
try{
 for(const [file,s] of updated){
   const dest=path.join(root,file);fs.mkdirSync(path.dirname(dest),{recursive:true});
   fs.writeFileSync(dest,s);
 }
 const run=(...args)=>cp.execFileSync(process.execPath,[script,...args],{cwd:root,encoding:'utf8'});
 assert.match(run('--check'),/COMPATIBLE/);
 assert.match(run(),/CAMBIOS YA APLICADOS/);
 assert.equal(fs.readdirSync(parent).filter(f=>f.startsWith('Treksor-guide-backup-')).length,0,'No backup when no changes');
 // Recreate old Home-only spacing. The installer must preserve all other updated files.
 const oldHome=home.replace('content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }','content: { paddingHorizontal: 20, paddingTop: 7, paddingBottom: 28 }')
    .replace('hero: { minHeight: 276, marginHorizontal: -20, marginTop: 0, marginBottom: 26','hero: { minHeight: 276, marginHorizontal: -20, marginTop: -8, marginBottom: 26')
    .replace('top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }','top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }');
 fs.writeFileSync(path.join(root,files[8]),oldHome);
 assert.match(run('--check'),/COMPATIBLE/);
 assert.equal(fs.readFileSync(path.join(root,files[8]),'utf8'),oldHome,'Dry run cannot edit');
 assert.match(run(),/TREKSOR GUIDE \/ HOME ACTUALIZADO/);
 assert.equal(fs.readFileSync(path.join(root,files[8]),'utf8'),home);
 assert.match(run(),/CAMBIOS YA APLICADOS/);
 assert.equal(fs.readdirSync(parent).filter(f=>f.startsWith('Treksor-guide-backup-')).length,1,'Exactly one backup');
 console.log('PASS: one Guide sunrise symbol, consistent Home icons, avatar contrast, profile spacing and reversible Windows patch');
}finally{fs.rmSync(parent,{recursive:true,force:true})}
