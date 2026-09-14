"use client";

import { type ReactNode } from "react";
import { Provider } from "jotai";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { isPersistedTripId } from "./planner-api";

export function PlannerSessionBoundary({ children }: { children: ReactNode }) {
  const { planId } = useParams<{ planId: string }>();
  const { data: session } = useSession();
  const { isAuthenticated, isAuthenticationLoading, requireAuth } = useRequireAuth();
  if (isAuthenticationLoading) return <p role="status" className="p-6 text-muted-foreground">Opening planner…</p>;
  if (!isAuthenticated && isPersistedTripId(planId)) {
    return (
      <section className="mx-auto flex max-w-xl flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold">This is a saved trip</h1>
        <p className="text-muted-foreground">Sign in to access your saved plans, or start a temporary guest plan.</p>
        <Button onClick={() => requireAuth(() => undefined)}>Sign in</Button>
        <Link className={buttonVariants({ variant: "outline" })} href="/planner/new">Start a guest plan</Link>
      </section>
    );
  }
  // Discard in-memory plans on navigation or account changes. Never expose a
  // previous account's itinerary through shared atoms after sign-out.
  return <Provider key={`${planId}:${isAuthenticated ? session?.user?.id : "guest"}`}>{children}</Provider>;
}
