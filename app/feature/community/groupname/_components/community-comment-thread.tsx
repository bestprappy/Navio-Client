"use client";

import { createContext, useContext, useMemo, useState } from "react";
import {
  ArrowBigDown,
  ArrowBigUp,
  MessageCircle,
  Pencil,
  Plus,
  Reply,
  Search,
  Trash2,
} from "lucide-react";
import { useAtom } from "jotai";

import {
  collapsedCommentIdsAtom,
  commentDraftsAtom,
  continuedCommentThreadIdsAtom,
  editingCommentIdAtom,
  communityCommentSearchAtom,
  communityCommentSortAtom,
  replyingToCommentIdAtom,
  replyDraftsByCommentIdAtom,
  visibleReplyCountsByCommentIdAtom,
  visibleRootCommentCountsByPostIdAtom,
} from "../../_components/community-atoms";
import type {
  CommunityComment,
  CommunityCommentSort,
  CommunityGroup,
  CommunityPost,
} from "../../_components/data";
import { formatCount, formatRelativeTime } from "../../_components/data";
import { useCommunityComments, usePostMutation } from "../../_components/community-queries";
import { useCommunityIdentity } from "../../_components/community-group-queries";
import { useCommunityUserProfile } from "../../_components/community-user-label";
import { ProfileLink } from "@/components/social/profile-link";
import { CommunityMembershipButton } from "../../_components/community-membership-button";
import { CommunityQueryError } from "../../_components/community-query-state";
import { CommunityCommentComposer } from "./community-comment-composer";
import { CommentReactions } from "../../_components/community-reactions";
import {
  CommentTreeAction,
  CommentTreeAvatar,
  CommentTreeBody,
  CommentTreeBranch,
  CommentTreeItem,
  CommentTreeMenu,
  CommentTreeMeta,
  CommentSortToggle,
} from "@/components/comment-tree/comment-tree";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { cn } from "@/lib/utils";

type CommunityCommentNode = CommunityComment & {
  replies: CommunityCommentNode[];
};

const ROOT_COMMENT_PAGE_SIZE = 8;
const ROOT_COMMENT_INCREMENT = 6;
const DEFAULT_VISIBLE_REPLY_COUNT = 3;
const REPLY_INCREMENT = 3;
const MAX_INLINE_COMMENT_DEPTH = 6;

const COMMENT_SORT_OPTIONS: { value: CommunityCommentSort; label: string }[] = [
  { value: "best", label: "Top" },
  { value: "new", label: "Latest" },
];

type CommentThreadContextValue = {
  post: CommunityPost;
  group: CommunityGroup;
  viewerId: string;
  canInteract: boolean;
  searchActive: boolean;
  collapsedCommentIds: string[];
  continuedCommentThreadIds: string[];
  visibleReplyCountsByCommentId: Record<string, number>;
  replyDraftsByCommentId: Record<string, string>;
  replyingToCommentId: string | null;
  editingCommentId: string | null;
  onEditStart: (commentId: string) => void;
  onEditEnd: () => void;
  onToggleCollapse: (commentId: string) => void;
  onContinueThread: (commentId: string) => void;
  onShowMoreReplies: (commentId: string, nextCount: number) => void;
  onReplyStart: (commentId: string) => void;
  onReplyCancel: (commentId: string) => void;
  onReplyDraftChange: (commentId: string, value: string) => void;
  onReplyPosted: (parentCommentId: string) => void;
};

const CommentThreadContext = createContext<CommentThreadContextValue | null>(
  null,
);

function useCommentThreadContext(): CommentThreadContextValue {
  const context = useContext(CommentThreadContext);

  if (!context) {
    throw new Error(
      "Comment thread parts must be rendered inside <CommunityCommentThread>. Wrap the branch in the thread provider.",
    );
  }

  return context;
}

function normalizeSearchValue(value: string) {
  return value.toLowerCase().trim();
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

    // A reply whose parent page has not loaded yet is shown at the root so it
    // is never silently dropped from the thread.
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

  return normalizeSearchValue(comment.body).includes(query);
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
): CommunityCommentNode[] {
  const sortedNodes = [...nodes].sort((a, b) => {
    if (sort === "new") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }

    return (
      b.upvotes - a.upvotes ||
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  });

  return sortedNodes.map((node) => ({
    ...node,
    replies: sortCommentTree(node.replies, sort),
  }));
}

function CommentVoteButton({
  label,
  pressed,
  direction,
  disabled,
  onClick,
}: {
  label: string;
  pressed: boolean;
  direction: "up" | "down";
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "up" ? ArrowBigUp : ArrowBigDown;

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
        direction === "up" ? "hover:text-vote-up" : "hover:text-vote-down",
        pressed && (direction === "up" ? "text-vote-up" : "text-vote-down"),
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

function CommentDeleteDialog({
  comment,
  open,
  onOpenChange,
}: {
  comment: CommunityComment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const mutation = usePostMutation();

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (mutation.isPending) return;
        onOpenChange(value);
        mutation.reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete comment?</DialogTitle>
          <DialogDescription>
            If people replied, it will show as unavailable so their replies
            keep their context. Otherwise it will be removed completely.
          </DialogDescription>
        </DialogHeader>
        <CommunityQueryError error={mutation.error} />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate(
                {
                  path: `/${comment.postId}/comments/${comment.id}`,
                  method: "DELETE",
                },
                { onSuccess: () => onOpenChange(false) },
              )
            }
          >
            {mutation.isPending ? "Deleting…" : "Delete comment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CommentToolbar({ comment }: { comment: CommunityCommentNode }) {
  const { group, viewerId, canInteract, onReplyStart, onEditStart } =
    useCommentThreadContext();
  const voteMutation = usePostMutation();
  const { requireAuth } = useRequireAuth();

  const vote = comment.viewerVote ?? 0;
  const upvoted = vote === 1;
  const downvoted = vote === -1;
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isAuthor = viewerId === comment.authorId;
  const editable = canInteract && isAuthor;
  const removable =
    canInteract &&
    (isAuthor ||
      group.role === "admin" ||
      group.role === "moderator");

  function castVote(value: number) {
    requireAuth(() =>
      voteMutation.mutate({
        path: `/${comment.postId}/comments/${comment.id}/vote`,
        method: "PUT",
        body: { value },
      }),
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
        <CommentVoteButton
          label="Upvote comment"
          pressed={upvoted}
          direction="up"
          disabled={!canInteract || voteMutation.isPending}
          onClick={() => castVote(upvoted ? 0 : 1)}
        />
        <span
          aria-live="polite"
          className={cn(
            "min-w-5 text-center font-semibold",
            upvoted ? "text-vote-up" : downvoted ? "text-vote-down" : "text-foreground",
          )}
        >
          {formatCount(comment.upvotes)}
        </span>
        <CommentVoteButton
          label="Downvote comment"
          pressed={downvoted}
          direction="down"
          disabled={!canInteract || voteMutation.isPending}
          onClick={() => castVote(downvoted ? 0 : -1)}
        />

        <CommentTreeAction
          pill
          icon={<Reply className="size-3.5" aria-hidden="true" />}
          disabled={!canInteract}
          onClick={() => onReplyStart(comment.id)}
        >
          Reply
        </CommentTreeAction>

        <CommentReactions
          postId={comment.postId}
          commentId={comment.id}
          reactions={comment.reactions ?? []}
          canReact={canInteract}
        />

        {editable || removable ? (
          <CommentTreeMenu>
          {editable ? (
            <DropdownMenuItem onClick={() => onEditStart(comment.id)}>
              <Pencil aria-hidden="true" />
              Edit
            </DropdownMenuItem>
          ) : null}
          {removable ? (
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          ) : null}
          </CommentTreeMenu>
        ) : null}
      </div>
      {removable ? (
        <CommentDeleteDialog comment={comment} open={deleteOpen} onOpenChange={setDeleteOpen} />
      ) : null}

      <CommunityQueryError error={voteMutation.error} />
    </div>
  );
}

function CommentReplyComposer({ comment }: { comment: CommunityCommentNode }) {
  const {
    post,
    replyDraftsByCommentId,
    onReplyDraftChange,
    onReplyCancel,
    onReplyPosted,
  } = useCommentThreadContext();
  const { name } = useCommunityUserProfile(comment.authorId);
  const mutation = usePostMutation();
  const draft = replyDraftsByCommentId[comment.id] ?? "";

  return (
    <CommunityCommentComposer
      id={`reply-${comment.id}`}
      value={draft}
      placeholder={`Reply to ${name}`}
      submitLabel="Comment"
      autoFocus
      pending={mutation.isPending}
      error={mutation.error}
      onChange={(value) => onReplyDraftChange(comment.id, value)}
      onCancel={() => onReplyCancel(comment.id)}
      onSubmit={() =>
        mutation.mutate(
          {
            path: `/${post.id}/comments`,
            method: "POST",
            body: { body: draft.trim(), parentCommentId: comment.id },
          },
          { onSuccess: () => onReplyPosted(comment.id) },
        )
      }
    />
  );
}

function CommentEditComposer({ comment }: { comment: CommunityCommentNode }) {
  const { onEditEnd } = useCommentThreadContext();
  const mutation = usePostMutation();
  const [draft, setDraft] = useState(comment.body);

  return (
    <CommunityCommentComposer
      id={`edit-${comment.id}`}
      value={draft}
      placeholder="Edit your comment"
      submitLabel="Save"
      pendingLabel="Saving…"
      autoFocus
      pending={mutation.isPending}
      error={mutation.error}
      onChange={setDraft}
      onCancel={onEditEnd}
      onSubmit={() => {
        const body = draft.trim();

        if (body === comment.body) {
          onEditEnd();
          return;
        }

        mutation.mutate(
          {
            path: `/${comment.postId}/comments/${comment.id}`,
            method: "PATCH",
            body: { body },
          },
          { onSuccess: onEditEnd },
        );
      }}
    />
  );
}

function CommentNode({
  comment,
  level,
  isLastSibling,
}: {
  comment: CommunityCommentNode;
  level: number;
  isLastSibling: boolean;
}) {
  const {
    searchActive,
    collapsedCommentIds,
    continuedCommentThreadIds,
    visibleReplyCountsByCommentId,
    replyingToCommentId,
    editingCommentId,
    onToggleCollapse,
    onContinueThread,
    onShowMoreReplies,
  } = useCommentThreadContext();
  const { name, username, avatarUrl, initials } = useCommunityUserProfile(
    comment.authorId,
  );

  const isCollapsed = collapsedCommentIds.includes(comment.id);
  const visibleReplyCount =
    visibleReplyCountsByCommentId[comment.id] ?? DEFAULT_VISIBLE_REPLY_COUNT;
  const visibleReplies = searchActive
    ? comment.replies
    : comment.replies.slice(0, visibleReplyCount);
  const hiddenReplyCount = Math.max(
    0,
    comment.replies.length - visibleReplies.length,
  );
  const replyComposerVisible = replyingToCommentId === comment.id;
  const editing = editingCommentId === comment.id && !comment.deleted;
  const depthLimitReached =
    level >= MAX_INLINE_COMMENT_DEPTH && comment.replies.length > 0;
  const threadContinued = continuedCommentThreadIds.includes(comment.id);
  const hasReplies = comment.replies.length > 0;
  const showReplies = hasReplies && !isCollapsed;
  const showInlineReplies = showReplies && (!depthLimitReached || threadContinued);

  return (
    <CommentTreeItem
      id={`comment-${comment.id}`}
      level={level}
      isLastSibling={isLastSibling}
      avatar={
        <CommentTreeAvatar
          name={name}
          initials={initials}
          imageUrl={avatarUrl}
          username={comment.deleted ? null : username}
        />
      }
      collapse={
        hasReplies
          ? {
              collapsed: isCollapsed,
              onToggle: () => onToggleCollapse(comment.id),
              controlsId: `replies-${comment.id}`,
            }
          : undefined
      }
      railVisible={showInlineReplies}
      replies={
        !hasReplies ? null : isCollapsed ? (
          <CommentTreeAction onClick={() => onToggleCollapse(comment.id)}>
            {comment.replies.length}{" "}
            {comment.replies.length === 1 ? "reply" : "replies"}
          </CommentTreeAction>
        ) : depthLimitReached && !threadContinued ? (
          <CommentTreeAction
            icon={<MessageCircle className="size-3.5" aria-hidden="true" />}
            onClick={() => onContinueThread(comment.id)}
          >
            Continue this thread
          </CommentTreeAction>
        ) : (
          <div>
            <CommentBranch nodes={visibleReplies} level={level + 1} />

            {hiddenReplyCount > 0 ? (
              <div className="mt-3">
                <CommentTreeAction
                  icon={<Plus className="size-3.5" aria-hidden="true" />}
                  onClick={() =>
                    onShowMoreReplies(
                      comment.id,
                      visibleReplyCount + REPLY_INCREMENT,
                    )
                  }
                >
                  View {hiddenReplyCount} more{" "}
                  {hiddenReplyCount === 1 ? "reply" : "replies"}
                </CommentTreeAction>
              </div>
            ) : null}
          </div>
        )
      }
    >
      <CommentTreeMeta
        author={<ProfileLink username={username}>{name}</ProfileLink>}
        createdAt={comment.createdAt}
        timeLabel={formatRelativeTime(comment.createdAt)}
        edited={Boolean(comment.edited)}
        deleted={Boolean(comment.deleted)}
      />

      {editing ? (
        <div className="mt-2">
          <CommentEditComposer comment={comment} />
        </div>
      ) : (
        <CommentTreeBody deleted={Boolean(comment.deleted)}>{comment.body}</CommentTreeBody>
      )}

      {comment.deleted || editing ? null : (
        <CommentToolbar comment={comment} />
      )}

      {replyComposerVisible ? (
        <div className="mt-3">
          <CommentReplyComposer comment={comment} />
        </div>
      ) : null}
    </CommentTreeItem>
  );
}

function CommentBranch({
  nodes,
  level,
}: {
  nodes: CommunityCommentNode[];
  level: number;
}) {
  return (
    <CommentTreeBranch level={level}>
      {nodes.map((comment, index) => (
        <CommentNode
          key={comment.id}
          comment={comment}
          level={level}
          isLastSibling={index === nodes.length - 1}
        />
      ))}
    </CommentTreeBranch>
  );
}

export function CommunityCommentThread({
  post,
  group,
}: {
  post: CommunityPost;
  group: CommunityGroup;
}) {
  const query = useCommunityComments(post.id);
  const { identity } = useCommunityIdentity();
  const { requireAuth } = useRequireAuth();
  const rootMutation = usePostMutation();

  const [commentSort, setCommentSort] = useAtom(communityCommentSortAtom);
  const [commentSearch, setCommentSearch] = useAtom(communityCommentSearchAtom);
  const [commentDrafts, setCommentDrafts] = useAtom(commentDraftsAtom);
  const [replyDraftsByCommentId, setReplyDraftsByCommentId] = useAtom(
    replyDraftsByCommentIdAtom,
  );
  const [replyingToCommentId, setReplyingToCommentId] = useAtom(
    replyingToCommentIdAtom,
  );
  const [editingCommentId, setEditingCommentId] = useAtom(editingCommentIdAtom);
  const [collapsedCommentIds, setCollapsedCommentIds] = useAtom(
    collapsedCommentIdsAtom,
  );
  const [continuedCommentThreadIds, setContinuedCommentThreadIds] = useAtom(
    continuedCommentThreadIdsAtom,
  );
  const [visibleReplyCountsByCommentId, setVisibleReplyCountsByCommentId] =
    useAtom(visibleReplyCountsByCommentIdAtom);
  const [
    visibleRootCommentCountsByPostId,
    setVisibleRootCommentCountsByPostId,
  ] = useAtom(visibleRootCommentCountsByPostIdAtom);

  const archived = group.status === "archived";
  const canInteract = Boolean(group.joined) && !archived;
  const draft = commentDrafts[post.id] ?? "";
  const normalizedSearch = normalizeSearchValue(commentSearch);
  const searchActive = normalizedSearch.length > 0;
  const visibleRootCount =
    visibleRootCommentCountsByPostId[post.id] ?? ROOT_COMMENT_PAGE_SIZE;

  const comments = query.comments;

  const visibleCommentTree = useMemo(() => {
    const tree = buildCommentTree(comments);
    return sortCommentTree(
      filterCommentTree(tree, normalizedSearch),
      commentSort,
    );
  }, [comments, normalizedSearch, commentSort]);

  const rootComments = searchActive
    ? visibleCommentTree
    : visibleCommentTree.slice(0, visibleRootCount);
  const hiddenRootCount = Math.max(
    0,
    visibleCommentTree.length - rootComments.length,
  );

  const contextValue = useMemo<CommentThreadContextValue>(
    () => ({
      post,
      group,
      viewerId: identity,
      canInteract,
      searchActive,
      collapsedCommentIds,
      continuedCommentThreadIds,
      visibleReplyCountsByCommentId,
      replyDraftsByCommentId,
      replyingToCommentId,
      editingCommentId,
      onEditStart: (commentId) => {
        setReplyingToCommentId(null);
        setEditingCommentId(commentId);
      },
      onEditEnd: () => setEditingCommentId(null),
      onToggleCollapse: (commentId) =>
        setCollapsedCommentIds((previous) =>
          previous.includes(commentId)
            ? previous.filter((id) => id !== commentId)
            : [...previous, commentId],
        ),
      onContinueThread: (commentId) =>
        setContinuedCommentThreadIds((previous) =>
          previous.includes(commentId) ? previous : [...previous, commentId],
        ),
      onShowMoreReplies: (commentId, nextCount) =>
        setVisibleReplyCountsByCommentId((previous) => ({
          ...previous,
          [commentId]: nextCount,
        })),
      onReplyStart: (commentId) =>
        requireAuth(() => {
          setEditingCommentId(null);
          setReplyingToCommentId(commentId);
        }),
      onReplyCancel: (commentId) => {
        setReplyingToCommentId(null);
        setReplyDraftsByCommentId((previous) => ({
          ...previous,
          [commentId]: "",
        }));
      },
      onReplyDraftChange: (commentId, value) =>
        setReplyDraftsByCommentId((previous) => ({
          ...previous,
          [commentId]: value,
        })),
      onReplyPosted: (parentCommentId) => {
        setReplyDraftsByCommentId((previous) => ({
          ...previous,
          [parentCommentId]: "",
        }));
        setReplyingToCommentId(null);
        setCollapsedCommentIds((previous) =>
          previous.filter((id) => id !== parentCommentId),
        );
        setVisibleReplyCountsByCommentId((previous) => ({
          ...previous,
          [parentCommentId]: Math.max(
            previous[parentCommentId] ?? DEFAULT_VISIBLE_REPLY_COUNT,
            DEFAULT_VISIBLE_REPLY_COUNT + 1,
          ),
        }));
      },
    }),
    [
      post,
      group,
      identity,
      canInteract,
      searchActive,
      collapsedCommentIds,
      continuedCommentThreadIds,
      visibleReplyCountsByCommentId,
      replyDraftsByCommentId,
      replyingToCommentId,
      editingCommentId,
      requireAuth,
      setCollapsedCommentIds,
      setContinuedCommentThreadIds,
      setEditingCommentId,
      setReplyDraftsByCommentId,
      setReplyingToCommentId,
      setVisibleReplyCountsByCommentId,
    ],
  );

  function submitRootComment() {
    const body = draft.trim();

    if (!body) {
      return;
    }

    requireAuth(() =>
      rootMutation.mutate(
        {
          path: `/${post.id}/comments`,
          method: "POST",
          body: { body, parentCommentId: null },
        },
        {
          onSuccess: () => {
            setCommentDrafts((previous) => ({ ...previous, [post.id]: "" }));
            setVisibleRootCommentCountsByPostId((previous) => ({
              ...previous,
              [post.id]: Math.max(visibleRootCount, ROOT_COMMENT_PAGE_SIZE),
            }));
          },
        },
      ),
    );
  }

  return (
    <section
      id="discussion"
      className="flex flex-col gap-5"
      aria-label={`Discussion for ${post.title}`}
    >
      {archived ? (
        <p
          role="status"
          className="rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
        >
          This archived discussion is read-only.
        </p>
      ) : group.joined ? (
        <CommunityCommentComposer
          id={`comment-${post.id}`}
          value={draft}
          placeholder="Join the conversation"
          submitLabel="Comment"
          pending={rootMutation.isPending}
          error={rootMutation.error}
          onChange={(value) =>
            setCommentDrafts((previous) => ({ ...previous, [post.id]: value }))
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
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary/8 p-4 ring-1 ring-primary/20">
          <p className="text-sm text-foreground">
            Join this community to comment, reply and react.
          </p>
          <CommunityMembershipButton group={group} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <CommentSortToggle
          options={COMMENT_SORT_OPTIONS}
          value={commentSort}
          onChange={setCommentSort}
        />

        <div className="relative w-full min-w-0 sm:w-auto sm:max-w-xs sm:flex-1">
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
            className="h-9 rounded-full border-transparent bg-muted pl-9 focus-visible:border-ring focus-visible:bg-background"
          />
        </div>
      </div>

      <CommunityQueryError
        error={query.error}
        onRetry={() => void query.refetch()}
      />

      {query.isPending ? (
        <div role="status" className="space-y-4">
          <span className="sr-only">Loading comments</span>
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : null}

      {!query.isPending && !query.isError && comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          No comments yet. Share a tip, a question, or a route note.
        </div>
      ) : null}

      {comments.length > 0 && rootComments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
          No comments match that search.
        </div>
      ) : null}

      {rootComments.length > 0 ? (
        <CommentThreadContext.Provider value={contextValue}>
          <CommentBranch nodes={rootComments} level={0} />
        </CommentThreadContext.Provider>
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
      ) : query.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
          className="self-start rounded-full"
        >
          <MessageCircle className="size-4" aria-hidden="true" />
          {query.isFetchingNextPage ? "Loading…" : "Load more comments"}
        </Button>
      ) : null}
    </section>
  );
}
