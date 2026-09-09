import type { ReactNode } from "react";

import SidebarWrapper from "@/components/sidebar/sidebar";

type PlannerDetailLayoutProps = {
  children: ReactNode;
};

export default function PlannerDetailLayout({
  children,
}: PlannerDetailLayoutProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden md:flex-row">
      <SidebarWrapper />
      <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
