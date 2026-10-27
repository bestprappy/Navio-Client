"use client";
import { useState } from "react";
import { MessageCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { ReaderSection, readerButton } from "./reader-ui";

export function ReaderFeedback() {
  const [rating,setRating]=useState(0);
  const [comment,setComment]=useState("");
  const [preview,setPreview]=useState("");
  return <ReaderSection id="reader-feedback" eyebrow="Traveler feedback" title="Ratings & conversation">
    <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground">UI preview · ratings and comments are not submitted or saved yet.</p>
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4"><div><h3 className="text-sm font-semibold">How useful is this plan?</h3><p className="mt-1 text-xs text-muted-foreground">Rate the trip plan, not its individual places.</p></div><span className="text-xs text-muted-foreground">Not rated yet</span></div>
      <fieldset className="mt-4"><legend className="sr-only">Preview your plan rating</legend><div className="flex items-center gap-1">{[1,2,3,4,5].map(value=><label key={value} className="relative cursor-pointer rounded-lg p-2 hover:bg-muted has-focus-visible:ring-2 has-focus-visible:ring-ring"><input className="peer sr-only" type="radio" name="reader-rating" value={value} checked={rating===value} onChange={()=>setRating(value)} aria-label={`${value} star${value===1?"":"s"}`} /><Star className={cn("size-6 text-muted-foreground/35",rating>=value&&"fill-rating text-rating")} /></label>)}<span aria-live="polite" className="ml-3 text-xs text-muted-foreground">{rating?`${rating}/5 · preview only`:"Choose a rating"}</span></div></fieldset>
    </div>
    <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold"><MessageCircle className="size-4 text-muted-foreground" />Questions & thoughts</h3>
      <label htmlFor="reader-comment" className="sr-only">Your comment draft</label><Textarea id="reader-comment" value={comment} maxLength={1500} onChange={e=>setComment(e.target.value)} placeholder="Ask about the itinerary, or share what you found useful…" className="min-h-24 resize-y rounded-xl border-border/70 bg-background text-sm" />
      <div className="flex items-center justify-between gap-3"><span className="text-[11px] text-muted-foreground">{comment.length}/1500 · draft only</span><button type="button" disabled={!comment.trim()} className={readerButton} onClick={()=>setPreview(comment.trim())}>Preview comment</button></div>
      {preview && <article className="space-y-2 border-t border-border/60 pt-4"><div className="flex items-center gap-2 text-xs"><strong>You</strong><span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">Unposted preview</span></div><p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">{preview}</p><button type="button" className="text-xs text-primary hover:underline" onClick={()=>setPreview("")}>Dismiss preview</button></article>}
    </div>
  </ReaderSection>;
}
