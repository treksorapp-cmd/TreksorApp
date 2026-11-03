import { exerciseIdentity } from "./exercise-identities";
import type { GymExercise } from "./gym-library";
export type TrainingPreferences = {
  days: number;
  location: string;
  goal?: string;
  experience?: string;
};
type Pattern =
  | "press"
  | "row"
  | "pull"
  | "shoulders"
  | "triceps"
  | "biceps"
  | "kneeFlexion"
  | "core"
  | "mobility";
const profiles: Record<
  string,
  { pattern: Pattern; equipment: string; compound?: boolean; cue: string }
> = {
  "barbell-wide-bench-press": {
    pattern: "press",
    equipment: "Barbell",
    compound: true,
    cue: "Use a comfortable grip and a controlled range. Ask for a spotter when needed.",
  },
  "cable-bar-lateral-pulldown": {
    pattern: "pull",
    equipment: "Cable",
    compound: true,
    cue: "Keep your torso steady. Pull in front of you without swinging the weight.",
  },
  "cable-middle-fly": {
    pattern: "press",
    equipment: "Cable",
    cue: "Keep a soft elbow bend. Use a comfortable shoulder range.",
  },
  "cable-seated-supine-grip-row": {
    pattern: "row",
    equipment: "Cable",
    compound: true,
    cue: "Keep your torso steady and guide the elbows back without jerking.",
  },
  "cable-triceps-pushdown-ez-bar-close-grip": {
    pattern: "triceps",
    equipment: "Cable",
    cue: "Keep your upper arms steady and extend your elbows with control.",
  },
  "dumbbell-incline-triceps-extension": {
    pattern: "triceps",
    equipment: "Dumbbells",
    cue: "Choose a light load and keep the movement comfortable at the elbows.",
  },
  "dumbbell-hammer-curl": {
    pattern: "biceps",
    equipment: "Dumbbells",
    cue: "Keep a neutral grip and avoid using momentum.",
  },
  "preacher-curl-ez-bar-wide-grip": {
    pattern: "biceps",
    equipment: "EZ bar",
    cue: "Keep your upper arms supported. Lower the weight without dropping it.",
  },
  "dumbbell-lateral-raises": {
    pattern: "shoulders",
    equipment: "Dumbbells",
    cue: "Use a light load and lead with your elbows without shrugging.",
  },
  "standing-dumbbell-shoulder-press": {
    pattern: "shoulders",
    equipment: "Dumbbells",
    compound: true,
    cue: "Brace your trunk and press through a comfortable range without leaning back.",
  },
  "lying-leg-curl-machine": {
    pattern: "kneeFlexion",
    equipment: "Machine",
    cue: "Align the machine to your knees. Keep your hips supported and lower slowly.",
  },
  "seated-leg-curl-machine": {
    pattern: "kneeFlexion",
    equipment: "Machine",
    cue: "Adjust the pads and seat first. Curl and return with control.",
  },
  "alternate-arm-leg-plank": {
    pattern: "core",
    equipment: "Bodyweight",
    cue: "Keep your pelvis steady. Shorten the hold when control starts to fade.",
  },
  "captains-chair-leg-raise": {
    pattern: "core",
    equipment: "Bodyweight",
    cue: "Move without swinging. Bend your knees if needed to keep control.",
  },
  "dumbbell-side-bend": {
    pattern: "core",
    equipment: "Dumbbell",
    cue: "Use a comfortable range and avoid twisting or bouncing.",
  },
  "dumbbell-rear-lunge-stretch": {
    pattern: "mobility",
    equipment: "Dumbbells",
    cue: "This uploaded name includes “stretch”. Review the demonstration before adding it to strength work.",
  },
};
const normalise = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]/g, "")
    .replace("latpulldown", "lateralpulldown");
export function trainingProfile(e: GymExercise) {
  const key =
    exerciseIdentity(e.video_path) ||
    exerciseIdentity(e.videoUrl) ||
    Object.keys(profiles).find(
      (id) =>
        normalise(id) === normalise(e.id) ||
        normalise(id) === normalise(e.name),
    );
  return key ? profiles[key] : undefined;
}
export function prescribeExercise(
  e: GymExercise,
  p: TrainingPreferences,
): GymExercise {
  const profile = trainingProfile(e);
  if (!profile) return e;
  const compound = !!profile.compound,
    beginner = !p.experience || p.experience === "beginner";
  return {
    ...e,
    equipment: e.equipment || profile.equipment,
    sets: beginner ? 2 : 3,
    reps:
      e.metric === "seconds"
        ? "20-30"
        : p.goal === "strength" && compound && !beginner
          ? "5-8"
          : compound
            ? "8-12"
            : profile.pattern === "core"
              ? "8-12"
              : "10-15",
    rest_seconds: compound
      ? p.goal === "strength"
        ? 180
        : 150
      : profile.pattern === "core"
        ? 60
        : 90,
  };
}
const plans: Record<number, { name: string; slots: Pattern[] }[]> = {
  2: [
    {
      name: "Mixed A",
      slots: ["press", "row", "kneeFlexion", "shoulders", "core"],
    },
    {
      name: "Mixed B",
      slots: ["pull", "press", "kneeFlexion", "biceps", "core"],
    },
  ],
  3: [
    { name: "Mixed A", slots: ["press", "row", "kneeFlexion", "core"] },
    { name: "Mixed B", slots: ["pull", "shoulders", "kneeFlexion", "triceps"] },
    {
      name: "Mixed C",
      slots: ["press", "row", "kneeFlexion", "biceps", "core"],
    },
  ],
  4: [
    { name: "Upper A", slots: ["press", "row", "shoulders", "triceps"] },
    { name: "Lower & core A", slots: ["kneeFlexion", "core"] },
    { name: "Upper B", slots: ["pull", "press", "shoulders", "biceps"] },
    { name: "Lower & core B", slots: ["kneeFlexion", "core"] },
  ],
  5: [
    { name: "Push", slots: ["press", "shoulders", "triceps"] },
    { name: "Pull", slots: ["row", "pull", "biceps"] },
    { name: "Lower & core", slots: ["kneeFlexion", "core"] },
    { name: "Upper", slots: ["press", "row", "shoulders", "biceps"] },
    { name: "Lower & core B", slots: ["kneeFlexion", "core"] },
  ],
};
export function buildTrainingWeek(
  library: GymExercise[],
  preferences: TrainingPreferences,
) {
  const available = library.filter(
    (e) =>
      (e.location === preferences.location || e.location === "Both") &&
      !!(e.video_path || e.videoUrl) &&
      trainingProfile(e)?.pattern !== "mobility",
  );
  return (plans[preferences.days] || plans[3]).map((day, i) => {
    const used = new Set<string>();
    const exercises = day.slots.flatMap((pattern) => {
      const pool = available
        .filter(
          (e) => trainingProfile(e)?.pattern === pattern && !used.has(e.id),
        )
        .sort(
          (a, b) =>
            Number(!!trainingProfile(b)?.compound) -
            Number(!!trainingProfile(a)?.compound),
        );
      const choice =
        pool[pattern === "press" ? 0 : i % Math.max(pool.length, 1)];
      if (!choice) return [];
      used.add(choice.id);
      return [prescribeExercise(choice, preferences)];
    });
    return {
      ...day,
      exercises,
      missing: day.slots.filter(
        (pattern) =>
          !exercises.some((e) => trainingProfile(e)?.pattern === pattern),
      ),
    };
  });
}
export const catalogueGaps =
  "Your uploaded library covers upper body, hamstrings and core. A complete lower-body plan still needs verified squat, hip-hinge and calf exercises. These routines show the available work only.";
export const trainingGuidance =
  "Start with a light warm-up. Keep about 2–3 controlled reps in reserve. When every working set reaches the top of the range with good technique, consider the smallest available weight increase next time. Leave a rest day between mixed sessions; stop if a movement hurts.";
export function sessionMinutes(exercises: GymExercise[]) {
  return Math.ceil(
    exercises.reduce((n, e) => n + e.sets * (45 + e.rest_seconds), 0) / 60 + 5,
  );
}
