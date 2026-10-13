import type { Metadata } from "next";

import { GuidesDashboard } from "@/app/feature/admin/_components/guides/dashboard/guides-dashboard";

export const metadata: Metadata = { title: "Guides - Admin - Navio" };

export default function GuidesPage() {
  return <GuidesDashboard />;
}
