import type { ReactNode } from "react";

import SidebarWrapper from "@/components/sidebar/sidebar";
import { GuestWelcomePrompt } from "@/app/feature/planner/_components/guest-welcome-prompt";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden md:flex-row">
      <GuestWelcomePrompt />
      <SidebarWrapper />
      <main className="min-h-0 min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
