import type { Metadata } from "next";

import { CommunityPage } from "@/app/feature/community/community-page";

export const metadata: Metadata = {
  title: "Community - Navio",
  description:
    "Discuss trip plans and join travel communities on Navio.",
};

export default function CommunityRoute() {
  return <CommunityPage />;
}
