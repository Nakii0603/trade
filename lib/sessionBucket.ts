/** Group session labels for analytics charts. */
export function bucketSession(session: string): string {
  const s = session.toLowerCase();
  if (s.includes("asia")) return "Asia";
  if (s.includes("london")) return "London";
  if (s.includes("new york") || s.includes("ny")) return "New York";
  return "Other";
}
