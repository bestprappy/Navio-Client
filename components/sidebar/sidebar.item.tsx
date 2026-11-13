"use client";

import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SidebarItemProps = {
  title: string;
  href: string;
  /** Shown at the row's end, or on the icon when collapsed. Mark it aria-hidden and describe it in `accessibleLabel`. */
  badge?: ReactNode;
  /** Replaces `title` as the link's accessible name when the visible text isn't the whole story. */
  accessibleLabel?: string;
  icon?: ReactNode;
  iconClassName?: string;
  isActive?: boolean;
  collapsed?: boolean;
  variant?: "navigation" | "action";
  onClick?: MouseEventHandler<HTMLAnchorElement>;
  /** `data-tour` value when a first-time tour points at this row. */
  tourTarget?: string;
};

export default function SidebarItem({
  accessibleLabel,
  badge,
  href,
  icon,
  iconClassName,
  isActive = false,
  onClick,
  title,
  collapsed = false,
  variant = "navigation",
  tourTarget,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      data-active={isActive ? "true" : "false"}
      data-tour={tourTarget}
      aria-label={accessibleLabel ?? (collapsed ? title : undefined)}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? (accessibleLabel ?? title) : undefined}
      className={cn(
        "relative flex min-h-11 w-full items-center text-sm font-medium",
        variant === "action"
          ? "rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-ring"
          : "group isolate rounded-xl transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/45",
        collapsed
          ? cn("justify-center", variant === "action" ? "px-0" : "px-1")
          : cn("overflow-hidden px-3", variant === "action" ? "gap-3" : "gap-2.5"),
        isActive
          ? "bg-sidebar-accent/90 font-semibold text-sidebar-accent-foreground"
          : cn("text-muted-foreground hover:text-foreground", variant === "action" ? "hover:bg-muted" : "hover:bg-sidebar-accent/55"),
      )}
    >
      {icon ? (
        <span
          className={cn(
            "relative flex shrink-0 items-center justify-center",
            variant === "action" ? "size-5" : "size-8 rounded-lg transition-[background-color,color]",
            iconClassName
              ? iconClassName
              : variant === "navigation"
                ? isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground group-hover:bg-background/70 group-hover:text-foreground"
                : undefined,
          )}
        >
          {icon}
          {collapsed && badge ? <span className="absolute left-1/2 -top-1 flex">{badge}</span> : null}
        </span>
      ) : null}

      {!collapsed && (
        <span className="min-w-0 flex-1 break-words text-left">{title}</span>
      )}

      {!collapsed && badge ? <span className="-mr-1 ml-auto flex shrink-0">{badge}</span> : null}
    </Link>
  );
}
