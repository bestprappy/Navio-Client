import { COMMUNITY_REACTIONS } from "./community-post-api";
import type { CommunityReaction, CommunityReactionSummary } from "./data";

/** Applies a reaction toggle to one comment's summary list, keeping display order. */
export function toggleReaction(reactions: CommunityReactionSummary[], reaction: CommunityReaction, active: boolean): CommunityReactionSummary[] {
  const existing = reactions.find((item) => item.reaction === reaction);
  if (active) {
    if (existing?.reacted) return reactions;
    const next = existing
      ? reactions.map((item) => item.reaction === reaction ? { ...item, count: item.count + 1, reacted: true } : item)
      : [...reactions, { reaction, count: 1, reacted: true }];
    return COMMUNITY_REACTIONS.flatMap((key) => next.filter((item) => item.reaction === key));
  }
  if (!existing?.reacted) return reactions;
  return reactions.flatMap((item) => item.reaction !== reaction ? [item]
    : item.count > 1 ? [{ ...item, count: item.count - 1, reacted: false }] : []);
}

