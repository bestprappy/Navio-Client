import { AdminPageHeader } from "@/app/feature/admin/_components/admin-page-header";
import { CatalogEditor } from "@/app/feature/admin/_components/catalog/catalog-editor";
export const metadata = { title: "Add vehicle - Admin - Navio" };
export default function NewVehiclePage() {
  return <AdminPageHeader title="Add vehicle" description="Save a draft, check its specifications, then publish it to the shared catalog."><CatalogEditor id={null} /></AdminPageHeader>;
}
