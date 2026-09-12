"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowBigUp,
  ArrowBigDown,
  ArrowBigUpDash,
  ArrowBigDownDash,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { usePostMutation } from "./community-queries";
import { CommunityQueryError } from "./community-query-state";
import { formatCount } from "./data";
import { cn } from "@/lib/utils";

export function CommunityVoteButtons({ path, score, vote, disabled = false }: {
  path: string; score: number; vote: number; disabled?: boolean;
}) {
  const mutation = usePostMutation();
  const { requireAuth } = useRequireAuth();
  return <div className="space-y-2">
    <div className="flex items-center gap-1" role="group" aria-label="Vote">
      <Button variant={vote === 1 ? "secondary" : "ghost"} size="icon-sm" aria-label="Upvote" aria-pressed={vote === 1}
        disabled={disabled || mutation.isPending} onClick={() => requireAuth(() => mutation.mutate({ path, method: "PUT", body: { value: vote === 1 ? 0 : 1 } }))}><ArrowBigUp /></Button>
      <span aria-live="polite" className="text-sm font-semibold">{score}</span>
      <Button variant={vote === -1 ? "secondary" : "ghost"} size="icon-sm" aria-label="Downvote" aria-pressed={vote === -1}
        disabled={disabled || mutation.isPending} onClick={() => requireAuth(() => mutation.mutate({ path, method: "PUT", body: { value: vote === -1 ? 0 : -1 } }))}><ArrowBigDown /></Button>
    </div>
    <CommunityQueryError error={mutation.error} />
  </div>;
}

/**
 * Pill-shaped vote control used by the post cards. Score and pressed state come
 * from the server so every viewer sees the same tally.
 */
export function CommunityVotePill({ path, score, vote, disabled = false }: {
  path: string; score: number; vote: number; disabled?: boolean;
}) {
  const mutation = usePostMutation();
  const { requireAuth } = useRequireAuth();
  const upvoted = vote === 1;
  const downvoted = vote === -1;
  const busy = disabled || mutation.isPending;

  function castVote(value: number) {
    requireAuth(() => mutation.mutate({ path, method: "PUT", body: { value } }));
  }

  return (
    <>
      <div
        role="group"
        aria-label="Vote"
        className="flex items-center overflow-hidden rounded-full bg-muted"
      >
        <button
          type="button"
          aria-label="Upvote"
          aria-pressed={upvoted}
          disabled={busy}
          onClick={() => castVote(upvoted ? 0 : 1)}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
            upvoted ? "text-primary" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ArrowBigUpDash className="size-3.5" fill={upvoted ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        <span
          aria-live="polite"
          className={cn(
            "min-w-[2ch] text-center text-xs font-bold",
            upvoted ? "text-primary" : downvoted ? "text-destructive" : "text-foreground",
          )}
        >
          {formatCount(score)}
        </span>
        <button
          type="button"
          aria-label="Downvote"
          aria-pressed={downvoted}
          disabled={busy}
          onClick={() => castVote(downvoted ? 0 : -1)}
          className={cn(
            "flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
            downvoted ? "text-destructive" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <ArrowBigDownDash className="size-3.5" fill={downvoted ? "currentColor" : "none"} aria-hidden="true" />
        </button>
      </div>
      {mutation.error ? (
        <span role="alert" className="basis-full text-xs text-destructive">
          {mutation.error.message}
        </span>
      ) : null}
    </>
  );
}

/**
 * Copies a post link to the clipboard. When the browser refuses clipboard
 * access the URL is handed back as `fallback` so the caller can show it for a
 * manual copy instead of failing silently.
 */
export function useShareLink(href: string) {
  const [fallback, setFallback] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      const url = new URL(href, window.location.origin).href;
      try {
        await navigator.clipboard.writeText(url);
      } catch (error) {
        console.error("Copy post link failed", { error });
        setFallback(url);
        throw new Error("Copy the link below to share this post.");
      }
    },
  });
  return { ...mutation, fallback };
}

export function CommunityShareButton({ href }: { href: string }) {
  const { mutate, isPending, isSuccess, error, fallback } = useShareLink(href);
  return <div className="space-y-2">
    <Button variant="ghost" size="sm" disabled={isPending} onClick={() => mutate()}><Share2 />{isSuccess ? "Link copied" : "Share"}</Button>
    <CommunityQueryError error={error} />
    {fallback ? <Input aria-label="Post link" readOnly value={fallback} onFocus={(event) => event.target.select()} /> : null}
  </div>;
}

/**
 * Pill-shaped share control used by the post cards, where it sits in a row
 * alongside the vote and comment pills.
 */
export function CommunitySharePill({ href }: { href: string }) {
  const { mutate, isPending, isSuccess, error, fallback } = useShareLink(href);
  return (
    <>
      <button
        type="button"
        disabled={isPending}
        onClick={() => mutate()}
        className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
      >
        <Share2 className="size-3.5" aria-hidden="true" />
        {isSuccess ? "Link copied" : "Share"}
      </button>
      {error ? (
        <span role="alert" className="basis-full text-xs text-destructive">
          {error.message}
        </span>
      ) : null}
      {fallback ? (
        <Input
          aria-label="Post link"
          readOnly
          value={fallback}
          onFocus={(event) => event.target.select()}
          className="basis-full"
        />
      ) : null}
    </>
  );
}
