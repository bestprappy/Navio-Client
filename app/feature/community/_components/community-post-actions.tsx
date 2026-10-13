"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowBigUp,
  ArrowBigDown,
  Share2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { usePostMutation } from "./community-queries";
import { formatCount } from "./data";
import { cn } from "@/lib/utils";

/** Shared look for the quiet action pills (comments, share, overflow) in a post's action row. */
export const COMMUNITY_PILL_CLASS =
  "inline-flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";

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
        className={cn(
          "flex h-8 items-center rounded-full transition-colors",
          upvoted ? "bg-vote-up text-white" : downvoted ? "bg-vote-down text-white" : "bg-muted",
        )}
      >
        <button
          type="button"
          aria-label="Upvote"
          aria-pressed={upvoted}
          disabled={busy}
          onClick={() => castVote(upvoted ? 0 : 1)}
          className={cn(
            "flex h-8 items-center rounded-full px-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60",
            upvoted ? "hover:bg-black/10" : "text-muted-foreground hover:bg-vote-up/12 hover:text-vote-up",
          )}
        >
          <ArrowBigUp className="size-5" fill={upvoted ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        <span
          aria-live="polite"
          className={cn(
            "min-w-[2ch] text-center text-xs font-bold tabular-nums",
            !upvoted && !downvoted && "text-foreground",
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
            "flex h-8 items-center rounded-full px-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60",
            downvoted ? "hover:bg-black/10" : "text-muted-foreground hover:bg-vote-down/12 hover:text-vote-down",
          )}
        >
          <ArrowBigDown className="size-5" fill={downvoted ? "currentColor" : "none"} aria-hidden="true" />
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
        className={COMMUNITY_PILL_CLASS}
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
