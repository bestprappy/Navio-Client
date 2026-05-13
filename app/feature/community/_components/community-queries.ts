"use client";

import { useQuery } from "@tanstack/react-query";

import type {
  CommunityComment,
  CommunityFeedSort,
  CommunityGroup,
  CommunityPost,
} from "./data";
import {
  getCommentsByPostId,
  getGroupById,
  getTripById,
  mockCommunityGroups,
  mockCommunityPosts,
} from "./data";

const SEARCH_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "from",
  "in",
  "near",
  "of",
  "on",
  "the",
  "to",
  "with",
]);

function waitForMockNetwork() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, 180);
  });
}

function normalizeValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSearchTokens(query: string): string[] {
  const tokens = normalizeValue(query)
    .split(" ")
    .filter((token) => token && !SEARCH_STOP_WORDS.has(token));

  return Array.from(new Set(tokens));
}

function hasAllTokens(searchText: string, tokens: string[]): boolean {
  if (!tokens.length) {
    return true;
  }

  return tokens.every((token) => searchText.includes(token));
}

function getGroupSearchText(group: CommunityGroup): string {
  return normalizeValue(
    [
      group.name,
      group.description,
      group.country,
      ...group.places,
      ...group.tags,
    ].join(" "),
  );
}

function getTripSearchText(tripId?: string): string {
  if (!tripId) {
    return "";
  }

  const trip = getTripById(tripId);

  if (!trip) {
    return "";
  }

  return normalizeValue(
    [
      trip.title,
      trip.summary,
      trip.location,
      trip.country,
      ...trip.tags,
      ...trip.stops.map((stop) => `${stop.name} ${stop.location}`),
    ].join(" "),
  );
}

function getPostSearchText(
  post: CommunityPost,
  groups: CommunityGroup[],
  extraComments: CommunityComment[],
): string {
  const group = getGroupById(post.groupId, groups);
  const comments = getCommentsByPostId(post.id, extraComments);

  return normalizeValue(
    [
      post.title,
      post.body,
      post.place,
      post.country,
      ...post.tags,
      group?.name ?? "",
      group?.description ?? "",
      group?.country ?? "",
      ...(group?.places ?? []),
      ...(group?.tags ?? []),
      getTripSearchText(post.sharedTripId),
      ...comments.map((comment) => comment.body),
    ].join(" "),
  );
}

function getGroupSearchScore(group: CommunityGroup, query: string): number {
  const normalizedQuery = normalizeValue(query);
  const tokens = getSearchTokens(query);

  if (!tokens.length) {
    return group.isOfficial ? 6 : 0;
  }

  const name = normalizeValue(group.name);
  const description = normalizeValue(group.description);
  const country = normalizeValue(group.country);
  const places = normalizeValue(group.places.join(" "));
  const tags = normalizeValue(group.tags.join(" "));

  if (!hasAllTokens(getGroupSearchText(group), tokens)) {
    return -1;
  }

  return tokens.reduce((score, token) => {
    let nextScore = score;

    if (name.includes(token)) nextScore += 12;
    if (tags.includes(token)) nextScore += 8;
    if (country.includes(token)) nextScore += 7;
    if (places.includes(token)) nextScore += 6;
    if (description.includes(token)) nextScore += 3;

    return nextScore;
  }, name.includes(normalizedQuery) ? 10 : 0);
}

function getPostSearchScore(
  post: CommunityPost,
  groups: CommunityGroup[],
  query: string,
  extraComments: CommunityComment[],
): number {
  const normalizedQuery = normalizeValue(query);
  const tokens = getSearchTokens(query);
  const searchText = getPostSearchText(post, groups, extraComments);

  if (!tokens.length) {
    return 0;
  }

  if (!hasAllTokens(searchText, tokens)) {
    return -1;
  }

  const group = getGroupById(post.groupId, groups);
  const title = normalizeValue(post.title);
  const body = normalizeValue(post.body);
  const place = normalizeValue(post.place);
  const country = normalizeValue(post.country);
  const tags = normalizeValue(post.tags.join(" "));
  const groupText = normalizeValue(
    [group?.name ?? "", group?.description ?? "", ...(group?.tags ?? [])].join(
      " ",
    ),
  );
  const tripText = getTripSearchText(post.sharedTripId);
  const commentText = normalizeValue(
    getCommentsByPostId(post.id, extraComments)
      .map((comment) => comment.body)
      .join(" "),
  );

  return tokens.reduce((score, token) => {
    let nextScore = score;

    if (title.includes(token)) nextScore += 14;
    if (tags.includes(token)) nextScore += 10;
    if (place.includes(token)) nextScore += 8;
    if (country.includes(token)) nextScore += 8;
    if (groupText.includes(token)) nextScore += 7;
    if (tripText.includes(token)) nextScore += 6;
    if (body.includes(token)) nextScore += 4;
    if (commentText.includes(token)) nextScore += 2;

    return nextScore;
  }, searchText.includes(normalizedQuery) ? 12 : 0);
}

function sortPosts(
  posts: CommunityPost[],
  sort: CommunityFeedSort,
  searchScores: Map<string, number>,
  extraCommentCounts: Record<string, number>,
) {
  return [...posts].sort((a, b) => {
    const scoreA = searchScores.get(a.id) ?? 0;
    const scoreB = searchScores.get(b.id) ?? 0;
    const commentsA = a.commentCount + (extraCommentCounts[a.id] ?? 0);
    const commentsB = b.commentCount + (extraCommentCounts[b.id] ?? 0);

    if (sort === "new") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    if (sort === "top") {
      return b.upvotes - a.upvotes || commentsB - commentsA;
    }

    return (
      scoreB - scoreA ||
      b.upvotes + commentsB * 3 - (a.upvotes + commentsA * 3) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });
}

function getCreatedIdsSignature(items: { id: string }[]) {
  return items.map((item) => item.id).join("|");
}

function getExtraCommentsSignature(
  extraCommentsByPostId: Record<string, CommunityComment[]>,
) {
  return Object.entries(extraCommentsByPostId)
    .map(([postId, comments]) => `${postId}:${comments.length}`)
    .sort()
    .join("|");
}

export function useCommunityGroups(
  query: string,
  createdGroups: CommunityGroup[],
) {
  return useQuery({
    queryKey: [
      "community",
      "groups",
      query,
      getCreatedIdsSignature(createdGroups),
    ],
    queryFn: async () => {
      await waitForMockNetwork();

      const groups = [...createdGroups, ...mockCommunityGroups];
      const scores = new Map(
        groups.map((group) => [group.id, getGroupSearchScore(group, query)]),
      );
      const tokens = getSearchTokens(query);

      return groups
        .filter((group) => !tokens.length || (scores.get(group.id) ?? -1) >= 0)
        .sort((a, b) => {
          const scoreA = scores.get(a.id) ?? 0;
          const scoreB = scores.get(b.id) ?? 0;

          return (
            scoreB - scoreA ||
            Number(Boolean(b.isOfficial)) - Number(Boolean(a.isOfficial)) ||
            b.memberCount - a.memberCount
          );
        });
    },
  });
}

export function useCommunityFeed(
  query: string,
  sort: CommunityFeedSort,
  createdPosts: CommunityPost[],
  groups: CommunityGroup[],
  extraCommentsByPostId: Record<string, CommunityComment[]>,
) {
  return useQuery({
    queryKey: [
      "community",
      "feed",
      query,
      sort,
      getCreatedIdsSignature(createdPosts),
      getCreatedIdsSignature(groups),
      getExtraCommentsSignature(extraCommentsByPostId),
    ],
    queryFn: async () => {
      await waitForMockNetwork();

      const posts = [...createdPosts, ...mockCommunityPosts];
      const extraComments = Object.values(extraCommentsByPostId).flat();
      const scores = new Map(
        posts.map((post) => [
          post.id,
          getPostSearchScore(post, groups, query, extraComments),
        ]),
      );
      const tokens = getSearchTokens(query);
      const extraCommentCounts = Object.fromEntries(
        Object.entries(extraCommentsByPostId).map(([postId, comments]) => [
          postId,
          comments.length,
        ]),
      );

      const filteredPosts = posts.filter(
        (post) => !tokens.length || (scores.get(post.id) ?? -1) >= 0,
      );

      return sortPosts(filteredPosts, sort, scores, extraCommentCounts);
    },
  });
}
