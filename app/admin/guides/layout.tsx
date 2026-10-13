import type { ReactNode } from "react";

import { readAuth } from "@/auth";
import { isAdministrator } from "@/lib/navio-roles";

/** Guides are curated by administrators; moderators reach the console but not this section. */
export default async function GuidesLayout({ children }: { children: ReactNode }) {
  const session = await readAuth();
  if (!isAdministrator(session?.user?.roles)) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Guides access</h1>
        <p className="mt-2 text-muted-foreground">Only administrators can write destination guides.</p>
      </div>
    );
  }
  return children;
}
