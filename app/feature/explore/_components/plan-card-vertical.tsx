"use client";

import { type MouseEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  Share2,
  Star,
} from "lucide-react";

import type { Plan, UserProfile } from "./data";
import {
  formatCount,
  getPlanCopyHref,
  getPlanDiscussionHref,
  getPlanHref,
} from "./data";
import { isInteractiveCardTarget } from "./plan-card-navigation";
import { UserBadge } from "@/components/user-badge";
import { buttonVariants } from "@/components/ui/button.variants";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { cn } from "@/lib/utils";

type PlanCardVerticalProps = {
  plan: Plan;
  author: UserProfile;
  onShare: (planId: string) => void;
  variant?: "default" | "trending" | "featured" | "grid" | "compact";
};

export function PlanCardVertical({
  plan,
  author,
  onShare,
  variant = "default",
}: PlanCardVerticalProps) {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const href = getPlanHref(plan);
  const copyHref = getPlanCopyHref(plan);
  const discussionHref = getPlanDiscussionHref(plan);
  const reviewHref = `${href}#reviews`;
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const isCompact = variant === "compact";

  function handleCardClick(event: MouseEvent<HTMLElement>) {
    if (isInteractiveCardTarget(event.target)) {
      return;
    }

    router.push(href);
  }

  const imageClassName = cn(
    "w-full bg-cover bg-center transition duration-300",
    variant === "trending"
      ? "h-64 group-hover:scale-[1.04]"
      : variant === "featured"
        ? "h-48 group-hover:scale-[1.02]"
        : variant === "grid" || variant === "compact"
          ? "aspect-square group-hover:scale-[1.02]"
          : "h-72 group-hover:scale-[1.02]",
  );

  const titleClassName = cn(
    "font-semibold text-foreground decoration-2 underline-offset-4 transition hover:underline",
    variant === "trending" || variant === "featured"
      ? "text-base line-clamp-2"
      : variant === "grid" || variant === "compact"
        ? "text-sm line-clamp-1"
        : "text-sm",
  );

  const descriptionClassName = cn(
    "text-muted-foreground line-clamp-2",
    variant === "grid" || variant === "compact" ? "text-xs" : "text-sm",
  );

  const metaSizeClassName = cn(
    variant === "compact"
      ? "text-[11px]"
      : variant === "grid"
        ? "text-xs"
        : variant === "featured" || variant === "trending"
          ? "text-sm"
          : "text-xs",
  );

  const likeButtonClassName = cn(
    "flex items-center gap-1 rounded-full border border-border/60 px-3 font-medium shadow-sm transition cursor-pointer",
    isCompact ? "py-2 text-sm" : "py-1.5 text-xs",
    isLiked
      ? "bg-destructive/10 text-destructive ring-2 ring-destructive/30"
      : "bg-card/80 text-muted-foreground hover:text-foreground",
  );

  return (
    <article
      className={cn(
        "flex flex-col gap-3 cursor-pointer",
        isCompact ? "min-w-0" : "min-w-[260px]",
      )}
      data-plan-card
      onClick={handleCardClick}
    >
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <Link href={href} className="block cursor-pointer">
          <div
            className={imageClassName}
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
              requireAuth(() => setIsSaved((prev) => !prev));
            }}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition hover:bg-background cursor-pointer",
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition hover:bg-background cursor-pointer"
          >
            <Share2 className="h-4 w-4" />
          </button>
          <Link
            href={copyHref}
            aria-label={`Copy ${plan.title} to planner`}
            onClick={(event) => event.stopPropagation()}
            className="rounded-full border border-primary/40 bg-background/80 px-4 py-1.5 text-xs font-semibold text-primary shadow-sm backdrop-blur transition hover:bg-background cursor-pointer"
          >
            Copy Plan
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        <Link href={href} className="block w-fit cursor-pointer">
          <h3 className={titleClassName}>{plan.title}</h3>
        </Link>
        <div
          className={cn(
            metaSizeClassName,
            "flex flex-wrap items-center gap-3 text-muted-foreground",
          )}
        >
          <button
            type="button"
            onClick={(event) => event.preventDefault()}
            className="flex items-center gap-1 font-medium text-success/90 underline decoration-success/70 underline-offset-4 hover:text-success cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{plan.location}</span>
          </button>
          <Link
            href={reviewHref}
            className="flex items-center gap-1 underline underline-offset-4 hover:text-foreground cursor-pointer"
          >
            <Star className="h-3.5 w-3.5 text-primary" />
            {plan.rating.toFixed(1)} ({plan.reviews.toLocaleString()})
          </Link>
          {variant !== "trending" && variant !== "compact" ? (
            <span>{plan.lastUpdated}</span>
          ) : null}
        </div>
        <p className={descriptionClassName}>{plan.description}</p>
        {variant === "compact" ? (
          <div className="flex items-center justify-between">
            <p className={cn(metaSizeClassName, "text-muted-foreground")}>
              {plan.lastUpdated}
            </p>
            <button
              type="button"
              aria-pressed={isLiked}
              onClick={() =>
                requireAuth(() => setIsLiked((prev) => !prev))
              }
              className={likeButtonClassName}
            >
              <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
              Like
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <UserBadge
          user={author}
          variant={variant === "compact" ? "compact" : "default"}
        />
        {variant === "compact" ? (
          <div className="flex items-center gap-2">
            <Link
              href={discussionHref}
              aria-label={`Start a discussion about ${plan.title}`}
              onClick={(event) => event.stopPropagation()}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full border-primary/30 px-3 text-primary hover:text-primary",
              )}
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Discuss
            </Link>
            <div
              className={cn(
                metaSizeClassName,
                "flex items-center gap-2 text-muted-foreground",
              )}
            >
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {formatCount(plan.likes)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {formatCount(plan.views)}
              </span>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              metaSizeClassName,
              "flex flex-wrap items-center justify-end gap-2 text-muted-foreground",
            )}
          >
            <Link
              href={discussionHref}
              aria-label={`Start a discussion about ${plan.title}`}
              onClick={(event) => event.stopPropagation()}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-full border-primary/30 px-3 text-primary hover:text-primary",
              )}
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Start Discussion
            </Link>
            <button
              type="button"
              aria-pressed={isLiked}
              onClick={() =>
                requireAuth(() => setIsLiked((prev) => !prev))
              }
              className={likeButtonClassName}
            >
              <Heart className={cn("h-3.5 w-3.5", isLiked && "fill-current")} />
              Like
            </button>
            <span className="flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" />
              {formatCount(plan.likes)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {formatCount(plan.views)}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
