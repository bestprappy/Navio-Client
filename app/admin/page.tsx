import type { Metadata } from "next";

import { AdminPageHeader } from "../feature/admin/_components/admin-page-header";
import { AdminDashboard } from "../feature/admin/_components/admin-dashboard";

export const metadata: Metadata = {
  title: "Admin - Navio",
};

export default function AdminPage() {
  return (
    <AdminPageHeader title="Admin overview" description="Manage Navio accounts and review access.">
      <AdminDashboard />
    </AdminPageHeader>
  );
}
