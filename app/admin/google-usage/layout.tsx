import type { ReactNode } from "react";

import { readAuth } from "@/auth";
import { isAdministrator } from "@/lib/navio-roles";

/** Usage and billing links are for administrators, not moderators. */
export default async function GoogleUsageLayout({ children }: { children: ReactNode }) {
  const session = await readAuth();
  if (!isAdministrator(session?.user?.roles)) {
    return (
      <div className="p-8">
        <h1 className="text-xl font-semibold">Google usage access</h1>
        <p className="mt-2 text-muted-foreground">Only administrators can view Google usage.</p>
      </div>
    );
  }
  return children;
}
