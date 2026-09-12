"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowBigUp, ArrowBigDown, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { usePostMutation } from "./community-queries";
import { CommunityQueryError } from "./community-query-state";

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

export function CommunityShareButton({ href }: { href: string }) {
  const [fallback, setFallback] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      const url = new URL(href, window.location.origin).href;
      try { await navigator.clipboard.writeText(url); }
      catch (error) { console.error("Copy post link failed", { error }); setFallback(url); throw new Error("Copy the link below to share this post."); }
    },
  });
  return <div className="space-y-2">
    <Button variant="ghost" size="sm" disabled={mutation.isPending} onClick={() => mutation.mutate()}><Share2 />{mutation.isSuccess ? "Link copied" : "Share"}</Button>
    <CommunityQueryError error={mutation.error} />
    {fallback ? <Input aria-label="Post link" readOnly value={fallback} onFocus={(event) => event.target.select()} /> : null}
  </div>;
}
