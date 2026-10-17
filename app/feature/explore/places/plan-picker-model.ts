type PlanChoice = {
  id: string;
  updatedAt?: string;
  displayName?: string | null;
  title?: string | null;
  destinationName: string;
};

export function preferredRecentPlanId(
  ownerId: string | undefined,
  recent: { ownerId: string; planId: string } | null,
  connectedId?: string,
) {
  return recent && ownerId && recent.ownerId === ownerId
    ? recent.planId
    : connectedId || null;
}

export function groupPlanChoices<T extends PlanChoice>(
  plans: T[],
  recentId: string | null,
  search: string,
) {
  const unique = [
    ...new Map(plans.map((plan) => [plan.id, plan])).values(),
  ].sort(
    (a, b) =>
      (b.updatedAt || "").localeCompare(a.updatedAt || "") ||
      a.id.localeCompare(b.id),
  );
  const latest = unique.find((plan) => plan.id === recentId) ?? unique[0];
  const query = search.trim().toLocaleLowerCase();
  const matches = (plan: T) =>
    [plan.displayName, plan.title, plan.destinationName].some((value) =>
      value?.toLocaleLowerCase().includes(query),
    );
  return {
    latest: latest && matches(latest) ? latest : undefined,
    trips: unique.filter((plan) => plan.id !== latest?.id && matches(plan)),
  };
}
