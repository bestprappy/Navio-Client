import type { ReactNode } from "react";

import SidebarWrapper from "@/components/sidebar/sidebar";

type PlannerDetailLayoutProps = {
  children: ReactNode;
};

export default function PlannerDetailLayout({
  children,
}: PlannerDetailLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <SidebarWrapper />
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
