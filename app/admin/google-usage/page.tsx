import { AdminPageHeader } from "@/app/feature/admin/_components/admin-page-header";
import { GoogleUsageWorkspace } from "@/app/feature/admin/_components/google-usage/google-usage-workspace";

export const metadata = { title: "Google usage - Admin - Navio" };

export default function GoogleUsagePage() {
  return (
    <AdminPageHeader title="Google usage" description="How much of this month's free Google allowance Navio has used.">
      <GoogleUsageWorkspace />
    </AdminPageHeader>
  );
}
