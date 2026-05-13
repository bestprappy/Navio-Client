import type { ReactNode } from "react";

import { CommunityNavbar } from "@/app/feature/community/_components/community-navbar";
import { CommunitySidebar } from "@/app/feature/community/_components/community-sidebar";

type CommunityLayoutProps = {
  children: ReactNode;
};

export default function CommunityLayout({ children }: CommunityLayoutProps) {
  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <CommunityNavbar />
      <div className="flex flex-1 overflow-hidden">
        <CommunitySidebar />
        <main className="min-w-0 flex-1 overflow-y-auto" id="community-content">
          {children}
        </main>
      </div>
    </div>
  );
}
