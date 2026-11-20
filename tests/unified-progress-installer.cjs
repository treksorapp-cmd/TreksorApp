'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const patch=path.resolve('patches/remove-today-tab-windows.cjs');
const shell=cp.spawnSync('bash',['-n','patches/start-unified-progress-windows.sh'],{encoding:'utf8'});
assert.equal(shell.status,0,'Bootstrap shell syntax: '+shell.stderr);
const tabsPath='app/(tabs)/_layout.tsx',legacy='app/(tabs)/today/index.tsx',alias='app/today.tsx',progress='app/(tabs)/tracking/index.tsx';
const reviewedTabs=fs.readFileSync(tabsPath,'utf8'),reviewedAlias=fs.readFileSync(alias,'utf8'),reviewedProgress=fs.readFileSync(progress,'utf8');
assert(!fs.existsSync(legacy),'Today must not be a tab route in the reviewed repository');
const anchor='        <Tabs.Screen\n          name="chat"';
assert(reviewedTabs.includes(anchor));
const oldTabs=reviewedTabs.replace(anchor,'        {/* Legacy Today links redirect into the unified Progress screen. */}\n        <Tabs.Screen name="today/index" options={{href:null}} />\n\n'+anchor);
const oldLegacy='import { Redirect } from "expo-router";\n\n/** Saved Today links now open the unified Progress screen. */\nexport default function TodayScreen() {\n  return <Redirect href="/(tabs)/tracking" />;\n}\n';
const parent=fs.mkdtempSync(path.join(os.tmpdir(),'treksor-four-tabs-test-')),root=path.join(parent,'TreksorDevCompleto');
function write(file,data){const dest=path.join(root,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,data);}
function run(...args){return cp.spawnSync(process.execPath,[patch,...args],{cwd:root,encoding:'utf8'});}
try{
 fs.mkdirSync(root);cp.execFileSync('git',['init',root],{stdio:'ignore'});
 write(tabsPath,oldTabs);write(legacy,oldLegacy);write(progress,reviewedProgress);
 assert(!fs.existsSync(path.join(root,alias)));
 const dry=run('--check');
 assert.equal(dry.status,0,'Dry run: '+dry.stderr);
 assert.match(dry.stdout,/COMPATIBLE/);
 assert.equal(fs.readFileSync(path.join(root,tabsPath),'utf8'),oldTabs);
 assert(fs.existsSync(path.join(root,legacy)),'Dry run must retain legacy file');
 const applied=run();
 assert.equal(applied.status,0,'Apply: '+applied.stderr);
 assert.match(applied.stdout,/TODAY ELIMINADO DEL MENU/);
 assert(!fs.existsSync(path.join(root,legacy)),'The old Today route is physically gone');
 assert.equal(fs.readFileSync(path.join(root,alias),'utf8'),reviewedAlias,'Old /today links must redirect outside tabs');
 const withoutExtraBlankLines=s=>s.replace(/^[ \t]*$/gm,'').replace(/\n{2,}/g,'\n');
 assert.equal(withoutExtraBlankLines(fs.readFileSync(path.join(root,tabsPath),'utf8')),withoutExtraBlankLines(reviewedTabs),'Only the four-tab navigation must remain');
 assert.equal(fs.readFileSync(path.join(root,progress),'utf8'),reviewedProgress,'Progress with Daily Work must remain unchanged');
 const repeated=run();assert.equal(repeated.status,0,repeated.stderr);
 assert.match(repeated.stdout,/CUATRO PESTANAS YA CONFIGURADAS/);
 assert.equal(fs.readdirSync(parent).filter(n=>n.startsWith('Treksor-four-tabs-backup-')).length,1,'One backup only');
 fs.writeFileSync(path.join(root,legacy),'// Important local Today changes\n');
 const unsafe=run('--check');
 assert.notEqual(unsafe.status,0,'Refuse deletion of an unexpected Today source file');
 assert.equal(fs.readFileSync(path.join(root,legacy),'utf8'),'// Important local Today changes\n');
 console.log('PASS: Today route physically removed; four tabs remain, old links preserved, Progress untouched, dry run, backup and conflict prevention');
}finally{fs.rmSync(parent,{recursive:true,force:true});}
