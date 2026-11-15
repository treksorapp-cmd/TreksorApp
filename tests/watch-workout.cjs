const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const ts=require("typescript");
const file="lib/watch-workout-contract.ts";
const out=ts.transpileModule(fs.readFileSync(file,"utf8"),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}
}).outputText;
const mod={exports:{}};
vm.runInNewContext(out,{module:mod,exports:mod.exports,Date,Number,Math,Object,RegExp},{filename:file});
const {mapAuthorisedWatchWorkout,overlapsWorkout}=mod.exports;
const now=new Date("2026-11-12T12:00:00.000Z");
const valid={
  workoutId:"bb7a1b00-f24b-4d01-8c64-c7c023eed321",
  startedAt:"2026-11-11T08:00:00.000Z",
  endedAt:"2026-11-11T09:00:00.000Z",
  activityType:"strength",
};
const got=mapAuthorisedWatchWorkout(valid,now);
assert(got);
assert.equal(got.metric_key,"workout_sessions_7d");
assert.equal(got.source,"watch");
assert(got.origin_ref.startsWith("healthkit:"));
assert.equal(mapAuthorisedWatchWorkout({...valid,workoutId:"not-a-uuid"},now),null);
assert.equal(mapAuthorisedWatchWorkout({...valid,endedAt:"2026-11-11T08:00:15.000Z"},now),null);
assert.equal(mapAuthorisedWatchWorkout({...valid,endedAt:"2027-11-11T09:00:00.000Z"},now),null);
assert(overlapsWorkout(valid,{startedAt:"2026-11-11T08:30:00Z",endedAt:"2026-11-11T09:30:00Z"}));
assert(!overlapsWorkout(valid,{startedAt:"2026-11-11T10:00:00Z",endedAt:"2026-11-11T11:00:00Z"}));
console.log("PASS: watch summary contract, validation and overlap detection");
