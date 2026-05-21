import type { Metadata } from "next";

import { CommunityPage } from "@/app/feature/community/community-page";

export const metadata: Metadata = {
  title: "Community - Navio",
  description:
    "Discuss trip plans, join travel groups, and copy mock community routes in Navio.",
};

export default function CommunityRoute() {
  return <CommunityPage />;
}
