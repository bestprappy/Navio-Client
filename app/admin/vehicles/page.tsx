import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button.variants";
import { AdminPageHeader } from "@/app/feature/admin/_components/admin-page-header";
import { AdminLoadingRows } from "@/app/feature/admin/_components/admin-query-state";
import { CatalogWorkspace } from "@/app/feature/admin/_components/catalog/catalog-workspace";
export const metadata = { title: "Vehicle catalog - Admin - Navio" };
export default function VehicleCatalogPage() {
  return <AdminPageHeader title="Vehicle catalog" description="Maintain the EV specifications available to every Navio driver."
    actions={<Link href="/admin/vehicles/new" className={buttonVariants({ className: "h-10 px-4 shadow-sm hover:bg-primary/90" })}><Plus aria-hidden="true" />Add vehicle</Link>}>
    <Suspense fallback={<AdminLoadingRows rows={5} label="Loading catalog" />}><CatalogWorkspace /></Suspense>
  </AdminPageHeader>;
}
