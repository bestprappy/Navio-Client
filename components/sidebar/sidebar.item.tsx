"use client";

import Link from "next/link";
import type { MouseEventHandler, ReactNode } from "react";

import { cn } from "@/lib/utils";

type SidebarItemProps = {
  title: string;
  href: string;
  alert?: number | string;
  icon?: ReactNode;
  iconClassName?: string;
  isActive?: boolean;
  collapsed?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
};

export default function SidebarItem({
  alert,
  href,
  icon,
  iconClassName,
  isActive = false,
  onClick,
  title,
  collapsed = false,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      data-active={isActive ? "true" : "false"}
      aria-label={collapsed ? title : undefined}
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? title : undefined}
      className={cn(
        "group relative isolate flex min-h-11 w-full items-center overflow-hidden rounded-xl text-sm font-medium transition-[background-color,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/45 focus-visible:ring-offset-1 focus-visible:ring-offset-card",
        collapsed ? "justify-center px-1" : "gap-2.5 px-3",
        isActive
          ? "bg-sidebar-accent/90 font-semibold text-sidebar-accent-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/55 hover:text-foreground",
      )}
    >
      {icon ? (
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg transition-[background-color,color]",
            iconClassName
              ? iconClassName
              : isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground group-hover:bg-background/70 group-hover:text-foreground",
          )}
        >
          {icon}
        </span>
      ) : null}

      {!collapsed && (
        <span className="min-w-0 flex-1 truncate text-left">{title}</span>
      )}

      {!collapsed && alert !== undefined ? (
        <span
          className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground"
          aria-label={`${alert} notifications`}
        >
          {alert}
        </span>
      ) : null}
    </Link>
  );
}
