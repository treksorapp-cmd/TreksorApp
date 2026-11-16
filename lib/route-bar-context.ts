import { pillars, resolvePillar, type PillarKey } from "@/lib/pillar-navigation";

export type RouteBarIcon = "home-outline" | "today-outline" | "chatbubble-ellipses-outline"
  | "analytics-outline" | "people-outline" | "person-outline" | "grid-outline"
  | "document-text-outline" | "create-outline" | "barbell-outline" | "brain"
  | "leaf-outline" | "compass-outline";

export type RouteBarContext = {
  breadcrumb: string;
  icon: RouteBarIcon;
  sectionRoute: string;
  parentRoute: string;
  isHome: boolean;
};

const labels: Record<string, string> = {
  home: "Home", body: "Body", mental: "Mind", mind: "Mind", spiritual: "Balance",
  purpose: "Purpose", workout: "Gym", nutrition: "Nutrition", groceries: "Shopping List",
  library: "Exercise Library", exercises: "Exercises", "my-plan": "My Plan",
  guide: "Guide", progress: "Progress", journey: "Your Journey", session: "Session",
  today: "Today", chat: "Guide", tracking: "Progress", community: "Community",
  events: "Experiences", profile: "Profile", articles: "Articles", article: "Article",
  notes: "Quick Notes", settings: "Settings", "my-space": "My Space",
  myspace: "My Space", meditation: "Meditation", mediation: "Meditation",
  beginner: "Beginner", advanced: "Advanced", intermediate: "Intermediate",
  "vision-board": "Vision Board", "daily-practice": "Daily Practice",
  supplements: "Supplements", "beverage-details": "Beverages",
  "supplement-details": "Supplements", "meal-plans": "Meal Plans",
  "weekly-review": "Weekly Review", discover: "Discover", groups: "Groups",
  invites: "Invitations", messages: "Messages", sleep: "Sleep",
};

const topSections: Record<string, { label: string; icon: RouteBarIcon; route: string }> = {
  home: { label: "Home", icon: "grid-outline", route: "/(tabs)/home" },
  today: { label: "Today", icon: "today-outline", route: "/(tabs)/today" },
  chat: { label: "Guide", icon: "chatbubble-ellipses-outline", route: "/(tabs)/chat" },
  tracking: { label: "Progress", icon: "analytics-outline", route: "/(tabs)/tracking" },
  progress: { label: "Progress", icon: "analytics-outline", route: "/(tabs)/tracking" },
  community: { label: "Community", icon: "people-outline", route: "/(tabs)/community" },
  profile: { label: "Profile", icon: "person-outline", route: "/profile" },
  notes: { label: "Today", icon: "today-outline", route: "/(tabs)/today" },
  articles: { label: "Mind", icon: "brain", route: "/mental" },
  article: { label: "Mind", icon: "brain", route: "/mental" },
};

function cleanPart(part: string): string {
  if (labels[part]) return labels[part];
  // Dynamic identifiers can be sensitive and should never appear in global navigation.
  if (/^\[/.test(part) || /^[0-9a-f]{8}-[0-9a-f-]{16,}$/i.test(part) || /^\d+$/.test(part)) return "Details";
  try {
    return decodeURIComponent(part).replace(/[-_]+/g, " ").replace(/\b[a-z]/g, c => c.toUpperCase()).slice(0, 35);
  } catch {
    return "Details";
  }
}

export function routeBarContext(pathname: string, origin?: string): RouteBarContext {
  const safePath = (pathname || "/").split("?")[0].split("#")[0];
  const parts = safePath.split("/").filter(p => p && !/^\(.+\)$/.test(p) && p !== "index");
  if (!parts.length || parts[0] === "home") {
    return { breadcrumb: "Home", icon: "grid-outline", sectionRoute: "/(tabs)/home",
      parentRoute: "/(tabs)/home", isHome: true };
  }

  const pillar: PillarKey | undefined = resolvePillar("/" + parts.join("/"), origin);
  const base = pillar ? pillars[pillar] : topSections[parts[0]];
  const title = base?.name ?? base?.label ?? cleanPart(parts[0]);
  const sectionRoute = base?.route ?? "/(tabs)/home";
  const trail = pillar
    ? [title, ...parts.slice(1).map(cleanPart)]
    : parts[0] === "notes"
      ? ["Today", "Quick Notes", ...parts.slice(1).map(cleanPart)]
      : parts[0] === "articles" || parts[0] === "article"
        ? ["Mind", ...parts.map(cleanPart)]
        : [title, ...parts.slice(1).map(cleanPart)];

  // If opened directly from a deep link, back should return to a real parent.
  const parentRoute = parts.length > 1
    ? "/" + parts.slice(0, -1).join("/")
    : sectionRoute === "/" + parts[0] ? "/(tabs)/home" : sectionRoute;

  return {
    breadcrumb: trail.join(" / "),
    icon: (base?.icon ?? "grid-outline") as RouteBarIcon,
    sectionRoute,
    parentRoute,
    isHome: false,
  };
}
