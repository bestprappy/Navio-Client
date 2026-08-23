"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { MessageSquare, Send } from "lucide-react";
import { useAtom, useSetAtom } from "jotai";

import {
  commentDraftsAtom,
  extraCommentsByPostIdAtom,
} from "../../_components/community-atoms";
import type { CommunityComment, CommunityPost } from "../../_components/data";
import {
  currentCommunityUser,
  formatRelativeTime,
  getInitials,
  getTripById,
  getUserById,
} from "../../_components/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type CommunityDiscussionProps = {
  post: CommunityPost;
  comments: CommunityComment[];
};

export function CommunityDiscussion({
  post,
  comments,
}: CommunityDiscussionProps) {
  const [commentDrafts, setCommentDrafts] = useAtom(commentDraftsAtom);
  const setExtraCommentsByPostId = useSetAtom(extraCommentsByPostIdAtom);
  const draft = commentDrafts[post.id] ?? "";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const body = draft.trim();

    if (!body) {
      return;
    }

    const nextComment: CommunityComment = {
      id: `comment-local-${post.id}-${Date.now()}`,
      postId: post.id,
      authorId: currentCommunityUser.id,
      body,
      createdAt: new Date().toISOString(),
      upvotes: 0,
    };

    setExtraCommentsByPostId((previous) => ({
      ...previous,
      [post.id]: [...(previous[post.id] ?? []), nextComment],
    }));
    setCommentDrafts((previous) => ({ ...previous, [post.id]: "" }));
  }

  return (
    <section
      id={`discussion-${post.id}`}
      aria-label={`Discussion for ${post.title}`}
      className="border-t border-border bg-muted/20 px-4 py-4 sm:px-5"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <MessageSquare className="size-4" aria-hidden="true" />
        Discussion
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {comments.length > 0 ? (
          comments.map((comment) => {
            const author = getUserById(comment.authorId);
            const trip = comment.sharedTripId
              ? getTripById(comment.sharedTripId)
              : null;

            return (
              <article key={comment.id} className="flex gap-3">
                <Avatar size="sm">
                  <AvatarImage src={author.avatarUrl} alt={author.name} />
                  <AvatarFallback>{getInitials(author.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {author.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{author.handle}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                    {trip?.href ? (
                      <Link
                        href={trip.href}
                        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      >
                        <Badge variant="outline" className="max-w-56">
                          <span className="truncate">mentions {trip.title}</span>
                        </Badge>
                      </Link>
                    ) : trip ? (
                      <Badge variant="outline">mentions {trip.location}</Badge>
                    ) : null}
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {comment.body}
                  </p>
                </div>
              </article>
            );
          })
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-card/60 px-4 py-3 text-sm text-muted-foreground">
            No discussion yet. Start with a route note or restaurant tip.
          </p>
        )}
      </div>

      <form className="mt-4 flex flex-col gap-3" onSubmit={handleSubmit}>
        <label
          htmlFor={`comment-${post.id}`}
          className="text-sm font-medium text-foreground"
        >
          Add a discussion
        </label>
        <Textarea
          id={`comment-${post.id}`}
          value={draft}
          onChange={(event) =>
            setCommentDrafts((previous) => ({
              ...previous,
              [post.id]: event.target.value,
            }))
          }
          placeholder="Share a trip tweak, route warning, restaurant swap, or timing note."
          aria-label={`Add a discussion to ${post.title}`}
          className="min-h-24 bg-card"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={!draft.trim()}>
            <Send aria-hidden="true" />
            Add discussion
          </Button>
        </div>
      </form>
    </section>
  );
}
