import type { ReactNode } from "react";

import SidebarWrapper from "@/components/sidebar/sidebar";
import { PlannerSessionBoundary } from "@/app/feature/planner/_components/planner-session-boundary";

type PlannerDetailLayoutProps = {
  children: ReactNode;
};

export default function PlannerDetailLayout({
  children,
}: PlannerDetailLayoutProps) {
  return (
    <PlannerSessionBoundary><div className="flex h-dvh flex-col overflow-hidden md:flex-row">
      <SidebarWrapper />
      <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
    </div></PlannerSessionBoundary>
  );
}
