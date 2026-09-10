import type { Metadata } from "next";
import { CommunityDiscoveryPage } from "@/app/feature/community/discovery/community-discovery-page";

export const metadata: Metadata = {
  title: "Popular Communities - Navio",
  description: "Find active travel planning communities on Navio.",
};

export default function CommunityPopularRoute() {
  return <CommunityDiscoveryPage variant="popular" />;
}
