"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Bell, LogIn, Settings } from "lucide-react";

import { NotificationCountBadge, notificationsLabel } from "@/components/notifications/notification-count-badge";
import { useUnreadCount } from "@/hooks/use-social";

import { TourHelpButton } from "@/components/tour/tour-help-button";
import { cn } from "@/lib/utils";
import { SidebarAppearance } from "./sidebar-appearance";
import SidebarItem from "./sidebar.item";

type SidebarAccountActionsProps = {
  collapsed: boolean;
  onNavigate: () => void;
};

export function SidebarAccountActions({ collapsed, onNavigate }: SidebarAccountActionsProps) {
  const pathName = usePathname();
  const { status } = useSession();
  const unread = useUnreadCount().data?.unreadCount ?? 0;
  const actionClassName = cn(
    "flex min-h-11 w-full items-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50",
    collapsed ? "justify-center px-0" : "gap-3 px-3",
  );

  return (
    <nav aria-label="Account" className="mt-3 flex shrink-0 flex-col gap-1 border-t border-border/50 pt-3">
      {status === "authenticated" ? (
        <SidebarItem variant="action" title="Notifications" accessibleLabel={notificationsLabel(unread)} href="/notifications"
          badge={unread > 0 ? <NotificationCountBadge count={unread} size={collapsed ? "sm" : "default"} /> : undefined}
          icon={<Bell className="size-5" />} isActive={pathName === "/notifications"} collapsed={collapsed} onClick={onNavigate}
          tourTarget="sidebar.notifications" />
      ) : null}
      <TourHelpButton collapsed={collapsed} onStart={onNavigate} />
      <SidebarItem variant="action" title="Settings" href="/settings/profile" icon={<Settings className="size-5" />}
        isActive={pathName === "/settings" || pathName.startsWith("/settings/")}
        collapsed={collapsed} onClick={onNavigate} />
      <SidebarAppearance collapsed={collapsed} className={actionClassName} />
      {status === "unauthenticated" && <SidebarItem variant="action" title="Sign in" href="/sign-in" icon={<LogIn className="size-5" />} collapsed={collapsed} onClick={onNavigate} />}
    </nav>
  );
}
