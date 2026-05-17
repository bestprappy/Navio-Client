import { atom } from "jotai";

import type {
  CommunityComment,
  CommunityCommentSort,
  CommunityFeedSort,
  CommunityGroup,
  CommunityPost,
  CreateGroupDraft,
  CreatePostDraft,
} from "./data";
import {
  defaultCreateGroupDraft,
  defaultCreatePostDraft,
  mockSharedTrips,
} from "./data";

export const communitySearchQueryAtom = atom("");
export const communityFeedSortAtom = atom<CommunityFeedSort>("best");
export const communityCommentSortAtom = atom<CommunityCommentSort>("best");
export const communityCommentSearchAtom = atom("");
export const communityDiscoveryCategoryAtom = atom("all");
export const communityDiscoveryVisibleCountsAtom = atom<Record<string, number>>(
  {},
);
export const selectedCommunityPostIdAtom = atom<string | null>(null);
export const joinedGroupIdsAtom = atom<string[]>([
  "group-thailand-restaurants",
  "group-thailand-ev-charging",
]);
export const upvotedPostIdsAtom = atom<string[]>([]);
export const downvotedPostIdsAtom = atom<string[]>([]);
export const upvotedCommentIdsAtom = atom<string[]>([]);
export const downvotedCommentIdsAtom = atom<string[]>([]);
export const collapsedCommentIdsAtom = atom<string[]>([]);
export const continuedCommentThreadIdsAtom = atom<string[]>([]);
export const expandedDiscussionPostIdAtom = atom<string | null>(null);
export const copiedTripIdsAtom = atom<string[]>([]);
export const mutedGroupIdsAtom = atom<string[]>([]);
export const createdGroupsAtom = atom<CommunityGroup[]>([]);
export const createdPostsAtom = atom<CommunityPost[]>([]);
export const commentDraftsAtom = atom<Record<string, string>>({});
export const replyDraftsByCommentIdAtom = atom<Record<string, string>>({});
export const replyingToCommentIdAtom = atom<string | null>(null);
export const visibleReplyCountsByCommentIdAtom = atom<Record<string, number>>(
  {},
);
export const visibleRootCommentCountsByPostIdAtom = atom<
  Record<string, number>
>({});
export const extraCommentsByPostIdAtom = atom<Record<string, CommunityComment[]>>(
  {},
);
export const createGroupDraftAtom = atom<CreateGroupDraft>({
  ...defaultCreateGroupDraft,
});
export const createPostDraftAtom = atom<CreatePostDraft>({
  ...defaultCreatePostDraft,
});

export const recentPostsClearedAtom = atom(false);

export const copiedTripsAtom = atom((get) => {
  const copiedTripIds = new Set(get(copiedTripIdsAtom));

  return mockSharedTrips.filter((trip) => copiedTripIds.has(trip.id));
});

export const totalCopiedTripsAtom = atom((get) => get(copiedTripIdsAtom).length);
