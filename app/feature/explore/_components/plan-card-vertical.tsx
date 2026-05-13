"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, Heart, MapPin, Star } from "lucide-react";

import type { Plan, UserProfile } from "./data";
import { formatCount, getPlanHref } from "./data";
import { UserBadge } from "./user-badge";

type PlanCardVerticalProps = {
  plan: Plan;
  author: UserProfile;
  onShare: (planId: string) => void;
  variant?: "default" | "trending" | "recent2" | "recent4";
};

export function PlanCardVertical({
  plan,
  author,
  onShare,
  variant = "default",
}: PlanCardVerticalProps) {
  const href = getPlanHref(plan);
  const reviewHref = `${href}#reviews`;
  const [isLiked, setIsLiked] = useState(false);
  const isRecent2 = variant === "recent2";
  const imageClassName =
    variant === "trending"
      ? "aspect-[3/4] w-full bg-cover bg-center transition duration-300 group-hover:scale-[1.04]"
      : variant === "recent2"
        ? "h-48 w-full bg-cover bg-center transition duration-300 group-hover:scale-[1.02]"
        : variant === "recent4"
          ? "aspect-square w-full bg-cover bg-center transition duration-300 group-hover:scale-[1.02]"
          : "h-72 w-full bg-cover bg-center transition duration-300 group-hover:scale-[1.02]";

  const titleClassName =
    variant === "trending"
      ? "text-base font-semibold text-foreground line-clamp-2"
      : variant === "recent2"
        ? "text-base font-semibold text-foreground line-clamp-2"
        : variant === "recent4"
          ? "text-sm font-semibold text-foreground line-clamp-1"
          : "text-sm font-semibold text-foreground";

  const descriptionClassName =
    variant === "trending"
      ? "text-sm text-muted-foreground line-clamp-2"
      : variant === "recent2"
        ? "text-sm text-muted-foreground line-clamp-2"
        : variant === "recent4"
          ? "text-xs text-muted-foreground line-clamp-2"
          : "text-xs text-muted-foreground line-clamp-2";
  const metaSizeClassName =
    variant === "recent4"
      ? "text-[11px]"
      : variant === "recent2"
        ? "text-sm"
        : variant === "trending"
          ? "text-sm"
          : "text-xs";

  return (
    <article
      className={`flex flex-col gap-3 ${variant === "recent4" ? "min-w-0" : "min-w-[260px]"}`}
      data-plan-card
    >
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <Link href={href} className="block">
          <div
            className={imageClassName}
            style={{ backgroundImage: `url(${plan.imageUrl})` }}
            aria-label={plan.title}
          />
        </Link>
        <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onShare(plan.id);
            }}
            className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur transition hover:bg-background"
          >
            Share
          </button>
          <button
            type="button"
            aria-label="More options"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-lg text-foreground shadow-sm backdrop-blur transition hover:bg-background"
          >
            ...
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <Link href={href} className="block w-fit">
          <h3
            className={`${titleClassName} decoration-2 underline-offset-4 transition hover:underline`}
          >
            {plan.title}
          </h3>
        </Link>
        <div
          className={`${metaSizeClassName} flex flex-wrap items-center gap-3 text-muted-foreground`}
        >
          <button
            type="button"
            onClick={(event) => event.preventDefault()}
            className="flex items-center gap-1 font-medium text-green-800 underline decoration-green-800/70 underline-offset-4 hover:text-green-900"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{plan.location}</span>
          </button>
          <Link
            href={reviewHref}
            className="flex items-center gap-1 underline underline-offset-4 hover:text-foreground"
          >
            <Star className="h-3.5 w-3.5 text-primary" />
            {plan.rating.toFixed(1)} ({plan.reviews.toLocaleString()})
          </Link>
          {variant !== "trending" && variant !== "recent4" ? (
            <span>{plan.lastUpdated}</span>
          ) : null}
        </div>
        <p className={descriptionClassName}>{plan.description}</p>
        {variant === "recent4" ? (
          <div className="flex items-center justify-between">
            <p className={`${metaSizeClassName} text-muted-foreground`}>
              {plan.lastUpdated}
            </p>
            <button
              type="button"
              aria-pressed={isLiked}
              onClick={() => setIsLiked((prev) => !prev)}
              className={`flex items-center gap-1 rounded-full border border-border/60 px-3 ${
                isRecent2 ? "py-2 text-sm" : "py-1.5 text-xs"
              } font-medium shadow-sm transition ${
                isLiked
                  ? "bg-red-50 text-red-600 ring-2 ring-red-300"
                  : "bg-card/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart
                className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`}
              />
              Like
            </button>
          </div>
        ) : null}
      </div>
      <div className="flex items-center justify-between">
        <UserBadge
          user={author}
          variant={variant === "recent4" ? "compact" : "default"}
        />
        {variant === "recent4" ? (
          <div
            className={`${metaSizeClassName} flex items-center gap-2 text-muted-foreground`}
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
        ) : (
          <div
            className={`${metaSizeClassName} flex items-center gap-2 text-muted-foreground`}
          >
            <button
              type="button"
              aria-pressed={isLiked}
              onClick={() => setIsLiked((prev) => !prev)}
              className={`flex items-center gap-1 rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium shadow-sm transition ${
                isLiked
                  ? "bg-red-50 text-red-600 ring-2 ring-red-300"
                  : "bg-card/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart
                className={`h-3.5 w-3.5 ${isLiked ? "fill-current" : ""}`}
              />
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
