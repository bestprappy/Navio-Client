import { Suspense } from "react";
import { AdminPageHeader } from "@/app/feature/admin/_components/admin-page-header";
import { CatalogWorkspace } from "@/app/feature/admin/_components/catalog/catalog-workspace";
export const metadata = { title: "Vehicle catalog - Admin - Navio" };
export default function VehicleCatalogPage() {
  return <AdminPageHeader title="Vehicle catalog" description="Maintain the EV specifications available to every Navio driver."><Suspense fallback={<p role="status">Loading catalog…</p>}><CatalogWorkspace /></Suspense></AdminPageHeader>;
}
