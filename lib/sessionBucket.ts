/** Group session labels for analytics charts (matches preset `id` values). */
export function bucketSession(session: string): string {
  const s = session.toLowerCase();
  if (s.includes("sydney")) return "Sydney";
  if (s.includes("tokyo") || s.includes("asia")) return "Tokyo (Asia)";
  if (s.includes("london")) return "London";
  if (s.includes("new york") || s === "ny") return "New York";
  return "Other";
}

/** Order used in session performance charts. */
export const SESSION_CHART_ORDER = [
  "Tokyo (Asia)",
  "London",
  "New York",
  "Sydney",
  "Other",
] as const;
