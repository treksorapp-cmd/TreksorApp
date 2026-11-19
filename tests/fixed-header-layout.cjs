'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const fixedFrame=fs.readFileSync('components/AppFrame.tsx','utf8');
const fixedHome=fs.readFileSync('app/(tabs)/home/index.tsx','utf8');
const patch=path.resolve('patches/fix-home-header-and-pillar-menu-windows.cjs');
assert(fixedHome.includes('edges={hasFixedHeader ? [] : ["top"]}'),'Home must avoid duplicate top inset');
assert(fixedFrame.includes('style={[s.pickerOverlay,{top:headerHeight}]}'),'Picker must use header measured position');
assert(fixedFrame.includes('chrome:{backgroundColor:colors.background,borderBottomWidth:1,borderBottomColor:colors.border,zIndex:40,elevation:40}'));
const overlay=/      \{visible && picker && headerHeight > 0 && <View pointerEvents="box-none" style=\{\[s\.pickerOverlay,\{top:headerHeight\}\]\}>\n        <View style=\{s\.picker\}>([^\n]+)<\/View>\n      <\/View>\}/;
const menu=fixedFrame.match(overlay);
assert(menu,'Picker markup missing or moved under chrome');
assert(fixedFrame.indexOf('</SafeAreaView>}')<fixedFrame.indexOf('pointerEvents="box-none"'),'Menu must be a sibling after header');
for(const variant of ['floating','row']){
  let oldFrame=fixedFrame
    .replace("  // Measure the full fixed header, including the device safe area, so the menu\n  // always opens immediately BELOW it (never over the route or iPhone status bar).\n  const [headerHeight,setHeaderHeight]=useState(0);\n",'')
    .replace(" onLayout={event=>{\n        const height=event.nativeEvent.layout.height;\n        setHeaderHeight(previous=>previous===height?previous:height);\n      }}>",">")
    .replace(menu[0],'        {picker&&<View style={s.picker}>'+menu[1]+'</View>}\n      </SafeAreaView>}')
    .replace('      </SafeAreaView>}\n        {picker&&<View style={s.picker}>','        {picker&&<View style={s.picker}>')
    .replace('chrome:{backgroundColor:colors.background,borderBottomWidth:1,borderBottomColor:colors.border,zIndex:40,elevation:40}',
             'chrome:{backgroundColor:colors.background,borderBottomWidth:1,borderBottomColor:colors.border,zIndex:10,elevation:10}')
    .replace("  pickerOverlay:{position:'absolute',left:0,right:0,zIndex:30,elevation:30,paddingHorizontal:12},\n",'')
    .replace("picker:{flexDirection:'row',padding:10,gap:8,backgroundColor:colors.background,borderWidth:1,borderColor:colors.border,borderRadius:14}",
      variant==='floating'
      ?"picker:{position:'absolute',top:'100%',left:12,right:12,zIndex:20,flexDirection:'row',padding:10,gap:8,backgroundColor:colors.background,borderWidth:1,borderColor:colors.border,borderRadius:14,elevation:12}"
      :"picker:{flexDirection:'row',paddingHorizontal:16,paddingBottom:12,gap:8}");
  let oldHome=fixedHome.replace('import { useFixedRouteHeader } from "@/lib/navigation-frame-context";\n','')
    .replace('  // AppFrame already owns the top safe area when the fixed route is visible.\n  // Counting it again here produced the large empty band above the brand.\n  const hasFixedHeader=useFixedRouteHeader();\n','')
    .replace('edges={hasFixedHeader ? [] : ["top"]}','edges={["top"]}');
  assert(!oldFrame.includes('style={[s.pickerOverlay,{top:headerHeight}]}'),'Fixture should be pre-fix');
  const parent=fs.mkdtempSync(path.join(os.tmpdir(),'treksor-nav-test-'));
  const project=path.join(parent,'TreksorApp');
  fs.mkdirSync(project);cp.execFileSync('git',['init',project],{stdio:'ignore'});
  fs.symlinkSync(path.resolve('node_modules'),path.join(project,'node_modules'),'dir');
  for(const file of ['components/AppFrame.tsx','app/(tabs)/home/index.tsx','lib/navigation-frame-context.ts']){
    const dest=path.join(project,file);fs.mkdirSync(path.dirname(dest),{recursive:true});
    const value=file.includes('AppFrame')?oldFrame:file.includes('home/index')?oldHome:fs.readFileSync(file);
    fs.writeFileSync(dest,value);
  }
  const run=(...args)=>cp.execFileSync(process.execPath,[patch,...args],{cwd:project,encoding:'utf8'});
  try{
    assert.match(run('--check'),/COMPATIBLE/);
    assert.equal(fs.readFileSync(path.join(project,'components/AppFrame.tsx'),'utf8'),oldFrame);
    assert.match(run(),/CORRECCION APLICADA/);
    const newFrame=fs.readFileSync(path.join(project,'components/AppFrame.tsx'),'utf8');
    const newHome=fs.readFileSync(path.join(project,'app/(tabs)/home/index.tsx'),'utf8');
    assert(newFrame.includes("pickerOverlay:{position:'absolute'"),variant+' overlay style');
    assert(newFrame.includes('style={[s.pickerOverlay,{top:headerHeight}]}'),variant+' menu below header');
    assert(newHome.includes('edges={hasFixedHeader ? [] : ["top"]}'));
    assert(!newFrame.includes("top:'100%'"));
    assert.match(run(),/AJUSTES YA APLICADOS/);
    assert.equal(fs.readdirSync(parent).filter(x=>x.startsWith('Treksor-nav-backup-')).length,1);
    console.log('PASS: local nav patch '+variant+' layout, dry run, backup, no-op');
  }finally{fs.rmSync(parent,{recursive:true,force:true})}
}
