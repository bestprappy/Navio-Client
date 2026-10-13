import type { Metadata } from "next";

import { CommunityPage } from "@/app/feature/community/community-page";

export const metadata: Metadata = {
  title: "Popular - Navio Community",
  description: "The most upvoted travel discussions across Navio communities.",
};

export default function CommunityPopularRoute() {
  return <CommunityPage variant="popular" />;
}
