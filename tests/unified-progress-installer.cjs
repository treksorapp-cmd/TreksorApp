'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const patch=path.resolve('patches/apply-unified-progress-windows.cjs');
const shell=cp.spawnSync('bash',['-n','patches/start-unified-progress-windows.sh'],{encoding:'utf8'});
assert.equal(shell.status,0,'One-command Git Bash updater must parse: '+shell.stderr);
const names=['app/(tabs)/_layout.tsx','app/(tabs)/today/index.tsx','app/(tabs)/tracking/index.tsx','components/DailyWork.tsx','lib/route-trail.ts'];
const prereqs=['lib/daily-activities.ts','hooks/useDailyActivities.ts','components/JourneyCard.tsx','components/WeeklyHabits.tsx','lib/progress-metrics.ts'];
const latest=Object.fromEntries(names.map(p=>[p,fs.readFileSync(p,'utf8')]));
function older(p){
 let s=latest[p];
 if(p.includes('/_layout.tsx'))return s.replace('<Tabs.Screen name="today" options={{href:null}} />',
  '<Tabs.Screen name="today" options={{title:"Today",tabBarIcon:({color})=><View style={styles.iconContainer}><Ionicons name="today-outline" size={23} color={color}/></View>}} />');
 if(p.includes('/today/index.tsx'))return 'import React from "react";\nexport default function TodayScreen(){return null;}\n';
 if(p.includes('/tracking/index.tsx')){
  return s.replace('Your day and your growth. One place.','Your days, your growth, your next step.');
 }
 if(p.includes('DailyWork.tsx'))return s.replace('What did you do?','Keep moving.');
 if(p.includes('route-trail.ts'))return s.replace("today:'Progress', tracking:'Progress'","today:'Today', tracking:'Progress'");
 throw Error(p);
}
const parent=fs.mkdtempSync(path.join(os.tmpdir(),'treksor-unified-fixture-')),root=path.join(parent,'TreksorDevCompleto');
function git(args){return cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();}
function write(p,s){const f=path.join(root,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,s);}
try{
 fs.mkdirSync(root);git(['init']);git(['config','user.name','Treksor QA']);git(['config','user.email','test@treksor.invalid']);
 fs.symlinkSync(path.resolve('node_modules'),path.join(root,'node_modules'),'dir');
 for(const p of [...names,...prereqs])write(p,names.includes(p)?older(p):fs.readFileSync(p,'utf8'));
 git(['add','--',...names,...prereqs]);git(['commit','-m','Prior Progress + Today']);
 const base=git(['rev-parse','HEAD']);
 for(const p of names)write(p,latest[p]);
 git(['add','--',...names]);git(['commit','-m','Unified Progress']);
 const reviewed=git(['rev-parse','HEAD']);
 for(const p of names)write(p,older(p));
 // One independent local edit should survive the 3-way update.
 const custom='// Local route comment that must survive\n';
 write('lib/route-trail.ts',custom+older('lib/route-trail.ts'));
 const before=fs.readFileSync(path.join(root,'lib/route-trail.ts'),'utf8');
 function run(...args){return cp.spawnSync(process.execPath,[patch,...args],{cwd:root,encoding:'utf8',env:{...process.env,TREKSOR_SIMPLE_PROGRESS_BASE:base,TREKSOR_SIMPLE_PROGRESS_REF:reviewed}});}
 const dry=run('--check');assert.equal(dry.status,0,'Dry run: '+dry.stderr);assert.match(dry.stdout,/COMPATIBLE/);
 assert.equal(fs.readFileSync(path.join(root,'lib/route-trail.ts'),'utf8'),before,'Dry run does not write');
 const applied=run();assert.equal(applied.status,0,'Application: '+applied.stderr);assert.match(applied.stdout,/PROGRESS UNIFICADO INSTALADO/);
 for(const p of names){
  const current=fs.readFileSync(path.join(root,p),'utf8');
  assert.equal(current,(p==='lib/route-trail.ts'?custom:'')+latest[p],'Installer must preserve current UI and independent local edit: '+p);
 }
 const second=run();assert.equal(second.status,0,second.stderr);assert.match(second.stdout,/PROGRESS UNIFICADO YA INSTALADO/);
 assert.equal(fs.readdirSync(parent).filter(name=>name.startsWith('Treksor-progress-backup-')).length,1,'One backup, no duplicate writes');
 // On overlapping edits: never replace the local file, even in --check.
 write('lib/route-trail.ts',older('lib/route-trail.ts').replace("today:'Today'","today:'Archive'"));
 const conflict=fs.readFileSync(path.join(root,'lib/route-trail.ts'),'utf8');
 const bad=run('--check');assert.notEqual(bad.status,0,'Same-line modifications must block update');
 assert.equal(fs.readFileSync(path.join(root,'lib/route-trail.ts'),'utf8'),conflict,'Overlapping edit stays untouched');
 console.log('PASS: unified Progress installer dry run, safe three-way merge, backup, rerun and conflict protection');
}finally{fs.rmSync(parent,{recursive:true,force:true});}
