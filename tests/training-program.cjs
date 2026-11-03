const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
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
      Date,
      Map,
      Set,
      Promise,
    },
  );
  return module.exports;
}
const identities = load("lib/exercise-identities.ts"),
  mock = load("mock/workouts.ts"),
  gym = load("lib/gym-library.ts", {
    "./exercise-identities": identities,
    "@/mock/workouts": mock,
  }),
  engine = load("lib/training-program.ts", {
    "./exercise-identities": identities,
  });
const library = gym.mergeGymExercises([]),
  p = { location: "Gym", experience: "beginner", goal: "strength" };
assert.equal(library.length, 16);
for (const days of [2, 3, 4, 5]) {
  const week = engine.buildTrainingWeek(library, { ...p, days });
  assert.equal(week.length, days);
  for (const day of week) {
    assert(day.exercises.length);
    assert.equal(
      new Set(day.exercises.map((e) => e.id)).size,
      day.exercises.length,
    );
    assert(day.exercises.every((e) => library.some((x) => x.id === e.id)));
    assert(!day.exercises.some((e) => e.id.includes("stretch")));
    assert(
      day.exercises.filter(
        (e) => engine.trainingProfile(e).pattern === "kneeFlexion",
      ).length <= 1,
    );
    assert(day.exercises.every((e) => e.sets === 2));
  }
}
const five = engine.buildTrainingWeek(library, { ...p, days: 5 });
assert(
  !five[0].exercises.some(
    (e) => engine.trainingProfile(e).pattern === "biceps",
  ),
);
assert(
  !five[1].exercises.some(
    (e) => engine.trainingProfile(e).pattern === "triceps",
  ),
);
assert(
  engine
    .buildTrainingWeek(library, { ...p, days: 3, location: "Home" })
    .every((d) => d.exercises.length === 0),
);
assert(
  engine
    .buildTrainingWeek(
      library.map((e) => ({ ...e, videoUrl: undefined, video_path: null })),
      { ...p, days: 3 },
    )
    .every((d) => d.exercises.length === 0),
);
const press = library.find((e) => e.id === "barbell-wide-bench-press");
assert.equal(
  engine.prescribeExercise(press, { ...p, days: 3, experience: "intermediate" })
    .reps,
  "5-8",
);
assert.equal(
  engine.prescribeExercise(press, { ...p, days: 3 }).rest_seconds,
  180,
);
assert.equal(
  engine.prescribeExercise(
    library.find((e) => e.id === "alternate-arm-leg-plank"),
    { ...p, days: 3 },
  ).reps,
  "20-30",
);
const renamed = gym.mergeGymExercises([
  {
    id: "server-id",
    name: "Bench press new title",
    video_path: "videos/e58cd798-a601-4743-9012-48d019f39d2f.mp4",
    location: "Gym",
  },
]);
assert.equal(renamed.length, 16);
assert.equal(renamed.find((e) => e.serverId === "server-id").id, press.id);
assert.equal(
  engine.trainingProfile(renamed.find((e) => e.serverId === "server-id"))
    .pattern,
  "press",
);
const store = load("store/workout-store.ts", {
  "@/mock/workouts": mock,
  "@react-native-async-storage/async-storage": {},
  "zustand/middleware": { persist: (fn) => fn, createJSONStorage: () => ({}) },
}).useWorkoutStore;
store
  .getState()
  .startGymWorkout(1, "Mixed A", [press.id], {
    [press.id]: { sets: 2, reps: "8-12", rest_seconds: 150 },
  });
assert.equal(store.getState().activeGymWorkout.prescriptions[press.id].sets, 2);
assert.equal(
  JSON.parse(JSON.stringify(store.getState().activeGymWorkout)).prescriptions[
    press.id
  ].rest_seconds,
  150,
);
console.log(
  "PASS 16 exercise identities, renamed uploads, 2–5 day plans, movement balance, video-only selection, no invented lower-body content, experience prescriptions and session snapshot",
);
