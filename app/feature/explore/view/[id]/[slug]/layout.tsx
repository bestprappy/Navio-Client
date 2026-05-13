import type { ReactNode } from "react";

import { PostMap } from "./_components/post-map";
import { PostNavbar } from "./_components/post-navbar";

type ExploreDetailLayoutProps = {
  children: ReactNode;
};

export default function ExploreDetailLayout({
  children,
}: ExploreDetailLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-background lg:flex-row">
      <aside className="flex w-full min-h-0 flex-col border-r border-border bg-card/70 lg:w-1/2">
        <PostNavbar />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </aside>
      <section className="relative flex h-full w-full bg-muted/20 lg:w-1/2">
        <PostMap />
      </section>
    </div>
  );
}
