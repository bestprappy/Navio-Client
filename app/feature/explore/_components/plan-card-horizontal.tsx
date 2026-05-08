"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Heart, MapPin, Star } from "lucide-react";

import type { Plan, UserProfile } from "./data";
import { formatCount, getPlanHref } from "./data";
import { UserBadge } from "./user-badge";

type PlanCardHorizontalProps = {
  plan: Plan;
  author: UserProfile;
  onShare: (planId: string) => void;
};

export function PlanCardHorizontal({
  plan,
  author,
  onShare,
}: PlanCardHorizontalProps) {
  const href = getPlanHref(plan);
  const [isLiked, setIsLiked] = useState(false);

  return (
    <article className="grid gap-6 border-b border-border/40 pb-8 md:grid-cols-[1fr_1fr]">
      <div className="relative overflow-hidden rounded-2xl">
        <Link href={href} className="block">
          <div
            className="aspect-[4/3] w-full bg-cover bg-center transition duration-300 group-hover:scale-[1.02]"
            style={{ backgroundImage: `url(${plan.imageUrl})` }}
            aria-label={plan.title}
          />
        </Link>
        <div className="absolute left-3 top-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onShare(plan.id)}
            className="rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur transition hover:bg-background"
          >
            Share
          </button>
          <button
            type="button"
            aria-label="More options"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-lg text-foreground shadow-sm backdrop-blur transition hover:bg-background"
          >
            ...
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Link href={href} className="space-y-3">
          <h3 className="text-2xl font-semibold text-foreground">
            {plan.title}
          </h3>
          <div className="flex flex-wrap items-center gap-4 text-lg text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {plan.location}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-primary" />
              {plan.rating.toFixed(1)} ({plan.reviews.toLocaleString()} reviews)
            </span>
            <span>Last Updated: {plan.lastUpdated}</span>
          </div>
          <p className="text-lg text-muted-foreground line-clamp-3">
            {plan.description}
          </p>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="text-base">
            <UserBadge user={author} />
          </div>
          <div className="flex items-center gap-4 text-base text-muted-foreground">
            <button
              type="button"
              aria-pressed={isLiked}
              onClick={() => setIsLiked((prev) => !prev)}
              className={`flex items-center gap-1 rounded-full px-2 py-1 transition ${
                isLiked
                  ? "text-destructive ring-2 ring-destructive/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className="h-5 w-5" />
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
