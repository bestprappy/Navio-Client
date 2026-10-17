import { atom } from "jotai";

import type {
  CommunityCommentSort,
  CommunityFeedSort,
  CreatePostDraft,
} from "./data";
import { defaultCreatePostDraft } from "./data";

export const communitySearchQueryAtom = atom("");
export const communityFeedSortAtom = atom<CommunityFeedSort>("best");
export const popularFeedSortAtom = atom<CommunityFeedSort>("top");
export const groupFeedSortAtom = atom<CommunityFeedSort>("best");
export const communityCommentSortAtom = atom<CommunityCommentSort>("best");
export const communityCommentSearchAtom = atom("");
export const communityDiscoveryCategoryAtom = atom("all");
export const collapsedCommentIdsAtom = atom<string[]>([]);
export const continuedCommentThreadIdsAtom = atom<string[]>([]);
export const commentDraftsAtom = atom<Record<string, string>>({});
export const replyDraftsByCommentIdAtom = atom<Record<string, string>>({});
export const replyingToCommentIdAtom = atom<string | null>(null);
export const editingCommentIdAtom = atom<string | null>(null);
export const visibleReplyCountsByCommentIdAtom = atom<Record<string, number>>(
  {},
);
export const visibleRootCommentCountsByPostIdAtom = atom<
  Record<string, number>
>({});
export const createPostDraftAtom = atom<CreatePostDraft>({
  ...defaultCreatePostDraft,
});

/** One create-community wizard is mounted in the layout; any "Create a community" button opens it. */
export const createCommunityOpenAtom = atom(false);
