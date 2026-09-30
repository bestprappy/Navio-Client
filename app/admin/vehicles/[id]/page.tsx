import { AdminPageHeader } from "@/app/feature/admin/_components/admin-page-header";
import { CatalogEditor } from "@/app/feature/admin/_components/catalog/catalog-editor";
export const metadata = { title: "Edit vehicle - Admin - Navio" };
export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminPageHeader title="Edit vehicle" description="Keep the shared specifications accurate. Existing saved vehicles retain their specifications."><CatalogEditor id={id} /></AdminPageHeader>;
}
