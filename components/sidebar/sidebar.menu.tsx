"use client";

import type { ReactNode } from "react";

type SidebarMenuProps = {
  title: string;
  children: ReactNode;
  collapsed?: boolean;
};

export default function SidebarMenu({
  title,
  children,
  collapsed = false,
}: SidebarMenuProps) {
  return (
    <div className="flex flex-col gap-2">
      {!collapsed && (
        <h3 className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
