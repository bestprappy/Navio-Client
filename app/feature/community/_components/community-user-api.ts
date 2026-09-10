import { z } from "zod";

const publicProfileSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string(),
  avatarMediaId: z.string().uuid().nullable(),
  memberSince: z.string(),
});

export async function getCommunityUser(userId: string, signal: AbortSignal) {
  try {
    const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: AbortSignal.any([signal, AbortSignal.timeout(20_000)]),
    });
    if (!response.ok)
      throw new Error(`Member profile request failed (${response.status}).`);
    return publicProfileSchema.parse(await response.json());
  } catch (error) {
    if (!signal.aborted)
      console.error("Community member profile could not load", {
        userId,
        error,
      });
    throw error;
  }
}
