import type { ReactNode } from "react";
import { readAuth } from "@/auth";
import { isAdministrator } from "@/lib/navio-roles";

export default async function CatalogLayout({ children }: { children: ReactNode }) {
  const session = await readAuth();
  if (!isAdministrator(session?.user?.roles)) return <div className="p-8"><h1 className="text-xl font-semibold">Vehicle catalog access</h1><p className="mt-2 text-muted-foreground">Only administrators can manage global vehicles.</p></div>;
  return children;
}
