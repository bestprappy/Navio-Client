import type { Metadata } from "next";

import { AdminPageHeader } from "../../feature/admin/_components/admin-page-header";
import { ReportsWorkspace } from "../../feature/admin/_components/reports/reports-workspace";

export const metadata: Metadata = { title: "Reports - Navio" };

export default function ReportsPage() {
  return (
    <AdminPageHeader title="Reports" description="Review profiles, posts and comments that travellers reported.">
      <ReportsWorkspace />
    </AdminPageHeader>
  );
}
