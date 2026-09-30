import type { ReactNode } from "react";
import { readAuth } from "@/auth";
import { isAdministrator } from "@/lib/navio-roles";
export default async function ActivityLayout({ children }: { children: ReactNode }) {
  const session = await readAuth();
  if (!isAdministrator(session?.user?.roles)) return <div className="p-8"><h1 className="text-xl font-semibold">Activity access</h1><p className="mt-2 text-muted-foreground">Only administrators can review global activity.</p></div>;
  return children;
}
