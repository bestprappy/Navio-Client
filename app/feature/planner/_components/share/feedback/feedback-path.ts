/** Guide identities are namespaced so feedback caches cannot collide with plans. */
export function feedbackPath(token: string): string {
  const guide = /^guide:(CURATED|TRAVELER):([0-9a-f-]{36})$/i.exec(token);
  return guide
    ? `/api/traveler-guides/discovery/${guide[1].toUpperCase()}/${guide[2]}/feedback`
    : `/api/shared-plans/${encodeURIComponent(token)}/feedback`;
}
