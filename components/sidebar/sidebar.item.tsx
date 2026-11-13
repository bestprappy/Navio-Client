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
        "group relative isolate flex min-h-11 w-full items-center rounded-xl text-sm font-medium transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/45",
        collapsed ? "justify-center px-1" : "gap-2.5 overflow-hidden px-3",
        isActive
          ? "bg-sidebar-accent/90 font-semibold text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/55 hover:text-foreground",
      )}
    >
      {icon ? (
        <span
          className={cn(
            "relative flex size-8 shrink-0 items-center justify-center rounded-lg transition-[background-color,color]",
            iconClassName
              ? iconClassName
              : isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground group-hover:bg-background/70 group-hover:text-foreground",
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
