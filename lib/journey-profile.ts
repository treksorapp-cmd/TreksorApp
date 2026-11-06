export const goals = [
  { id: "muscle", label: "Build muscle", detail: "Make strength training and your recorded sets easier to find." },
  { id: "weight", label: "Manage my weight", detail: "Organize meals and movement around routines you choose." },
  { id: "movement", label: "Move more consistently", detail: "Start with movement that fits your week." },
  { id: "balance", label: "Make time to unwind", detail: "Find a short practice you can return to." },
] as const;

export type ProfileGoal = (typeof goals)[number]["id"];
export type ProfilePrompt = "start" | "goal" | "schedule" | "meals";
export type JourneyProfile = {
  version: 1;
  goal: ProfileGoal | null;
  trainingDays: number | null;
  mealMinutes: 15 | 30 | null;
  reminders: boolean;
  lastAskedAt: number | null;
  reviews: number;
};

export const profileKey = (owner: string) => "treksor.journey-profile.v1." + encodeURIComponent(owner);

export function readJourneyProfile(raw: string | null): JourneyProfile {
  if (!raw) return { version: 1, goal: null, trainingDays: null, mealMinutes: null, reminders: true, lastAskedAt: null, reviews: 0 };
  const value = JSON.parse(raw);
  if (!value || value.version !== 1 || (value.goal !== null && !goals.some((goal) => goal.id === value.goal))
      || (value.trainingDays !== null && ![2, 3, 4, 5].includes(value.trainingDays))
      || (value.mealMinutes !== null && ![15, 30].includes(value.mealMinutes))
      || typeof value.reminders !== "boolean"
      || (value.lastAskedAt !== null && (!Number.isFinite(value.lastAskedAt) || value.lastAskedAt < 0))
      || !Number.isInteger(value.reviews) || value.reviews < 0) {
    throw new Error("Invalid journey profile");
  }
  return value;
}

const reviewCycle = ["schedule", "meals", "goal"] as const;
export const reviewInterval = 28 * 86400000;

export function nextProfilePrompt(profile: JourneyProfile, now = Date.now()): ProfilePrompt | null {
  if (!profile.reminders) return null;
  if (profile.lastAskedAt !== null && now - profile.lastAskedAt < reviewInterval) return null;
  if (!profile.goal) return "start";
  return reviewCycle[profile.reviews % reviewCycle.length];
}

export function profileNextStep(goal: ProfileGoal | null) {
  switch (goal) {
    case "muscle":
      return { title: "Review your training plan", detail: "Start with the days you can train and use your recorded sets to follow your progress.", route: "/body/workout/guide" } as const;
    case "weight":
      return { title: "Make one meal easier to plan", detail: "Browse meal ideas and build a routine you can keep coming back to.", route: "/body/nutrition/meal-ideas" } as const;
    case "movement":
      return { title: "Choose a way to move", detail: "Explore movement and choose what fits your schedule.", route: "/body/workout" } as const;
    case "balance":
      return { title: "Find a moment to reset", detail: "Browse Balance and choose a practice to try.", route: "/spiritual" } as const;
    default:
      return null;
  }
}
