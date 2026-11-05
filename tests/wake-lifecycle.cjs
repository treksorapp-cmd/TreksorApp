const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
const tick = () => new Promise((resolve) => setImmediate(resolve));
function render({ playSound = true, deferred = false } = {}) {
  let effect,
    listener,
    unloaded = 0,
    played = 0,
    created = 0,
    resolveSound;
  const glow = [];
  const sound = {
    unloadAsync: async () => {
      unloaded++;
    },
    playAsync: async () => {
      played++;
    },
  };
  const mocks = {
    react: {
      useEffect: (fn) => (effect = fn),
      useState: (value) => [value, () => {}],
    },
    "react-native": {
      AppState: {
        addEventListener: (_, fn) => {
          listener = fn;
          return { remove() {} };
        },
      },
      ScrollView: "div",
      Text: "span",
      TouchableOpacity: "button",
      View: "div",
    },
    "expo-av": {
      Audio: {
        setAudioModeAsync: async () => {},
        Sound: {
          createAsync: async () => {
            created++;
            return deferred
              ? new Promise(
                  (resolve) => (resolveSound = () => resolve({ sound })),
                )
              : { sound };
          },
        },
      },
    },
    "@/lib/wake/brightness": {
      getBrightnessAsync: async () => 0.3,
      setBrightnessAsync: async (value) => glow.push(value),
    },
    "react-native-safe-area-context": {
      useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
    },
    "@/lib/wake/sounds": { wakeSounds: [{ id: "wake_01", source: 1 }] },
    "@/lib/wake/model": { wakeThemes: { gold: { color: "#D7B877" } } },
    "@/theme/architect": { colors: {}, type: {} },
    "./WakePulse": { __esModule: true, default: () => null },
  };
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync("components/wake/WakePlayer.tsx", "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          jsx: ts.JsxEmit.ReactJSX,
          esModuleInterop: true,
        },
      },
    ).outputText,
    {
      module,
      exports: module.exports,
      require: (id) => (id in mocks ? mocks[id] : require(id)),
      setTimeout: () => 1,
      clearTimeout: () => {},
    },
  );
  module.exports.default({
    settings: {
      sound: "wake_01",
      theme: "gold",
      motion: true,
      brightness: true,
    },
    preview: true,
    onClose() {},
    playSound,
  });
  const cleanup = effect();
  return {
    cleanup,
    background: () => listener("background"),
    release: () => resolveSound(),
    glow,
    stats: () => ({ unloaded, played, created }),
  };
}
(async () => {
  const normal = render();
  await tick();
  assert.equal(normal.stats().played, 1);
  assert.deepEqual(normal.glow, [0.75]);
  normal.background();
  await tick();
  assert.equal(normal.stats().unloaded, 1);
  assert.equal(normal.glow.at(-1), 0.3);
  normal.cleanup();
  const late = render({ deferred: true });
  await tick();
  late.cleanup();
  late.release();
  await tick();
  assert.equal(late.stats().played, 0);
  assert.equal(late.stats().unloaded, 1);
  assert.equal(late.glow.length, 0);
  const native = render({ playSound: false });
  await tick();
  assert.equal(
    native.stats().created,
    0,
    "Native system alarm must not get a second sound player",
  );
  assert.equal(native.glow[0], 0.75);
  native.cleanup();
  await tick();
  assert.equal(native.glow.at(-1), 0.3);
  console.log(
    "PASS wake preview background cleanup, brightness restoration, late audio cancellation and no duplicate native alarm audio",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
