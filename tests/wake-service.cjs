const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript"),
  crypto = require("node:crypto");
process.env.TZ = "America/New_York";
let now = Date.parse("2026-11-03T06:00:00-05:00");
class Clock extends Date {
  constructor(...v) {
    super(...(v.length ? v : [now]));
  }
  static now() {
    return now;
  }
}
function load(file, mocks = {}) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText,
    {
      exports: module.exports,
      module,
      require: (id) => (id in mocks ? mocks[id] : require(id)),
      Date: Clock,
      Map,
      Set,
      Promise,
    },
  );
  return module.exports;
}
const model = load("lib/wake/model.ts"),
  s = model.defaultWake;
for (const patch of [
  { hour: 24 },
  { hour: -1 },
  { minute: 60 },
  { sound: "../../secret" },
  { theme: "bad" },
  { brightness: "yes" },
])
  assert.throws(() => model.validateWake({ ...s, ...patch }));
assert.equal(new Date(model.nextWakeTime(s)).getHours(), 7);
assert(model.nextWakeTime({ ...s, hour: 5 }) > now + 22 * 3600000);
const dst = new Date("2026-03-07T08:00:00-05:00");
assert.equal(
  model.nextWakeTime(s, dst) - dst.getTime(),
  22 * 3600000,
  "next local morning across DST",
);
function setup(nativeEnabled = false, os = "ios") {
  const store = new Map(),
    active = new Map(),
    calls = [];
  let granted = true,
    failWrite = false,
    failCancel = false,
    n = 0;
  const native = {
    isAvailable: () => true,
    schedule: async (id, at, sound) => {
      active.set(id, { at, sound });
      calls.push("schedule");
    },
    scheduledIds: async () => [...active.keys()],
    alertingIds: async () =>
      [...active.keys()].filter((id) => active.get(id).at <= now),
    cancel: async (id) => {
      if (failCancel) throw Error("cannot cancel");
      active.delete(id);
    },
    openClock: async () => {
      calls.push("clock");
      return "review-in-clock";
    },
  };
  const notifications = {
    requestPermissionsAsync: async () => ({ granted }),
    scheduleNotificationAsync: async (config) => {
      active.set(config.identifier, { at: config.trigger.date.getTime() });
      return config.identifier;
    },
    cancelScheduledNotificationAsync: async (id) => active.delete(id),
    getAllScheduledNotificationsAsync: async () =>
      [...active.keys()].map((identifier) => ({ identifier })),
    SchedulableTriggerInputTypes: { DATE: "date" },
    setNotificationChannelAsync: async () => {},
    AndroidImportance: { HIGH: 4 },
    AndroidAudioUsage: { ALARM: 4 },
  };
  const api = load("lib/wake/service.ts", {
    "./model": model,
    "@react-native-async-storage/async-storage": {
      getItem: async (k) => store.get(k) || null,
      setItem: async (k, v) => {
        if (failWrite) throw Error("disk full");
        store.set(k, v);
      },
    },
    "react-native": { Platform: { OS: os } },
    "expo-modules-core": {
      requireOptionalNativeModule: (name) =>
        name === "ExpoCrypto"
          ? { randomUUID: () => String(++n) }
          : nativeEnabled
            ? native
            : null,
    },
    "expo-notifications": notifications,
    "expo-crypto": { randomUUID: () => String(++n) },
  });
  return {
    api,
    active,
    store,
    calls,
    permission: (v) => (granted = v),
    diskFailure: (v) => (failWrite = v),
    cancelFailure: (v) => (failCancel = v),
  };
}
(async () => {
  const a = setup();
  a.permission(false);
  await assert.rejects(a.api.scheduleWake(s));
  assert.equal(a.active.size, 0);
  assert.equal((await a.api.readWake()).scheduled, null);
  a.permission(true);
  const first = await a.api.scheduleWake(s);
  assert.equal(first.kind, "reminder");
  const second = await a.api.scheduleWake({ ...s, sound: "wake_02" });
  assert.equal(a.active.size, 1);
  assert.notEqual(first.id, second.id);
  await a.api.cancelWake(first.id);
  assert.equal(a.active.size, 1, "stale overlay cannot cancel a replacement");
  await a.api.saveWakeSettings({ ...s, sound: "wake_03" });
  assert.equal((await a.api.readWake()).scheduled.settings.sound, "wake_02");
  now = second.at + 1000;
  assert.equal((await a.api.wakeForNotification(second.id)).id, second.id);
  assert.equal(await a.api.wakeForNotification(first.id), null);
  now += 11 * 60000;
  assert.equal(await a.api.wakeForNotification(second.id), null);
  await a.api.cancelWake();
  assert.equal(a.active.size, 0);
  const b = setup(true);
  const alarm = await b.api.scheduleWake(s);
  assert.equal(alarm.kind, "alarmkit");
  now = alarm.at + 1000;
  assert.equal((await b.api.currentAlert()).id, alarm.id);
  b.active.delete(alarm.id);
  assert.equal((await b.api.refreshWake()).scheduled, null);
  const c = setup();
  c.diskFailure(true);
  await assert.rejects(c.api.scheduleWake(s));
  assert.equal(
    c.active.size,
    0,
    "failed persist rolls back newly scheduled alert",
  );
  const d = setup(true, "android");
  assert.equal(await d.api.scheduleWake(s), null);
  assert.deepEqual(d.calls, ["clock"]);
  assert.equal(
    (await d.api.readWake()).scheduled,
    null,
    "Clock handoff must not claim an alarm was saved",
  );
  const e = setup();
  await Promise.all([
    e.api.scheduleWake(s),
    e.api.scheduleWake({ ...s, hour: 8 }),
  ]);
  assert.equal(e.active.size, 1, "concurrent requests serialize");
  assert.equal((await e.api.readWake()).scheduled.settings.hour, 8);
  const manifest = JSON.parse(
    fs.readFileSync("assets/audio/wake/provenance.json"),
  );
  assert.equal(manifest.sounds.length, 15);
  const hashes = new Set();
  for (const sound of manifest.sounds) {
    const data = fs.readFileSync(`assets/audio/wake/${sound.id}.wav`);
    assert.equal(data.toString("ascii", 0, 4), "RIFF");
    assert.equal(data.toString("ascii", 8, 12), "WAVE");
    const hash = crypto.createHash("sha256").update(data).digest("hex");
    assert.equal(hash, sound.sha256);
    hashes.add(hash);
    let offset = 12,
      fmt,
      bytes;
    while (offset + 8 <= data.length) {
      const name = data.toString("ascii", offset, offset + 4),
        size = data.readUInt32LE(offset + 4);
      if (name === "fmt ") fmt = offset + 8;
      if (name === "data") bytes = size;
      offset += 8 + size + (size % 2);
    }
    assert.equal(data.readUInt16LE(fmt), 1);
    assert.equal(data.readUInt16LE(fmt + 14), 16);
    assert.equal(bytes / data.readUInt32LE(fmt + 8), 16);
  }
  assert.equal(hashes.size, 15);
  console.log(
    "PASS wake validation, local/DST dates, denied permissions, replacement, stale-stop guard, preference snapshots, rollback, native reconciliation, Clock handoff, concurrency and 15 unique licensed PCM sounds",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
