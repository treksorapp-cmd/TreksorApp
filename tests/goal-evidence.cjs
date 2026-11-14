const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const path = "lib/goal-evidence.ts";
const { outputText } = ts.transpileModule(fs.readFileSync(path,"utf8"), {
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
});
const mod = { exports:{} };
const dayKey = date => [date.getFullYear(),String(date.getMonth()+1).padStart(2,"0"),String(date.getDate()).padStart(2,"0")].join("-");
const recentDays = (count,now) => Array.from({length:count},(_,i)=>{
  const d=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);
  d.setDate(d.getDate()-count+i+1);return dayKey(d);
});
vm.runInNewContext(outputText,{
  module:mod,exports:mod.exports,Date,Set,Map,Object,Number,Math,Error,
  require:spec=>{if(spec==="@/lib/progress-metrics")return{dayKey,recentDays};throw Error(spec)}
},{filename:path});
const {workoutEvidence,priorityEvidence,volumeSummary,recommendGoalAction}=mod.exports;
const now = new Date(2026,10,12,12);
const first = new Date(2026,10,10,10).toISOString();
const second = new Date(2026,10,11,10).toISOString();
const old = new Date(2026,9,1,10).toISOString();
const workouts=workoutEvidence({week1:[first,first,second,old]},now);
assert.equal(workouts.length,2);
assert(workouts.every(x=>x.metric_key==="workout_sessions_7d"));
assert(workouts.every(x=>x.origin_ref.startsWith("gym-checkin:")));
const priorities=priorityEvidence(["2026-11-12","2026-11-12","2026-11-09","2026-10-01"],now);
assert.equal(priorities.length,2);
const volume=volumeSummary([
  {id:"a",kg:40,reps:8,recordedAt:first},
  {id:"b",kg:20,reps:5,recordedAt:second},
  {id:"c",kg:80,reps:10,recordedAt:old},
  {id:"d",kg:-3,reps:12,recordedAt:first},
],now);
assert.equal(volume.sets,2);assert.equal(volume.volumeKg,420);
assert.equal(recommendGoalAction({metric:"workout_sessions_7d",target:3,observed:1}).key,"workout_next_session_v1");
assert.equal(recommendGoalAction({metric:"priority_days_7d",target:2,observed:0}).key,"purpose_daily_priority_v1");
assert.equal(recommendGoalAction({metric:"priority_days_7d",target:2,observed:2}).key,"goal_on_track_v1");
console.log("PASS: recorded workout evidence, priority-only dates, weighted sets and deterministic next step");
