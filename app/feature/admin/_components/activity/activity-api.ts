import { z } from "zod";

const eventSchema = z.object({
  id: z.string().uuid(), action: z.string(), resourceType: z.string().nullable(),
  resourceId: z.string().uuid().nullable(), actorUserId: z.string().uuid().nullable(),
  actorDisplayName: z.string().nullable(), createdAt: z.string(),
  before: z.record(z.string(), z.unknown()), after: z.record(z.string(), z.unknown()),
});
const pageSchema = z.object({
  content: z.array(eventSchema), number: z.number().int().nonnegative(),
  totalElements: z.number().int().nonnegative(), totalPages: z.number().int().nonnegative(),
});
export type ActivityEvent = z.infer<typeof eventSchema>;
export type ActivityFilters = { action: string; resourceType: string; actorId: string; from: string; to: string; page: number; size: number };
export const activityKeys = { root: ["admin", "activity"] as const };

export async function listActivity(filters: ActivityFilters) {
  const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size) });
  if (filters.action) params.set("action", filters.action);
  if (filters.resourceType) params.set("resourceType", filters.resourceType);
  if (filters.actorId) params.set("actorId", filters.actorId);
  if (filters.from) params.set("from", `${filters.from}T00:00:00.000Z`);
  if (filters.to) params.set("to", `${filters.to}T23:59:59.999Z`);
  let response: Response;
  try {
    response = await fetch(`/api/admin/audit-events?${params}`, { cache: "no-store", credentials: "same-origin", signal: AbortSignal.timeout(20000) });
  } catch { throw new Error("Activity is unavailable. Try again."); }
  if (!response.ok) throw new Error(response.status === 403 ? "Only administrators can view activity." : "Activity is unavailable. Try again.");
  const parsed = pageSchema.safeParse(await response.json().catch(() => null));
  if (!parsed.success) throw new Error("Navio returned an unreadable activity page.");
  return parsed.data;
}

export function activityLabel(action: string) {
  return action.toLowerCase().replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase());
}
