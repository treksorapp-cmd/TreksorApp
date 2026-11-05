export const discoveryTips = [
  {
    id: "welcome",
    title: "Start with how you feel.",
    body: "A quick daily check-in gives your Progress page a real starting point. There is no right score.",
    route: "/progress/daily-check-in",
    icon: "sunny-outline",
  },
  {
    id: "body",
    title: "Make movement your own.",
    body: "Build a routine around your schedule. Record your sets and let your own history guide the next session.",
    route: "/body/workout",
    icon: "barbell-outline",
  },
  {
    id: "mind",
    title: "Give your thoughts some space.",
    body: "Your private journal is a place to reflect, notice your mood and recognise small wins.",
    route: "/mental/myspace",
    icon: "book-outline",
  },
  {
    id: "balance",
    title: "Rest belongs in your routine.",
    body: "Try a short practice, take a breathing break or make room for better evenings.",
    route: "/spiritual",
    icon: "moon-outline",
  },
  {
    id: "purpose",
    title: "Choose a direction that matters.",
    body: "Turn an intention into a small next step. Your goals can evolve with you.",
    route: "/purpose/my-space",
    icon: "compass-outline",
  },
  {
    id: "mentor",
    title: "Think it through with Mentor.",
    body: "Explore ideas, reflect on your day and find a manageable next step with your AI companion.",
    route: "/(tabs)/chat",
    icon: "chatbubble-ellipses-outline",
  },
  {
    id: "community",
    title: "Find connection nearby.",
    body: "Choose a city to explore local activities, small groups and ways to meet people at your own pace.",
    route: "/(tabs)/community",
    icon: "people-outline",
  },
  {
    id: "progress",
    title: "Notice what you are building.",
    body: "See your recorded movement, check-ins and practices together. Missing data stays empty until you add it.",
    route: "/(tabs)/tracking",
    icon: "stats-chart-outline",
  },
] as const;
export type Tip = (typeof discoveryTips)[number];
export type DiscoveryState = {
  version: 1;
  startedAt: number;
  automatic: boolean;
  shown: Record<string, number>;
  visited: Record<string, number>;
  lastAutomaticAt: number | null;
};
export const freshDiscovery = (now = Date.now()): DiscoveryState => ({
  version: 1,
  startedAt: now,
  automatic: true,
  shown: {},
  visited: {},
  lastAutomaticAt: null,
});
export const discoveryKey = (owner: string) =>
  "treksor.discovery.v1." + encodeURIComponent(owner);
export const cleanPath = (path: string) =>
  path.replace(/\/\([^/]+\)/g, "").replace(/\/$/, "") || "/";
export function visitedTip(path: string) {
  const route = cleanPath(path);
  return discoveryTips.find(
    (t) =>
      route === cleanPath(t.route) ||
      route.startsWith(cleanPath(t.route) + "/"),
  );
}
const day = (stamp: number) => {
  const d = new Date(stamp);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};
export function nextDiscovery(
  state: DiscoveryState,
  now = Date.now(),
): Tip | undefined {
  const age = now - state.startedAt;
  if (!state.automatic || age < 0 || age >= 14 * 86400000) return;
  if (
    state.lastAutomaticAt !== null &&
    (now - state.lastAutomaticAt < 20 * 3600000 ||
      day(now) === day(state.lastAutomaticAt))
  )
    return;
  const unlocked = Math.max(
    Math.floor(age / 86400000),
    Object.keys({ ...state.shown, ...state.visited }).length,
  );
  return discoveryTips.find(
    (tip, i) => i <= unlocked && !state.shown[tip.id] && !state.visited[tip.id],
  );
}
export function parseDiscovery(raw: string | null): DiscoveryState {
  if (!raw) return freshDiscovery();
  const value = JSON.parse(raw);
  if (
    value.version !== 1 ||
    !Number.isFinite(value.startedAt) ||
    typeof value.automatic !== "boolean" ||
    !value.shown ||
    !value.visited ||
    (value.lastAutomaticAt !== null && !Number.isFinite(value.lastAutomaticAt))
  )
    throw Error("Invalid guide preferences");
  for (const map of [value.shown, value.visited])
    for (const [id, stamp] of Object.entries(map))
      if (
        !discoveryTips.some((t) => t.id === id) ||
        typeof stamp !== "number" ||
        !Number.isFinite(stamp)
      )
        throw Error("Invalid guide history");
  return value;
}
