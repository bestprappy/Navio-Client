export function formatMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return "0 min";

  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}
