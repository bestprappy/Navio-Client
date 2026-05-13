import type { Metadata } from "next";

import { CommunityCreatePage } from "@/app/feature/community/_components/community-create-page";

export const metadata: Metadata = {
  title: "Create - Navio Community",
  description: "Start a discussion or create a new community group.",
};

export default function CommunityCreateRoute() {
  return <CommunityCreatePage />;
}
