import { dayKey, recentDays } from "@/lib/progress-metrics";

export type Focus = "body" | "mind" | "balance" | "purpose";
export type MonthlyInterest = "yes" | "maybe" | "not_yet";
export type PriceRange = "under_5" | "5_to_10" | "10_to_15" | "more_15" | "unsure";
export type PremiumReason = "personal_plans" | "deeper_progress" | "mentor" | "watch" | "none";

export interface InterestSurvey {
  interest: MonthlyInterest;
  price: PriceRange;
  feature: PremiumReason;
  updatedAt: string;
}

export const INTEREST_CHOICES: readonly MonthlyInterest[] = ["yes", "maybe", "not_yet"];
export const PRICE_CHOICES: readonly PriceRange[] = ["under_5", "5_to_10", "10_to_15", "more_15", "unsure"];
export const REASON_CHOICES: readonly PremiumReason[] = ["personal_plans", "deeper_progress", "mentor", "watch", "none"];

export function validateInterest(input: unknown): InterestSurvey | null {
  if (!input || typeof input !== "object") return null;
  const data = input as Partial<InterestSurvey>;
  if (!INTEREST_CHOICES.includes(data.interest as MonthlyInterest)) return null;
  if (!PRICE_CHOICES.includes(data.price as PriceRange)) return null;
  if (!REASON_CHOICES.includes(data.feature as PremiumReason)) return null;
  if (typeof data.updatedAt !== "string" || !Number.isFinite(Date.parse(data.updatedAt))) return null;
  return {
    interest: data.interest as MonthlyInterest,
    price: data.price as PriceRange,
    feature: data.feature as PremiumReason,
    updatedAt: data.updatedAt,
  };
}

export function weeklyRhythm(input: {
  priorities: string[];
  journalDays: string[];
  workoutTimestamps: string[];
}, now = new Date()) {
  const days = recentDays(7, now);
  const allowed = new Set(days);
  const events: string[] = [
    ...input.priorities,
    ...input.journalDays,
    ...input.workoutTimestamps.filter(stamp => Number.isFinite(new Date(stamp).getTime())).map(stamp => dayKey(new Date(stamp))),
  ];
  const active = new Set(events.filter(date => allowed.has(date)));
  return {
    days,
    activeDays: days.filter(day => active.has(day)),
    count: active.size,
    // no streak or performance score: days without records are neutral.
    message: active.size === 0
      ? "Start with one useful action. You can return whenever it suits you."
      : active.size === 1
        ? "One recorded day. Choose one next step at your own pace."
        : active.size + " days with recorded activity. What would help next week?",
  };
}

export function interestShareText(answers: InterestSurvey): string {
  const clean = validateInterest(answers);
  if (!clean) throw new Error("Choose an option for every question before sharing.");
  return [
    "TREKSOR — voluntary premium research feedback",
    "Would consider paying monthly: " + clean.interest,
    "Hypothetical monthly price (USD): " + clean.price,
    "Most interesting possible feature: " + clean.feature,
    "This is research feedback, not a purchase, preorder or commitment.",
    "No account identifier, journal text, personal priority or health data is included.",
  ].join("\n");
}
