import { dayKey, recentDays } from "@/lib/progress-metrics";

export type OutcomeId = "body" | "mind" | "balance" | "purpose" | "mentor";
export type Outcomes = {
  body: number;       // Workout session check-ins, last 7 local days
  mind: number;       // Private journal dates, last 7 local days
  balance: number;    // Distinct meditation practices marked complete, all time
  purpose: number;    // Days with a saved Today priority, last 7 local days
  mentor: number | null; // Assistant replies in the loaded conversation only
};

export interface OutcomeSources {
  checkIns: Record<string, string[]>;
  journalDays: string[];
  meditations: { id: string; isRead?: boolean }[];
  priorityDays: string[];
  mentorMessages: { role: string }[] | null;
}

export function measureOutcomes(input: OutcomeSources, now = new Date()): Outcomes {
  const validDays = new Set(recentDays(7, now));
  const sessions = new Set(
    Object.values(input.checkIns || {}).flat()
      .filter((value): value is string => typeof value === "string")
      .filter(value => Number.isFinite(new Date(value).getTime()))
      .filter(value => validDays.has(dayKey(new Date(value))))
  );
  return {
    body: sessions.size,
    mind: new Set(input.journalDays.filter(date => validDays.has(date))).size,
    balance: new Set(input.meditations.filter(item => item.isRead).map(item => item.id)).size,
    purpose: new Set(input.priorityDays.filter(date => validDays.has(date))).size,
    mentor: input.mentorMessages === null ? null : input.mentorMessages.filter(message => message.role === "assistant").length,
  };
}

export function nextMove(outcomes: Outcomes, todayHasPriority: boolean): {
  id: OutcomeId; title: string; detail: string;
} {
  if (!todayHasPriority) return {
    id: "purpose", title: "Choose today's direction", detail: "A clear priority turns intention into action.",
  };
  if (!outcomes.body) return {
    id: "body", title: "Make room for movement", detail: "Start or resume a training plan that fits your week.",
  };
  if (!outcomes.mind) return {
    id: "mind", title: "Capture one useful insight", detail: "Use your private journal to reflect, not to score yourself.",
  };
  if (!outcomes.balance) return {
    id: "balance", title: "Practice a moment of stillness", detail: "Explore your first Balance practice.",
  };
  if (outcomes.mentor === 0 || outcomes.mentor === null) return {
    id: "mentor", title: "Ask Mentor for perspective", detail: "Turn your progress into one manageable next step.",
  };
  return {
    id: "purpose", title: "Keep building your direction", detail: "Review your priorities and choose the next action.",
  };
}

// No journal text, moods, vision-board answers or private priority text here.
export function mentorProgressDraft(outcomes: Outcomes): string {
  return "Help me choose one realistic next action based on my Treksor activity. " +
    "In the last 7 days I recorded " + outcomes.body + " workout session(s), " +
    outcomes.mind + " private journal day(s), and " + outcomes.purpose +
    " day(s) with a saved priority. I have marked " + outcomes.balance +
    " distinct Balance practice(s) complete overall. " +
    "Please suggest one practical next step without treating these counts as a wellbeing score.";
}
