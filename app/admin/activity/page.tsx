import type { Metadata } from "next";
import { AdminPageHeader } from "../../feature/admin/_components/admin-page-header";
import { ActivityWorkspace } from "../../feature/admin/_components/activity/activity-workspace";

export const metadata: Metadata = { title: "Activity - Navio" };

export default function ActivityPage() {
  return <AdminPageHeader title="Activity" description="Review account and catalog events across Navio."><ActivityWorkspace /></AdminPageHeader>;
}
