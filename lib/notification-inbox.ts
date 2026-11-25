export type NoticeKind = "thought" | "article" | "reminder" | "update";
export type Notice = { id: string; kind: NoticeKind; title: string; route: string; date: string; read?: boolean; owner?: string };
export const noticeCount = (items: Notice[]) => items.filter(item => !item.read).length;
export function safeNoticeRoute(route: unknown): string | null {
  if (typeof route !== "string" || route.includes("..") || route.includes("\\") || route.includes("://")) return null;
  return /^\/(?:mental(?:\/[^?#]*)?|article(?:\/[^/?#]+)?|notes|body(?:\/[^?#]*)?|spiritual(?:\/[^?#]*)?|purpose(?:\/[^?#]*)?|community(?:\/[^?#]*)?|\(tabs\)\/(?:home|tracking|community|articles)(?:\/[^?#]*)?)(?:\?[^#]*)?$/.test(route) ? route : null;
}
export function noticeFromNotification(identifier: string, content: { title?: string | null; body?: string | null; data?: Record<string, unknown> }, date = new Date().toISOString()): Notice | null {
  const d = content.data || {};
  if (d.kind === "treksor-wake") return null; // WakeRuntime owns active alarms.
  const owner = typeof d.owner === "string" ? d.owner : undefined;
  if (d.type === "powerThought" || d.treksorDailyThought === true) {
    const id = d.powerThoughtId || d.thoughtId;
    return { id: `thought:${typeof id === "string" ? id : identifier}`, kind: "thought", title: String(d.thought || content.body || "Power Thought"), route: "/mental/thoughts", date, owner };
  }
  if (d.type === "article" && typeof d.articleId === "string") return { id: `article:${d.articleId}`, kind: "article", title: content.title || "New article", route: `/article/${encodeURIComponent(d.articleId)}`, date, owner };
  if (d.source === "quick-notes") return { id: `reminder:${typeof d.noteId === "string" ? d.noteId : identifier}`, kind: "reminder", title: content.body || "Quick Notes reminder", route: "/notes", date, owner };
  const route = safeNoticeRoute(d.route);
  return route ? { id: `notification:${identifier}`, kind: "update", title: content.title || "Treksor update", route, date, owner } : null;
}
export function mergeNotices(current: Notice[], incoming: Notice[], read: Record<string, true>): Notice[] {
  const merged = new Map(current.map(item => [item.id, item]));
  for (const item of incoming) merged.set(item.id, { ...item, read: !!(read[item.id] || item.read || merged.get(item.id)?.read) });
  return [...merged.values()].sort((a,b) => b.date.localeCompare(a.date));
}
