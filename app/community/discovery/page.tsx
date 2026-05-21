import type { Metadata } from "next";

import { CommunityDiscoveryPage } from "@/app/feature/community/discovery/community-discovery-page";

export const metadata: Metadata = {
  title: "Discover Communities - Navio",
  description:
    "Explore and join travel planning groups across Navio Community.",
};

export default function CommunityDiscoveryRoute() {
  return <CommunityDiscoveryPage />;
}
