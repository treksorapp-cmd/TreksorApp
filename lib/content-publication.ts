/** Editorial dates follow the publisher's Brisbane calendar, not the phone timezone. */
export function publicationDay(now = new Date()): string {
  return new Date(now.getTime() + 10 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
export function canonicalCategory(category: string): string {
  return category === "Mental" ? "Mind" : category === "Spiritual" ? "Balance" : category;
}
export function matchesCategory(articleCategory: string, category: string): boolean {
  return ["all", "default", "All Articles"].includes(category) || canonicalCategory(articleCategory) === canonicalCategory(category);
}
