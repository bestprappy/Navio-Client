"use client";

import { useMutation } from "@tanstack/react-query";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Bell, LogIn, LogOut, Settings } from "lucide-react";

import { useUnreadCount } from "@/hooks/use-social";

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
  const logout = useMutation({
    mutationFn: () => signOut({ redirectTo: "/" }),
    onError: (error) => console.error("SidebarAccountActions: sign out failed", error),
  });
  const actionClassName = cn(
    "flex min-h-11 w-full items-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring disabled:opacity-50",
    collapsed ? "justify-center px-0" : "gap-3 px-3",
  );

  return (
    <nav aria-label="Account" className="mt-3 flex shrink-0 flex-col gap-1 border-t border-border/50 pt-3">
      {status === "authenticated" ? (
        <SidebarItem title={unread > 0 ? `Notifications (${unread > 99 ? "99+" : unread} unread)` : "Notifications"} href="/notifications"
          icon={<Bell className="size-5" />} isActive={pathName === "/notifications"} collapsed={collapsed} onClick={onNavigate} />
      ) : null}
      <SidebarItem title="Settings" href="/settings/profile" icon={<Settings className="size-5" />}
        isActive={pathName === "/settings" || pathName.startsWith("/settings/")}
        collapsed={collapsed} onClick={onNavigate} />
      <SidebarAppearance collapsed={collapsed} className={actionClassName} />
      {status === "authenticated" ? (
        <button type="button" className={cn(actionClassName, "text-destructive hover:text-destructive")}
          aria-label={logout.isPending ? "Logging out" : "Log out"} title={collapsed ? "Log out" : undefined}
          disabled={logout.isPending} onClick={() => logout.mutate()}>
          <LogOut className="size-5 shrink-0" aria-hidden="true" />
          {!collapsed && (logout.isPending ? "Logging out…" : "Log out")}
        </button>
      ) : status === "unauthenticated" ? (
        <SidebarItem title="Sign in" href="/sign-in" icon={<LogIn className="size-5" />} collapsed={collapsed} onClick={onNavigate} />
      ) : null}
      {logout.isError && <p role="alert" className="px-2 text-xs text-destructive">Could not log out. Please try again.</p>}
    </nav>
  );
}
