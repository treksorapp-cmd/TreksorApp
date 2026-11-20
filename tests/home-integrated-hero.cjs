'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const home='app/(tabs)/home/index.tsx',frame='components/AppFrame.tsx';
const script=path.resolve('patches/integrate-home-hero-windows.cjs');
const currentHome=fs.readFileSync(home,'utf8'),currentFrame=fs.readFileSync(frame,'utf8');
const hero=currentHome.indexOf('        <Animated.View style={[styles.hero,');
const brand=currentHome.indexOf('        <View style={styles.top}>');
const greeting=currentHome.indexOf('          <View style={styles.heroGreetingWrap}>');
const heroContent=currentHome.indexOf('          <View style={styles.heroContent}>');
assert(hero>0&&brand>hero&&greeting>heroContent,'Brand and greeting must live INSIDE one hero, not in detached strips');
assert(currentHome.includes('navyOverlay(0.96), navyOverlay(0.70), navyOverlay(0.50)'),'Hero background must be darkened');
assert(currentHome.includes('height: 74, flexDirection: "row"'),'Brand row has stable height');
assert(currentHome.includes('paddingTop: 15, paddingBottom: 15'),'Brand row padding is symmetrical');
assert(currentHome.includes('width:44,height:44,borderRadius:22')&&currentHome.includes('height: 44, width: 44'),'Profile avatar and touch target aligned');
assert(currentHome.includes('paddingTop: 0, paddingBottom: 28'),'No redundant Home top safe-area offset');
assert(currentHome.includes('marginBottom:17'),'Greeting is in content, not floating over photography');
assert(currentHome.includes('contentPosition={pillar.name==="Mind"?{left:"50%",top:"18%"}:"center"}'),'Do not break Mind image/crop behavior');
assert(currentFrame.includes('!isHome && <TouchableOpacity'),'Do not show Home button on Home');
function beforeVersion(){
 let s=currentHome;
 const start=s.indexOf('        <View style={styles.top}>',s.indexOf('        <Animated.View style={[styles.hero,'));
 const end=s.indexOf('          <View style={styles.heroContent}>',start);
 const block=s.slice(start,end).trimEnd();
 assert(block.includes('style={styles.profile}'));
 s=s.replace(block+'\n','');
 s=s.replace('        <Animated.View style={[styles.hero,',block+'\n\n        <Animated.View style={[styles.hero,');
 const greetingLine=s.split('\n').find(line=>line.includes('<View style={styles.heroGreetingWrap}>'));
 s=s.replace(greetingLine+'\n','');
 s=s.replace('          <View style={styles.heroContent}>',
    greetingLine+'\n          <View style={styles.heroContent}>');
 const reversals=[
  ['navyOverlay(0.96), navyOverlay(0.70), navyOverlay(0.50), colors.background','navyOverlay(0.08), navyOverlay(0.45), colors.background'],
  ['locations={[0, 0.22, 0.57, 1]}','locations={[0, 0.4, 1]}'],
  ['content: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 28 }','content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }'],
  ['hero: { minHeight: 328, marginHorizontal: -20, marginTop: 0, marginBottom: 18, overflow: "hidden", backgroundColor: colors.surface }','hero: { minHeight: 276, marginHorizontal: -20, marginTop: 0, marginBottom: 26, overflow: "hidden", backgroundColor: colors.surface }'],
  ['heroContent: { flex: 1, paddingTop: 16, justifyContent: "flex-end", paddingHorizontal: 24, paddingBottom: 30 }','heroContent: { flex: 1, paddingTop: 88, justifyContent: "flex-end", paddingHorizontal: 24, paddingBottom: 28 }'],
  ['top: { height: 74, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 15, paddingBottom: 15 }','top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }'],
  ['topRight:{alignItems:"center",justifyContent:"center"}','topRight:{flexDirection:"column",alignItems:"flex-end",gap:5}'],
  ['heroGreetingWrap:{flexDirection:"row",alignItems:"center",alignSelf:"flex-start",gap:8,marginBottom:17}','heroGreetingWrap:{position:"absolute",top:14,right:20,zIndex:2,flexDirection:"row",alignItems:"center",gap:7,paddingHorizontal:12,paddingVertical:8,borderRadius:20,backgroundColor:colors.glass}'],
  ['profileImage:{width:44,height:44,borderRadius:22}','profileImage:{width:40,height:40,borderRadius:20}'],
  ['logo: { width: 40, height: 40, borderRadius: 11 }','logo: { width: 38, height: 38, borderRadius: 11 }'],
  ['profile: { height: 44, width: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, alignItems: "center", justifyContent: "center" }','profile: { height: 42, width: 42, borderRadius: 21, backgroundColor: colors.glass, alignItems: "center", justifyContent: "center" }']
 ];
 for(const [from,to] of reversals){assert(s.includes(from),'Fixture missing '+from);s=s.replace(from,to);}
 return s;
}
const parent=fs.mkdtempSync(path.join(os.tmpdir(),'treksor-home-integration-')),root=path.join(parent,'TreksorApp');
try{
 fs.mkdirSync(root);cp.execFileSync('git',['init',root],{stdio:'ignore'});
 fs.symlinkSync(path.resolve('node_modules'),path.join(root,'node_modules'),'dir');
 for(const f of [home,frame]){const out=path.join(root,f);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,fs.readFileSync(f));}
 const olderHome=beforeVersion();
 const olderFrame=currentFrame
   .replace("  // The Home destination is redundant when the current screen is already Home.\n  const isHome=pathname==='/home'||pathname==='/(tabs)/home'||pathname==='/';\n",'')
   .replace('            {!isHome && <TouchableOpacity','            <TouchableOpacity')
   .replace('</TouchableOpacity>}\n            <TouchableOpacity accessibilityRole="button" accessibilityLabel={destination?', '</TouchableOpacity>\n            <TouchableOpacity accessibilityRole="button" accessibilityLabel={destination?');
 assert(olderFrame!==currentFrame);
 fs.writeFileSync(path.join(root,home),olderHome);
 fs.writeFileSync(path.join(root,frame),olderFrame);
 const run=(...args)=>cp.spawnSync(process.execPath,[script,...args],{cwd:root,encoding:'utf8'});
 const pre=run('--check');assert.equal(pre.status,0,pre.stderr);assert.match(pre.stdout,/COMPATIBLE/);
 assert.equal(fs.readFileSync(path.join(root,home),'utf8'),olderHome);
 const applied=run();assert.equal(applied.status,0,applied.stderr);assert.match(applied.stdout,/HOME INTEGRADO APLICADO/);
 assert.equal(fs.readFileSync(path.join(root,home),'utf8'),currentHome,'Home update must reconstruct the reviewed layout');
 assert.equal(fs.readFileSync(path.join(root,frame),'utf8'),currentFrame,'Hide redundant Home button without changing other frame behavior');
 const retry=run();assert.equal(retry.status,0,retry.stderr);assert.match(retry.stdout,/HOME INTEGRADO YA APLICADO/);
 assert.equal(fs.readdirSync(parent).filter(f=>f.startsWith('Treksor-home-integrated-backup-')).length,1);
 console.log('PASS: integrated Home brand/avatar, dark hero, anchored greeting, symmetric padding, safe local patch and rerun');
}finally{fs.rmSync(parent,{recursive:true,force:true})}
