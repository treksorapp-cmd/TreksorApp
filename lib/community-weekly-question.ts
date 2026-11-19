/**
 * One gentle invitation per week for the Community city search.
 * Local Monday is the boundary, independent of server availability, account,
 * location permissions or the selected city. A fixed Monday anchor avoids
 * repeating the same question around years with an ISO week 53.
 */
export const COMMUNITY_WEEKLY_QUESTIONS = [
  'What would you like to explore today?',
  'What activity would you like to do?',
] as const;

const MONDAY_ANCHOR = Date.UTC(2026, 10, 16);
const DAY_MS = 24 * 60 * 60 * 1000;

export function communityQuestionForWeek(date: Date = new Date()): typeof COMMUNITY_WEEKLY_QUESTIONS[number] {
  if (!Number.isFinite(date.getTime())) return COMMUNITY_WEEKLY_QUESTIONS[0];
  // Start from the user's local calendar date, not UTC; midnight Mondays are local.
  const localDay = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const weekday = new Date(localDay).getUTCDay();
  const monday = localDay - ((weekday + 6) % 7) * DAY_MS;
  const weeks = Math.round((monday - MONDAY_ANCHOR) / (7 * DAY_MS));
  return COMMUNITY_WEEKLY_QUESTIONS[((weeks % 2) + 2) % 2];
}
