"use client";

import type { ReactNode } from "react";
import { Minus, MoreHorizontal, Plus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Shared comment tree used by every comment section (Community posts, Shared
 * Plans and Guides) so threads look and behave identically.
 *
 * Geometry: the reply indent is 44px (`ml-11`) and every rail and curved elbow
 * sits 28px left of a reply, at x=16px, the centre of the parent's 32px avatar.
 */

export type CommentTreeCollapse = {
  collapsed: boolean;
  onToggle: () => void;
  /** Id of the replies container this toggle shows and hides. */
  controlsId: string;
};

type CommentTreeItemProps = {
  id?: string;
  level: number;
  isLastSibling: boolean;
  avatar: ReactNode;
  /** Present only when the comment has replies. */
  collapse?: CommentTreeCollapse;
  /** True while the replies are shown inline, which draws the parent's rail. */
  railVisible: boolean;
  /** Replies, a collapsed summary or a "continue" control, rendered indented. */
  replies?: ReactNode;
  children: ReactNode;
};

export function CommentTreeItem({
  id,
  level,
  isLastSibling,
  avatar,
  collapse,
  railVisible,
  replies,
  children,
}: CommentTreeItemProps) {
  return (
    <article
      id={id}
      className={cn(
        "relative min-w-0",
        level > 0 &&
          !isLastSibling &&
          "after:pointer-events-none after:absolute after:-left-7 after:top-0 after:bottom-0 after:border-l after:border-border after:content-['']",
      )}
    >
      {level > 0 ? (
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute -left-7 -top-3 h-7 w-6 overflow-visible text-border"
          viewBox="0 0 24 28"
          fill="none"
        >
          <path d="M 0.5 0 V 11.5 Q 0.5 27.5 16.5 27.5 H 24" stroke="currentColor" />
        </svg>
      ) : null}
      <div
        className={cn(
          "relative flex min-w-0 gap-3",
          railVisible &&
            "min-h-[58px] before:pointer-events-none before:absolute before:left-4 before:top-[58px] before:bottom-0 before:border-l before:border-border before:content-['']",
        )}
      >
        <div className="flex shrink-0 flex-col items-center">
          {avatar}
          {collapse ? (
            <div className="mt-1.5 flex flex-1 flex-col items-center">
              <button
                type="button"
                onClick={collapse.onToggle}
                className="z-10 inline-flex size-4 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                aria-expanded={!collapse.collapsed}
                aria-controls={collapse.controlsId}
                aria-label={collapse.collapsed ? "Expand replies" : "Collapse replies"}
              >
                {collapse.collapsed ? (
                  <Plus className="size-3" aria-hidden="true" />
                ) : (
                  <Minus className="size-3" aria-hidden="true" />
                )}
              </button>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 pb-1">{children}</div>
      </div>

      {replies ? (
        <div className="ml-11 mt-3" id={collapse?.controlsId}>
          {replies}
        </div>
      ) : null}
    </article>
  );
}

export function CommentTreeBranch({
  level,
  children,
}: {
  level: number;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex flex-col", level === 0 ? "gap-6" : "gap-3")}>
      {children}
    </div>
  );
}

export function CommentTreeAvatar({
  initials,
  imageUrl,
}: {
  initials: string;
  imageUrl?: string | null;
}) {
  return (
    <Avatar className="size-8">
      {imageUrl ? <AvatarImage src={imageUrl} alt="" /> : null}
      <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
    </Avatar>
  );
}

export function CommentTreeMeta({
  author,
  createdAt,
  timeLabel,
  edited,
  deleted,
}: {
  author: ReactNode;
  createdAt: string;
  timeLabel: string;
  edited: boolean;
  deleted: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {/* A removed comment no longer credits its author. */}
      <span
        className={cn(
          "text-sm font-semibold",
          deleted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {deleted ? "[deleted]" : author}
      </span>
      <time dateTime={createdAt} className="text-xs text-muted-foreground">
        {timeLabel}
      </time>
      {edited ? <span className="text-xs text-muted-foreground">(edited)</span> : null}
    </div>
  );
}

export function CommentTreeBody({
  deleted,
  children,
}: {
  deleted: boolean;
  children: ReactNode;
}) {
  return (
    <p
      className={cn(
        "mt-1 max-w-full whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]",
        deleted ? "italic text-muted-foreground" : "text-foreground",
      )}
    >
      {deleted ? "Comment unavailable" : children}
    </p>
  );
}

/** Small text action in a comment toolbar or under a reply list. */
export function CommentTreeAction({
  icon,
  children,
  onClick,
  disabled,
  pill = false,
  expanded,
  controls,
}: {
  icon?: ReactNode;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** Toolbar actions are pills; reply-list controls are plain. */
  pill?: boolean;
  expanded?: boolean;
  controls?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={onClick}
      aria-expanded={expanded}
      aria-controls={controls}
      className={cn(
        "h-7 text-xs text-muted-foreground hover:text-foreground",
        pill ? "rounded-full px-2.5 font-semibold" : "px-2",
      )}
    >
      {icon}
      {children}
    </Button>
  );
}

/** Pill toggle that orders a comment section (Top/Latest, Oldest/Newest). */
export function CommentSortToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label="Sort comments" className="flex items-center gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex h-8 items-center rounded-full px-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === option.value
              ? "bg-secondary text-secondary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** The "..." menu holding a comment's owner and moderation actions. */
export function CommentTreeMenu({ children }: { children: ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-7 rounded-full text-muted-foreground"
            aria-label="More comment actions"
          />
        }
      >
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
