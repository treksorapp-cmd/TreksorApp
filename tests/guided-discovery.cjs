const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const moduleBox = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/guided-discovery.ts", "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText,
  { module: moduleBox, exports: moduleBox.exports, Date },
);
const m = moduleBox.exports,
  now = new Date("2026-11-03T09:00:00").getTime(),
  s = m.freshDiscovery(now);
assert.equal(m.nextDiscovery(s, now).id, "welcome");
s.shown.welcome = now;
s.lastAutomaticAt = now;
assert.equal(m.nextDiscovery(s, now + 19 * 3600000), undefined);
assert.equal(m.nextDiscovery(s, now + 24 * 3600000).id, "body");
assert.equal(
  m.nextDiscovery({ ...s, automatic: false }, now + 24 * 3600000),
  undefined,
);
assert.equal(m.nextDiscovery(s, now + 14 * 86400000), undefined);
assert.equal(
  m.nextDiscovery(
    { ...s, visited: { body: now, mind: now } },
    now + 24 * 3600000,
  ).id,
  "balance",
);
assert.equal(m.visitedTip("/(tabs)/community").id, "community");
assert.equal(m.visitedTip("/mental/myspace/new-entry").id, "mind");
assert.equal(m.visitedTip("/mental/myspace-extra"), undefined);
assert.notEqual(m.discoveryKey("a"), m.discoveryKey("b"));
assert.throws(() => m.parseDiscovery('{"version":1}'));
assert.equal(m.parseDiscovery(JSON.stringify(s)).startedAt, now);
for (const tip of m.discoveryTips) {
  const p = "app" + m.cleanPath(tip.route);
  assert(
    fs.existsSync(p + ".tsx") ||
      fs.existsSync(p + "/index.tsx") ||
      fs.existsSync("app" + tip.route + "/index.tsx"),
    tip.route,
  );
}
console.log(
  "PASS discovery pacing, early exploration, opt-out, expiry, route boundaries, account keys and real destinations",
);
const profileBox = { exports: {} };
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync("lib/journey-profile.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText,
  { module: profileBox, exports: profileBox.exports, Date },
);
const profile = profileBox.exports;
const blank = profile.readJourneyProfile(null);
assert.equal(profile.nextProfilePrompt(blank, now), "start");
const answered = { ...blank, goal: "muscle", lastAskedAt: now };
assert.equal(profile.nextProfilePrompt(answered, now + profile.reviewInterval - 1), null);
assert.equal(profile.nextProfilePrompt(answered, now + profile.reviewInterval), "schedule");
assert.equal(profile.nextProfilePrompt({ ...answered, reviews: 1 }, now + profile.reviewInterval), "meals");
assert.equal(profile.nextProfilePrompt({ ...answered, reviews: 2 }, now + profile.reviewInterval), "goal");
assert.equal(profile.nextProfilePrompt({ ...answered, reminders: false }, now + profile.reviewInterval), null);
assert.equal(profile.nextProfilePrompt({ ...blank, lastAskedAt: now }, now + 86400000), null, "Skipping also starts the cooldown");
assert.throws(() => profile.readJourneyProfile(JSON.stringify({ ...answered, trainingDays: 8 })));
assert.notEqual(profile.profileKey("a"), profile.profileKey("b"));
assert.equal(profile.profileNextStep("muscle").route, "/body/workout/guide");
assert.equal(profile.profileNextStep("weight").route, "/body/nutrition/meal-ideas");
console.log("PASS optional profile setup, monthly review rotation, skipping, account keys and focus destinations");
