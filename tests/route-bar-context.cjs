const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const file = "lib/route-bar-context.ts";
const source = fs.readFileSync(file,"utf8");
const output = ts.transpileModule(source,{compilerOptions:{
  module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2020
}});
const mod = { exports: {} };
const pillarMap = {
  body:{name:"Body",route:"/body",icon:"barbell-outline"},
  mind:{name:"Mind",route:"/mental",icon:"brain"},
  balance:{name:"Balance",route:"/spiritual",icon:"leaf-outline"},
  purpose:{name:"Purpose",route:"/purpose",icon:"compass-outline"},
};
const resolvePillar = (path,origin) => {
  if(path==="/purpose"||path.startsWith("/purpose/"))return "purpose";
  if(path==="/body"||path.startsWith("/body/"))return "body";
  if(path==="/spiritual"||path.startsWith("/spiritual/"))return "balance";
  if(path.startsWith("/mental/myspace")&&origin==="purpose")return "purpose";
  if(path==="/mental"||path.startsWith("/mental/")||path.startsWith("/mind/"))return "mind";
};
vm.runInNewContext(output.outputText,{
  module:mod,exports:mod.exports,
  require(name){
    if(name==="@/lib/pillar-navigation")return{pillars:pillarMap,resolvePillar};
    throw new Error("Unexpected import "+name);
  }
},{filename:file});
const context=mod.exports.routeBarContext;
assert.equal(context("/body/workout").breadcrumb,"Body / Gym");
assert.equal(context("/body/workout").icon,"barbell-outline");
assert.equal(context("/body/workout").parentRoute,"/body");
assert.equal(context("/body/workout/my-plan").breadcrumb,"Body / Gym / My Plan");
assert.equal(context("/body/nutrition/groceries").breadcrumb,"Body / Nutrition / Shopping List");
assert.equal(context("/mental").icon,"brain");
assert.equal(context("/mental/myspace").breadcrumb,"Mind / My Space");
assert.equal(context("/mental/myspace","purpose").breadcrumb,"Purpose / My Space");
assert.equal(context("/spiritual/mediation/beginner").breadcrumb,"Balance / Meditation / Beginner");
assert.equal(context("/purpose").icon,"compass-outline");
assert.equal(context("/(tabs)/chat").breadcrumb,"Guide");
assert.equal(context("/(tabs)/today").breadcrumb,"Today");
assert.equal(context("/notes").breadcrumb,"Today / Quick Notes");
assert.equal(context("/progress/journey").breadcrumb,"Progress / Your Journey");
assert.equal(context("/community/events").breadcrumb,"Community / Experiences");
assert.equal(context("/").isHome,true);
assert.equal(context("/(tabs)/home").isHome,true);
assert.equal(context("/articles/8f8a92c1-671b-4ee0-9e36-47f88b6dbd6f").breadcrumb,"Mind / Articles / Details");
assert(!context("/articles/8f8a92c1-671b-4ee0-9e36-47f88b6dbd6f").breadcrumb.includes("8f8a"));
console.log("PASS: fixed navigation labels, section icons, deep-link parents, and hidden identifiers");
