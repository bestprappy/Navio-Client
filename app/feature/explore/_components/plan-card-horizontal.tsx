"use client";

import { type MouseEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Eye, Heart, MapPin, Share2, Star } from "lucide-react";

import type { Plan, UserProfile } from "./data";
import { formatCount, getPlanCopyHref, getPlanHref } from "./data";
import { isInteractiveCardTarget } from "./plan-card-navigation";
import { UserBadge } from "@/components/user-badge";
import { cn } from "@/lib/utils";

type PlanCardHorizontalProps = {
  plan: Plan;
  author: UserProfile;
  onShare: (planId: string) => void;
  variant?: "default" | "featured";
};

export function PlanCardHorizontal({
  plan,
  author,
  onShare,
  variant = "default",
}: PlanCardHorizontalProps) {
  const router = useRouter();
  const href = getPlanHref(plan);
  const copyHref = getPlanCopyHref(plan);
  const reviewHref = `${href}#reviews`;
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const isFeatured = variant === "featured";

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    if (isInteractiveCardTarget(event.target)) {
      return;
    }

    router.push(href);
  }

  return (
    <article
      className={cn(
        "grid gap-6 border-b border-border/40 pb-8",
        isFeatured
          ? "md:grid-cols-[minmax(280px,420px)_1fr]"
          : "md:grid-cols-[1fr_1fr]",
        "cursor-pointer",
      )}
      onClick={handleCardClick}
    >
      <div className="group relative overflow-hidden rounded-lg">
        <Link href={href} className="block cursor-pointer">
          <div
            className={cn(
              "w-full bg-cover bg-center transition duration-300 group-hover:scale-[1.02]",
              isFeatured ? "aspect-5/3" : "aspect-4/3",
            )}
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
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur transition hover:bg-background cursor-pointer",
              isSaved && "text-success ring-2 ring-success/30",
            )}
          >
            <Bookmark
              className={cn("h-3.5 w-3.5", isSaved && "fill-current")}
            />
          </button>
          <button
            type="button"
            aria-label={`Share ${plan.title}`}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onShare(plan.id);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background/85 text-foreground shadow-sm backdrop-blur transition hover:bg-background cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <Link
            href={copyHref}
            aria-label={`Copy ${plan.title} to planner`}
            onClick={(event) => event.stopPropagation()}
            className="rounded-full border border-primary/40 bg-background/85 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur transition hover:bg-background cursor-pointer"
          >
            Copy Plan
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="space-y-3">
          <Link href={href} className="block w-fit cursor-pointer">
            <h3
              className={cn(
                "font-semibold text-foreground decoration-2 underline-offset-4 transition hover:underline",
                isFeatured ? "text-xl sm:text-2xl" : "text-2xl",
              )}
            >
              {plan.title}
            </h3>
          </Link>
          <div
            className={cn(
              "flex flex-wrap items-center gap-4 text-muted-foreground",
              isFeatured ? "text-sm sm:text-base" : "text-lg",
            )}
          >
            <button
              type="button"
              onClick={(event) => event.preventDefault()}
              className="flex items-center gap-1 font-medium text-success/90 underline decoration-success/70 underline-offset-4 hover:text-success cursor-pointer"
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
            className={cn(
              "text-muted-foreground line-clamp-3",
              isFeatured ? "text-base" : "text-lg",
            )}
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
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 transition cursor-pointer",
                isLiked
                  ? "bg-destructive/10 text-destructive ring-2 ring-destructive/30"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
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
