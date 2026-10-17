import type { ReactNode } from "react";

import { readAuth } from "@/auth";
import { isAdministrator } from "@/lib/navio-roles";

/** The palette is shared by every user, so only administrators change it. */
export default async function ColorsLayout({ children }: { children: ReactNode }) {
  const session = await readAuth();
  if (!isAdministrator(session?.user?.roles)) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Color palette access</h1>
        <p className="mt-2 text-muted-foreground">Only administrators can change the color palette.</p>
      </div>
    );
  }
  return children;
}
