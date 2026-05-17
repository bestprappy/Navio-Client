"use client";

import { useMemo } from "react";
import {
  ArrowBigDownDash,
  ArrowBigUpDash,
  MessageCircle,
  Minus,
  Plus,
  Reply,
  Search,
} from "lucide-react";
import { useAtom, useSetAtom } from "jotai";

import {
  collapsedCommentIdsAtom,
  commentDraftsAtom,
  continuedCommentThreadIdsAtom,
  communityCommentSearchAtom,
  communityCommentSortAtom,
  downvotedCommentIdsAtom,
  extraCommentsByPostIdAtom,
  replyingToCommentIdAtom,
  replyDraftsByCommentIdAtom,
  upvotedCommentIdsAtom,
  visibleReplyCountsByCommentIdAtom,
  visibleRootCommentCountsByPostIdAtom,
} from "../../_components/community-atoms";
import type {
  CommunityComment,
  CommunityCommentSort,
  CommunityPost,
} from "../../_components/data";
import {
  currentCommunityUser,
  formatCount,
  formatRelativeTime,
  getInitials,
  getUserById,
} from "../../_components/data";
import { CommunityCommentComposer } from "./community-comment-composer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CommunityCommentNode = CommunityComment & {
  replies: CommunityCommentNode[];
};

type VoteDirection = "up" | "down";

type CommunityCommentThreadProps = {
  post: CommunityPost;
  comments: CommunityComment[];
};

type CommentBranchProps = {
  nodes: CommunityCommentNode[];
  post: CommunityPost;
  level: number;
  searchActive: boolean;
  upvotedCommentIds: string[];
  downvotedCommentIds: string[];
  collapsedCommentIds: string[];
  continuedCommentThreadIds: string[];
  visibleReplyCountsByCommentId: Record<string, number>;
  replyDraftsByCommentId: Record<string, string>;
  replyingToCommentId: string | null;
  onVote: (commentId: string, direction: VoteDirection) => void;
  onToggleCollapse: (commentId: string) => void;
  onContinueThread: (commentId: string) => void;
  onShowMoreReplies: (commentId: string, nextCount: number) => void;
  onReplyStart: (commentId: string) => void;
  onReplyCancel: (commentId: string) => void;
  onReplyDraftChange: (commentId: string, value: string) => void;
  onReplySubmit: (comment: CommunityComment) => void;
};

const ROOT_COMMENT_PAGE_SIZE = 8;
const ROOT_COMMENT_INCREMENT = 6;
const DEFAULT_VISIBLE_REPLY_COUNT = 3;
const REPLY_INCREMENT = 3;
const MAX_INLINE_COMMENT_DEPTH = 6;

const COMMENT_SORT_OPTIONS: { value: CommunityCommentSort; label: string }[] = [
  { value: "best", label: "Best" },
  { value: "new", label: "New" },
];

function normalizeSearchValue(value: string) {
  return value.toLowerCase().trim();
}

function getCommentScore(
  comment: CommunityComment,
  upvotedCommentIds: string[],
  downvotedCommentIds: string[],
) {
  return (
    comment.upvotes +
    (upvotedCommentIds.includes(comment.id) ? 1 : 0) -
    (downvotedCommentIds.includes(comment.id) ? 1 : 0)
  );
}

function buildCommentTree(comments: CommunityComment[]) {
  const nodeById = new Map<string, CommunityCommentNode>();

  comments.forEach((comment) => {
    nodeById.set(comment.id, { ...comment, replies: [] });
  });

  const roots: CommunityCommentNode[] = [];

  comments.forEach((comment) => {
    const node = nodeById.get(comment.id);

    if (!node) {
      return;
    }

    const parent = comment.parentCommentId
      ? nodeById.get(comment.parentCommentId)
      : null;

    if (parent) {
      parent.replies.push(node);
      return;
    }

    roots.push(node);
  });

  return roots;
}

function commentMatchesSearch(comment: CommunityCommentNode, query: string) {
  if (!query) {
    return true;
  }

  const author = getUserById(comment.authorId);
  const searchableText = normalizeSearchValue(
    `${comment.body} ${author.name} ${author.handle}`,
  );

  return searchableText.includes(query);
}

function isCommunityCommentNode(
  node: CommunityCommentNode | null,
): node is CommunityCommentNode {
  return Boolean(node);
}

function filterCommentTree(
  nodes: CommunityCommentNode[],
  query: string,
): CommunityCommentNode[] {
  if (!query) {
    return nodes;
  }

  return nodes
    .map((node) => {
      const replies = filterCommentTree(node.replies, query);

      if (commentMatchesSearch(node, query) || replies.length > 0) {
        return { ...node, replies };
      }

      return null;
    })
    .filter(isCommunityCommentNode);
}

function sortCommentTree(
  nodes: CommunityCommentNode[],
  sort: CommunityCommentSort,
  upvotedCommentIds: string[],
  downvotedCommentIds: string[],
): CommunityCommentNode[] {
  const sortedNodes = [...nodes].sort((a, b) => {
    if (sort === "new") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    return (
      getCommentScore(b, upvotedCommentIds, downvotedCommentIds) -
        getCommentScore(a, upvotedCommentIds, downvotedCommentIds) ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  });

  return sortedNodes.map((node) => ({
    ...node,
    replies: sortCommentTree(
      node.replies,
      sort,
      upvotedCommentIds,
      downvotedCommentIds,
    ),
  }));
}

function createLocalComment({
  postId,
  parentCommentId,
  body,
}: {
  postId: string;
  parentCommentId?: string;
  body: string;
}): CommunityComment {
  return {
    id: `comment-local-${postId}-${Date.now()}`,
    postId,
    parentCommentId,
    authorId: currentCommunityUser.id,
    body,
    createdAt: new Date().toISOString(),
    upvotes: 0,
  };
}

function CommentVoteButton({
  label,
  pressed,
  direction,
  onClick,
}: {
  label: string;
  pressed: boolean;
  direction: VoteDirection;
  onClick: () => void;
}) {
  const Icon = direction === "up" ? ArrowBigUpDash : ArrowBigDownDash;

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        pressed &&
          (direction === "up" ? "text-primary" : "text-destructive"),
      )}
    >
      <Icon
        className="size-4"
        fill={pressed ? "currentColor" : "none"}
        aria-hidden="true"
      />
    </button>
  );
}

function CommentToolbar({
  comment,
  score,
  upvoted,
  downvoted,
  onVote,
  onReply,
}: {
  comment: CommunityCommentNode;
  score: number;
  upvoted: boolean;
  downvoted: boolean;
  onVote: (commentId: string, direction: VoteDirection) => void;
  onReply: (commentId: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      <CommentVoteButton
        label="Upvote comment"
        pressed={upvoted}
        direction="up"
        onClick={() => onVote(comment.id, "up")}
      />
      <span
        className={cn(
          "min-w-5 text-center font-semibold",
          upvoted ? "text-primary" : downvoted ? "text-destructive" : "",
        )}
      >
        {formatCount(score)}
      </span>
      <CommentVoteButton
        label="Downvote comment"
        pressed={downvoted}
        direction="down"
        onClick={() => onVote(comment.id, "down")}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => onReply(comment.id)}
        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <Reply className="size-3.5" aria-hidden="true" />
        Reply
      </Button>
    </div>
  );
}

function CommentBranch({
  nodes,
  post,
  level,
  searchActive,
  upvotedCommentIds,
  downvotedCommentIds,
  collapsedCommentIds,
  continuedCommentThreadIds,
  visibleReplyCountsByCommentId,
  replyDraftsByCommentId,
  replyingToCommentId,
  onVote,
  onToggleCollapse,
  onContinueThread,
  onShowMoreReplies,
  onReplyStart,
  onReplyCancel,
  onReplyDraftChange,
  onReplySubmit,
}: CommentBranchProps) {
  return (
    <div className={cn("flex flex-col gap-5", level > 0 && "gap-4")}>
      {nodes.map((comment) => {
        const author = getUserById(comment.authorId);
        const isCollapsed = collapsedCommentIds.includes(comment.id);
        const visibleReplyCount =
          visibleReplyCountsByCommentId[comment.id] ??
          DEFAULT_VISIBLE_REPLY_COUNT;
        const visibleReplies = searchActive
          ? comment.replies
          : comment.replies.slice(0, visibleReplyCount);
        const hiddenReplyCount = Math.max(
          0,
          comment.replies.length - visibleReplies.length,
        );
        const score = getCommentScore(
          comment,
          upvotedCommentIds,
          downvotedCommentIds,
        );
        const upvoted = upvotedCommentIds.includes(comment.id);
        const downvoted = downvotedCommentIds.includes(comment.id);
        const replyDraft = replyDraftsByCommentId[comment.id] ?? "";
        const replyComposerVisible = replyingToCommentId === comment.id;
        const depthLimitReached =
          level >= MAX_INLINE_COMMENT_DEPTH && comment.replies.length > 0;
        const threadContinued = continuedCommentThreadIds.includes(comment.id);
        const showNestedRail =
          !isCollapsed && level < MAX_INLINE_COMMENT_DEPTH;
        const allowNestedIndent = level < MAX_INLINE_COMMENT_DEPTH;
        const hasParentRail = level > 0 && level <= MAX_INLINE_COMMENT_DEPTH;

        return (
          <article
            key={comment.id}
            className={cn(
              "relative min-w-0",
              hasParentRail &&
                "before:absolute before:-left-14 before:top-0 before:h-4 before:w-14 before:rounded-bl-2xl before:border-b before:border-l before:border-border",
            )}
          >
            <div className="flex min-w-0 items-start gap-3">
              <Avatar className="size-8">
                <AvatarImage src={author.avatarUrl} alt={author.name} />
                <AvatarFallback className="text-[11px]">
                  {getInitials(author.name)}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold text-foreground">
                    {author.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    @{author.handle}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>

                <p className="mt-1 max-w-full whitespace-pre-wrap break-words text-sm leading-6 text-foreground [overflow-wrap:anywhere]">
                  {comment.body}
                </p>

                <CommentToolbar
                  comment={comment}
                  score={score}
                  upvoted={upvoted}
                  downvoted={downvoted}
                  onVote={onVote}
                  onReply={onReplyStart}
                />

                {replyComposerVisible ? (
                  <div className="mt-3">
                    <CommunityCommentComposer
                      id={`reply-${comment.id}`}
                      value={replyDraft}
                      placeholder={`Reply to @${author.handle}`}
                      submitLabel="Comment"
                      autoFocus
                      onChange={(value) =>
                        onReplyDraftChange(comment.id, value)
                      }
                      onCancel={() => onReplyCancel(comment.id)}
                      onSubmit={() => {
                        const body = replyDraft.trim();

                        if (!body) {
                          return;
                        }

                        onReplySubmit(
                          createLocalComment({
                            postId: post.id,
                            parentCommentId: comment.id,
                            body,
                          }),
                        );
                      }}
                    />
                  </div>
                ) : null}

                {comment.replies.length > 0 ? (
                  <div
                    className={cn(
                      "relative mt-3",
                      allowNestedIndent ? "-ml-7 pl-14" : "pl-0",
                      showNestedRail &&
                        "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-border",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onToggleCollapse(comment.id)}
                      className={cn(
                        "z-10 inline-flex size-4 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                        allowNestedIndent
                          ? "absolute -left-2 top-0"
                          : "mb-2",
                      )}
                      aria-expanded={!isCollapsed}
                      aria-label={
                        isCollapsed ? "Expand replies" : "Collapse replies"
                      }
                    >
                      {isCollapsed ? (
                        <Plus className="size-3" aria-hidden="true" />
                      ) : (
                        <Minus className="size-3" aria-hidden="true" />
                      )}
                    </button>

                    {isCollapsed ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleCollapse(comment.id)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {comment.replies.length}{" "}
                        {comment.replies.length === 1 ? "reply" : "replies"}
                      </Button>
                    ) : depthLimitReached && !threadContinued ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onContinueThread(comment.id)}
                        className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <MessageCircle
                          className="size-3.5"
                          aria-hidden="true"
                        />
                        Continue this thread
                      </Button>
                    ) : (
                      <div>
                        <CommentBranch
                          nodes={visibleReplies}
                          post={post}
                          level={level + 1}
                          searchActive={searchActive}
                          upvotedCommentIds={upvotedCommentIds}
                          downvotedCommentIds={downvotedCommentIds}
                          collapsedCommentIds={collapsedCommentIds}
                          continuedCommentThreadIds={
                            continuedCommentThreadIds
                          }
                          visibleReplyCountsByCommentId={
                            visibleReplyCountsByCommentId
                          }
                          replyDraftsByCommentId={replyDraftsByCommentId}
                          replyingToCommentId={replyingToCommentId}
                          onVote={onVote}
                          onToggleCollapse={onToggleCollapse}
                          onContinueThread={onContinueThread}
                          onShowMoreReplies={onShowMoreReplies}
                          onReplyStart={onReplyStart}
                          onReplyCancel={onReplyCancel}
                          onReplyDraftChange={onReplyDraftChange}
                          onReplySubmit={onReplySubmit}
                        />

                        {hiddenReplyCount > 0 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onShowMoreReplies(
                                comment.id,
                                visibleReplyCount + REPLY_INCREMENT,
                              )
                            }
                            className={cn(
                              "relative mt-3 h-7 px-2 text-xs text-muted-foreground hover:text-foreground",
                              showNestedRail &&
                                "before:absolute before:-left-14 before:top-0 before:h-1/2 before:w-14 before:rounded-bl-2xl before:border-b before:border-l before:border-border",
                            )}
                          >
                            <Plus className="size-3.5" aria-hidden="true" />
                            View {hiddenReplyCount} more{" "}
                            {hiddenReplyCount === 1 ? "reply" : "replies"}
                          </Button>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function CommunityCommentThread({
  post,
  comments,
}: CommunityCommentThreadProps) {
  const [commentSort, setCommentSort] = useAtom(communityCommentSortAtom);
  const [commentSearch, setCommentSearch] = useAtom(communityCommentSearchAtom);
  const [commentDrafts, setCommentDrafts] = useAtom(commentDraftsAtom);
  const [replyDraftsByCommentId, setReplyDraftsByCommentId] = useAtom(
    replyDraftsByCommentIdAtom,
  );
  const [replyingToCommentId, setReplyingToCommentId] = useAtom(
    replyingToCommentIdAtom,
  );
  const setExtraCommentsByPostId = useSetAtom(
    extraCommentsByPostIdAtom,
  );
  const [upvotedCommentIds, setUpvotedCommentIds] = useAtom(
    upvotedCommentIdsAtom,
  );
  const [downvotedCommentIds, setDownvotedCommentIds] = useAtom(
    downvotedCommentIdsAtom,
  );
  const [collapsedCommentIds, setCollapsedCommentIds] = useAtom(
    collapsedCommentIdsAtom,
  );
  const [continuedCommentThreadIds, setContinuedCommentThreadIds] = useAtom(
    continuedCommentThreadIdsAtom,
  );
  const [
    visibleReplyCountsByCommentId,
    setVisibleReplyCountsByCommentId,
  ] = useAtom(visibleReplyCountsByCommentIdAtom);
  const [
    visibleRootCommentCountsByPostId,
    setVisibleRootCommentCountsByPostId,
  ] = useAtom(visibleRootCommentCountsByPostIdAtom);

  const draft = commentDrafts[post.id] ?? "";
  const normalizedSearch = normalizeSearchValue(commentSearch);
  const searchActive = normalizedSearch.length > 0;

  const visibleRootCount =
    visibleRootCommentCountsByPostId[post.id] ?? ROOT_COMMENT_PAGE_SIZE;

  const visibleCommentTree = useMemo(() => {
    const tree = buildCommentTree(comments);
    const filteredTree = filterCommentTree(tree, normalizedSearch);

    return sortCommentTree(
      filteredTree,
      commentSort,
      upvotedCommentIds,
      downvotedCommentIds,
    );
  }, [
    comments,
    normalizedSearch,
    commentSort,
    upvotedCommentIds,
    downvotedCommentIds,
  ]);

  const rootComments = searchActive
    ? visibleCommentTree
    : visibleCommentTree.slice(0, visibleRootCount);
  const hiddenRootCount = Math.max(
    0,
    visibleCommentTree.length - rootComments.length,
  );

  function addComment(comment: CommunityComment) {
    setExtraCommentsByPostId((previous) => ({
      ...previous,
      [post.id]: [...(previous[post.id] ?? []), comment],
    }));
  }

  function submitRootComment() {
    const body = draft.trim();

    if (!body) {
      return;
    }

    addComment(createLocalComment({ postId: post.id, body }));
    setCommentDrafts((previous) => ({ ...previous, [post.id]: "" }));
    setVisibleRootCommentCountsByPostId((previous) => ({
      ...previous,
      [post.id]: Math.max(visibleRootCount, ROOT_COMMENT_PAGE_SIZE),
    }));
  }

  function submitReply(comment: CommunityComment) {
    addComment(comment);
    const parentCommentId = comment.parentCommentId;

    if (parentCommentId) {
      setReplyDraftsByCommentId((previous) => ({
        ...previous,
        [parentCommentId]: "",
      }));
    }
    setReplyingToCommentId(null);
    setCollapsedCommentIds((previous) =>
      previous.filter((id) => id !== parentCommentId),
    );
    if (parentCommentId) {
      setVisibleReplyCountsByCommentId((previous) => ({
        ...previous,
        [parentCommentId]: Math.max(
          previous[parentCommentId] ?? DEFAULT_VISIBLE_REPLY_COUNT,
          DEFAULT_VISIBLE_REPLY_COUNT + 1,
        ),
      }));
    }
  }

  function toggleVote(commentId: string, direction: VoteDirection) {
    if (direction === "up") {
      setUpvotedCommentIds((previous) =>
        previous.includes(commentId)
          ? previous.filter((id) => id !== commentId)
          : [...previous, commentId],
      );
      setDownvotedCommentIds((previous) =>
        previous.filter((id) => id !== commentId),
      );
      return;
    }

    setDownvotedCommentIds((previous) =>
      previous.includes(commentId)
        ? previous.filter((id) => id !== commentId)
        : [...previous, commentId],
    );
    setUpvotedCommentIds((previous) =>
      previous.filter((id) => id !== commentId),
    );
  }

  function toggleCollapse(commentId: string) {
    setCollapsedCommentIds((previous) =>
      previous.includes(commentId)
        ? previous.filter((id) => id !== commentId)
        : [...previous, commentId],
    );
  }

  function updateReplyDraft(commentId: string, value: string) {
    setReplyDraftsByCommentId((previous) => ({
      ...previous,
      [commentId]: value,
    }));
  }

  return (
    <section
      id="discussion"
      className="flex flex-col gap-5"
      aria-label={`Discussion for ${post.title}`}
    >
      <CommunityCommentComposer
        id={`comment-${post.id}`}
        value={draft}
        placeholder="Join the conversation"
        submitLabel="Comment"
        onChange={(value) =>
          setCommentDrafts((previous) => ({
            ...previous,
            [post.id]: value,
          }))
        }
        onCancel={
          draft
            ? () =>
                setCommentDrafts((previous) => ({
                  ...previous,
                  [post.id]: "",
                }))
            : undefined
        }
        onSubmit={submitRootComment}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Sort by:</span>
          <div
            className="inline-flex rounded-lg border border-border bg-card p-1"
            role="tablist"
            aria-label="Sort comments"
          >
            {COMMENT_SORT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                size="xs"
                variant={commentSort === option.value ? "secondary" : "ghost"}
                role="tab"
                aria-selected={commentSort === option.value}
                onClick={() => setCommentSort(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <label htmlFor={`comment-search-${post.id}`} className="sr-only">
            Search comments
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id={`comment-search-${post.id}`}
            value={commentSearch}
            onChange={(event) => setCommentSearch(event.target.value)}
            placeholder="Search comments"
            className="rounded-full bg-card pl-9"
          />
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          No comments yet. Add the first route note.
        </div>
      ) : null}

      {comments.length > 0 && rootComments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          No comments match that search.
        </div>
      ) : null}

      {rootComments.length > 0 ? (
        <CommentBranch
          nodes={rootComments}
          post={post}
          level={0}
          searchActive={searchActive}
          upvotedCommentIds={upvotedCommentIds}
          downvotedCommentIds={downvotedCommentIds}
          collapsedCommentIds={collapsedCommentIds}
          continuedCommentThreadIds={continuedCommentThreadIds}
          visibleReplyCountsByCommentId={visibleReplyCountsByCommentId}
          replyDraftsByCommentId={replyDraftsByCommentId}
          replyingToCommentId={replyingToCommentId}
          onVote={toggleVote}
          onToggleCollapse={toggleCollapse}
          onContinueThread={(commentId) =>
            setContinuedCommentThreadIds((previous) =>
              previous.includes(commentId)
                ? previous
                : [...previous, commentId],
            )
          }
          onShowMoreReplies={(commentId, nextCount) =>
            setVisibleReplyCountsByCommentId((previous) => ({
              ...previous,
              [commentId]: nextCount,
            }))
          }
          onReplyStart={(commentId) => setReplyingToCommentId(commentId)}
          onReplyCancel={(commentId) => {
            setReplyingToCommentId(null);
            updateReplyDraft(commentId, "");
          }}
          onReplyDraftChange={updateReplyDraft}
          onReplySubmit={submitReply}
        />
      ) : null}

      {hiddenRootCount > 0 ? (
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setVisibleRootCommentCountsByPostId((previous) => ({
              ...previous,
              [post.id]: visibleRootCount + ROOT_COMMENT_INCREMENT,
            }))
          }
          className="self-start rounded-full"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          View {hiddenRootCount} more{" "}
          {hiddenRootCount === 1 ? "comment" : "comments"}
        </Button>
      ) : null}
    </section>
  );
}
