const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const file = "lib/connected-journey.ts";
const { outputText } = ts.transpileModule(fs.readFileSync(file, "utf8"), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS },
  reportDiagnostics: true,
});
const mod = { exports: {} };
const dayKey = date => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0"),
].join("-");
const recentDays = (count, now) => Array.from({ length: count }, (_, index) => {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
  d.setDate(d.getDate() - count + index + 1);
  return dayKey(d);
});
vm.runInNewContext(outputText, {
  module: mod, exports: mod.exports,
  require: spec => {
    if (spec === "@/lib/progress-metrics") return { dayKey, recentDays };
    throw Error("Unexpected import " + spec);
  },
  Date, Set, Object,
}, { filename: file });
const { measureOutcomes, nextMove, mentorProgressDraft } = mod.exports;
const now = new Date(2026, 10, 12, 12, 0);
const recent = new Date(2026, 10, 11, 12, 0).toISOString();
const older = new Date(2026, 9, 15, 12, 0).toISOString();
const stats = measureOutcomes({
  checkIns: { "1": [recent, recent, older] },
  journalDays: ["2026-11-10", "2026-11-11", "2026-11-11", "2026-10-01"],
  meditations: [{ id: "beginner", isRead: true }, { id: "beginner", isRead: true }, { id: "advanced" }],
  priorityDays: ["2026-11-12", "2026-11-11", "2026-11-11", "2026-10-31"],
  mentorMessages: [{ role: "user" }, { role: "assistant" }, { role: "user" }],
}, now);
assert.equal(stats.body, 1);
assert.equal(stats.mind, 2);
assert.equal(stats.balance, 1);
assert.equal(stats.purpose, 2);
assert.equal(stats.mentor, 1);
assert.equal(nextMove(stats, false).id, "purpose", "Today priority must come first");
assert.equal(nextMove({ ...stats, body: 0 }, true).id, "body");
assert.equal(nextMove({ ...stats, mind: 0 }, true).id, "mind");
assert.equal(nextMove({ ...stats, balance: 0 }, true).id, "balance");
assert.equal(nextMove({ ...stats, mentor: null }, true).id, "mentor");
const draft = mentorProgressDraft(stats);
assert(draft.includes("1 workout session(s)"));
assert(draft.includes("2 private journal day(s)"));
assert(!draft.includes("mood") && !draft.includes("journal text") && !draft.includes("vision answers"));
assert.equal(measureOutcomes({ checkIns: {}, journalDays: [], meditations: [], priorityDays: [], mentorMessages: null }, now).mentor, null);
console.log("PASS: connected journey counts, time scopes, deduplication, next move and private-data boundaries");
