import { AdminPageHeader } from "@/app/feature/admin/_components/admin-page-header";
import { PaletteWorkspace } from "@/app/feature/admin/_components/palette/palette-workspace";

export const metadata = { title: "Color palette - Admin - Navio" };

export default function ColorPalettePage() {
  return (
    <AdminPageHeader title="Color palette" description="Choose the colors travelers can give their days, lists and guide categories.">
      <PaletteWorkspace />
    </AdminPageHeader>
  );
}
