import type { ReactNode } from "react";

import { CommunityNavbar } from "@/app/feature/community/_components/community-navbar";
import { CommunitySidebar } from "@/app/feature/community/community-sidebar";
import { CommunityErrorBoundary } from "@/app/feature/community/_components/community-error-boundary";

type CommunityLayoutProps = {
  children: ReactNode;
};

export default function CommunityLayout({ children }: CommunityLayoutProps) {
  return (
    <CommunityErrorBoundary>
      <div className="fixed inset-0 flex min-h-0 flex-col overflow-hidden bg-background">
        <CommunityNavbar />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <CommunitySidebar />
          <main
            className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain"
            id="community-content"
          >
            {children}
          </main>
        </div>
      </div>
    </CommunityErrorBoundary>
  );
}
