"use client";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button.variants";

export function GuestPlanNotice() {
  const { requireAuth, isAuthenticated } = useRequireAuth();
  return (
    <aside className="m-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-sm">
      <div>
        <p className="font-semibold">Guest plan · Not saved</p>
        <p className="text-muted-foreground">Refreshing or leaving the planner clears this trip.</p>
      </div>
      {isAuthenticated
        ? <Link className={buttonVariants({ variant: "outline", size: "sm" })} href="/planner/new">Start a saved plan</Link>
        : <Button variant="outline" size="sm" onClick={() => requireAuth(() => undefined)}>Sign in to save plans</Button>}
    </aside>
  );
}
