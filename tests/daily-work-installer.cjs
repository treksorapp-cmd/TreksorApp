'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const root=process.cwd(),patch=path.resolve('patches/apply-daily-work-windows.cjs');
const existing=[
 'app/(tabs)/today/index.tsx','app/(tabs)/tracking/index.tsx',
 'lib/progress-metrics.ts','components/progress/ProgressDashboard.tsx'
];
const newFiles=['lib/daily-activities.ts','hooks/useDailyActivities.ts','components/DailyWork.tsx'];
const original=Object.fromEntries(existing.map(f=>[f,fs.readFileSync(f,'utf8')]));
function makeBefore(f){
 let s=original[f];
 if(f.includes('/today/')){
  return s.replace('import DailyWork from "@/components/DailyWork";\n','').replace('      <DailyWork />\n','');
 }
 if(f.includes('/tracking/')){
  s=s.replace('import { useDailyActivities } from "@/hooks/useDailyActivities";\nimport Icon from "@/components/ui/BrandIcon";\n','')
    .replace('  const dailyWork = useDailyActivities();\n','')
    .replace('dailyActivities: dailyWork.entries, ','');
  const a=s.indexOf('      <TouchableOpacity accessibilityRole="button" accessibilityLabel="Open Daily Work to log an activity"'),b=s.indexOf('      <WalkingSummary',a);
  assert(a>0&&b>a);return s.slice(0,a)+s.slice(b);
 }
 if(f==='lib/progress-metrics.ts'){
  s=s.replace(' | "activity"','').replace('  dailyActivities?: {id:string;date:string;kind:string;title:string;minutes:number|null}[];\n','');
  const a=s.indexOf('  // Daily Work and Body Walks feed one dated timeline.'),b=s.indexOf('  events.sort(',a);
  assert(a>0&&b>a);s=s.slice(0,a)+s.slice(b);
  const c=s.indexOf('    dailyWorkCount:'),d=s.indexOf('    meditation:',c);assert(c>0&&d>c);
  return s.slice(0,c)+s.slice(d);
 }
 if(f.includes('ProgressDashboard')){
  return s.replace('daily check-in, life moment, Daily Work activity, walk or completed tracker item. The selected window',
   'daily check-in, life moment or completed tracker item. The selected window')
  .replace('Training: sessions and sets you save. Daily Work: completed walks and other activities you log, including your own. Mind: saved reflections and journal dates. Balance: practices you mark complete. Purpose: saved vision prompts. Personal trackers: checkmarks you enter for scheduled dates.',
   'Training: sessions and sets you save. Mind: saved reflections and journal dates. Balance: practices you mark complete. Purpose: saved vision prompts. Personal trackers: checkmarks you enter for scheduled dates.')
  .replace('Some progress summaries sync to your web profile; Daily Work is currently saved only on this iPhone. Journal text, moods and vision answers stay on this device.',
   'Supported progress summaries sync to your web profile. Journal text, moods and vision answers stay on this device.')
  .replace('event.kind === "activity" ? "trail-sign-outline" : ','')
  .replace('Complete a session, log Daily Work, save a reflection or mark a habit. Its source and date will appear here.',
   'Complete a session, save a reflection or log a habit. Its source and date will appear here.');
 }
 throw Error(f);
}
const parent=fs.mkdtempSync(path.join(os.tmpdir(),'treksor-daily-work-install-')),project=path.join(parent,'TreksorApp');
try{
 fs.mkdirSync(project);cp.execFileSync('git',['init',project],{stdio:'ignore'});
 cp.execFileSync('git',['fetch','--no-tags',root,'HEAD:refs/remotes/origin/feature/v12-daily-work-activities-progress-20261119'],{cwd:project,stdio:'ignore'});
 fs.symlinkSync(path.join(root,'node_modules'),path.join(project,'node_modules'),'dir');
 for(const f of existing){const dest=path.join(project,f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,makeBefore(f));}
 const run=(...args)=>cp.execFileSync(process.execPath,[patch,...args],{cwd:project,encoding:'utf8'});
 assert.match(run('--check'),/COMPATIBLE/);
 for(const f of newFiles)assert(!fs.existsSync(path.join(project,f)),'Dry-run cannot create '+f);
 assert.match(run(),/DAILY WORK ACTUALIZADO/);
 for(const f of existing)assert.equal(fs.readFileSync(path.join(project,f),'utf8'),original[f],'Patch should preserve and reconstruct '+f);
 for(const f of newFiles)assert.equal(fs.readFileSync(path.join(project,f),'utf8'),fs.readFileSync(f,'utf8'),'Exact new file '+f);
 assert.match(run(),/DAILY WORK YA APLICADO/);
 assert.equal(fs.readdirSync(parent).filter(f=>f.startsWith('Treksor-daily-work-backup-')).length,1);
 console.log('PASS: local Windows Daily Work installer dry-run, exact incremental patch, new files, backup and safe retry');
}finally{fs.rmSync(parent,{recursive:true,force:true})}
