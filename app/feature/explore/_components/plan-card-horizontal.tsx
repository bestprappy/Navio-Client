"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, Eye, Heart, MapPin, Share2, Star } from "lucide-react";

import type { Plan, UserProfile } from "./data";
import { formatCount, getPlanHref } from "./data";
import { UserBadge } from "./user-badge";

type PlanCardHorizontalProps = {
  plan: Plan;
  author: UserProfile;
  onShare: (planId: string) => void;
  variant?: "default" | "recent1";
};

export function PlanCardHorizontal({
  plan,
  author,
  onShare,
  variant = "default",
}: PlanCardHorizontalProps) {
  const href = getPlanHref(plan);
  const reviewHref = `${href}#reviews`;
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const isRecent = variant === "recent1";

  return (
    <article
      className={`grid gap-6 border-b border-border/40 pb-8 ${isRecent ? "md:grid-cols-[minmax(280px,420px)_1fr]" : "md:grid-cols-[1fr_1fr]"}`}
    >
      <div className="group relative overflow-hidden rounded-lg">
        <Link href={href} className="block cursor-pointer">
          <div
            className={`${isRecent ? "aspect-[5/3]" : "aspect-[4/3]"} w-full bg-cover bg-center transition duration-300 group-hover:scale-[1.02]`}
            style={{ backgroundImage: `url(${plan.imageUrl})` }}
            aria-label={plan.title}
          />
        </Link>
        <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
          <button
            type="button"
            aria-pressed={isSaved}
            aria-label={isSaved ? "Saved" : "Save"}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setIsSaved((prev) => !prev);
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur transition hover:bg-background cursor-pointer ${
              isSaved
                ? "text-emerald-600 ring-2 ring-emerald-300"
                : "text-foreground"
            }`}
          >
            <Bookmark
              className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`}
            />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onShare(plan.id);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur transition hover:bg-background cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="rounded-full border border-primary/40 bg-background/85 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur transition hover:bg-background cursor-pointer"
          >
            Copy Plan
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <div className="space-y-3">
          <Link href={href} className="block w-fit cursor-pointer">
            <h3
              className={`${isRecent ? "text-xl sm:text-2xl" : "text-2xl"} font-semibold text-foreground decoration-2 underline-offset-4 transition hover:underline`}
            >
              {plan.title}
            </h3>
          </Link>
          <div
            className={`${isRecent ? "text-sm sm:text-base" : "text-lg"} flex flex-wrap items-center gap-4 text-muted-foreground`}
          >
            <button
              type="button"
              onClick={(event) => event.preventDefault()}
              className="flex items-center gap-1 font-medium text-green-800 underline decoration-green-800/70 underline-offset-4 hover:text-green-900 cursor-pointer"
            >
              <MapPin className="h-4 w-4" />
              {plan.location}
            </button>
            <Link
              href={reviewHref}
              className="flex items-center gap-1 underline underline-offset-4 hover:text-foreground cursor-pointer"
            >
              <Star className="h-4 w-4 text-primary" />
              {plan.rating.toFixed(1)} ({plan.reviews.toLocaleString()} reviews)
            </Link>
            <span>Last Updated: {plan.lastUpdated}</span>
          </div>
          <p
            className={`${isRecent ? "text-base" : "text-lg"} text-muted-foreground line-clamp-3`}
          >
            {plan.description}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-base">
            <UserBadge user={author} />
          </div>
          <div className="flex items-center gap-4 text-base text-muted-foreground">
            <button
              type="button"
              aria-pressed={isLiked}
              onClick={() => setIsLiked((prev) => !prev)}
              className={`flex items-center gap-1 rounded-full px-2 py-1 transition cursor-pointer ${
                isLiked
                  ? "bg-red-50 text-red-600 ring-2 ring-red-300"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
              Like
            </button>
            <span className="flex items-center gap-1">
              <Heart className="h-5 w-5" />
              {formatCount(plan.likes)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-5 w-5" />
              {formatCount(plan.views)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
