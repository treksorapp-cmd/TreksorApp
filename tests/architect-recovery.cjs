const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const script=path.resolve('patches/restore-architect-compatible-windows.cjs');
const nodeModules=path.resolve('node_modules');
for(const kind of ['original','selector']){
  const parent=fs.mkdtempSync(path.join(os.tmpdir(),'treksor-premium-fixture-'));
  const cwd=path.join(parent,'TreksorApp');fs.mkdirSync(cwd);
  cp.execFileSync('git',['init',cwd],{stdio:'ignore'});
  // Windows requires a junction for directory links without Developer Mode/admin privileges.
  fs.symlinkSync(nodeModules,path.join(cwd,'node_modules'),process.platform==='win32'?'junction':'dir');
  for(const dir of ['theme','components','app/(tabs)/home'])fs.mkdirSync(path.join(cwd,dir),{recursive:true});
  const theme=kind==='original'
    ?'export const colors = { background: "#0B1930", surface: "#132640", surfaceRaised: "#1B3352", border: "rgba(175,201,235,0.18)", glass: "rgba(175,201,235,0.06)" } as const;\n'
    :fs.readFileSync('theme/architect.ts','utf8')
      .replace("appearance: 'navy' | 'midnight' = 'midnight'","appearance: 'navy' | 'midnight' = 'navy'")
      .replace('rgba(245,244,241,0.10)','rgba(175,201,235,0.18)');
  const frame="const colors={background:'#fff',border:'#eee'};\nconst styles={picker:{flexDirection:'row',paddingHorizontal:16,paddingBottom:12,gap:8},chrome:{backgroundColor:colors.background,borderBottomWidth:1,borderBottomColor:colors.border},bar:{paddingHorizontal:16,paddingVertical:10,gap:10}};\n";
  const home="const styles={top:{marginBottom:15},content:{paddingTop:13}};\n";
  const originals=[
    ['theme/architect.ts',theme],
    ['components/AppFrame.tsx',frame],
    ['app/(tabs)/home/index.tsx',home]
  ];
  for(const [f,data] of originals)fs.writeFileSync(path.join(cwd,f),data);
  function run(...args){return cp.execFileSync(process.execPath,[script,...args],{cwd,encoding:'utf8'})}
  try{
    assert.match(run('--check'),/COMPATIBLE/);
    for(const [f,data] of originals)assert.equal(fs.readFileSync(path.join(cwd,f),'utf8'),data,'--check may not write');
    assert.match(run(),/TREKSOR PREMIUM APLICADO/);
    const updated=fs.readFileSync(path.join(cwd,'theme/architect.ts'),'utf8');
    if(kind==='original'){
      assert(updated.includes('background: "#05080D"'));
      assert(updated.includes('surface: "#0B1017"'));
      assert(updated.includes('surfaceRaised: "#121922"'));
    }else assert(updated.includes("appearance: 'navy' | 'midnight' = 'midnight'"));
    assert(fs.readFileSync(path.join(cwd,'components/AppFrame.tsx'),'utf8').includes("picker:{position:'absolute'"));
    assert(fs.readFileSync(path.join(cwd,'app/(tabs)/home/index.tsx'),'utf8').includes('marginBottom:4'));
    assert.match(run(),/El tema ya esta aplicado/);
    const backups=fs.readdirSync(parent).filter(f=>f.startsWith('Treksor-premium-backup-'));
    assert.equal(backups.length,1,'Only one backup, no repeat writes');
    console.log('PASS: premium updater '+kind+' layout, dry run, backup and no-op repeat');
  }finally{fs.rmSync(parent,{recursive:true,force:true})}
}
