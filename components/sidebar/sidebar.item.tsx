"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SidebarItemProps = {
  title: string;
  href: string;
  alert?: number | string;
  icon?: ReactNode;
  iconClassName?: string;
  isActive?: boolean;
  collapsed?: boolean;
};

export default function SidebarItem({
  alert,
  href,
  icon,
  iconClassName,
  isActive = false,
  title,
  collapsed = false,
}: SidebarItemProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      title={collapsed ? title : undefined}
      className={cn(
        "group flex min-h-11 w-full items-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring/30",
        collapsed ? "justify-center px-0" : "gap-3 px-3",
        isActive
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {icon ? (
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center transition-colors",
            iconClassName
              ? iconClassName
              : isActive
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground",
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
