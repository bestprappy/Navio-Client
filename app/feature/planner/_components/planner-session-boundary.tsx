"use client";

import { type ReactNode } from "react";
import { Provider } from "jotai";
import { redirect, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { isPersistedTripId } from "./planner-api";

export function PlannerSessionBoundary({ children }: { children: ReactNode }) {
  const { planId } = useParams<{ planId: string }>();
  const { data: session } = useSession();
  const { isAuthenticated, isAuthenticationLoading, requireAuth } = useRequireAuth();
  if (isAuthenticationLoading) return <p role="status" className="p-6 text-muted-foreground">Opening planner…</p>;
  if (!isAuthenticated) {
    return (
      <section className="mx-auto flex max-w-xl flex-col gap-4 p-8">
        <h1 className="text-2xl font-semibold">Sign in to plan your trip</h1>
        <p className="text-muted-foreground">Create an account or sign in to access your saved trips and planning tools.</p>
        <Button onClick={() => requireAuth(() => undefined)}>Sign in</Button>
      </section>
    );
  }
  if (!isPersistedTripId(planId)) redirect("/planner/new");
  // Discard planner state on navigation or account changes. Never expose a
  // previous account's itinerary through shared atoms after sign-out.
  return <Provider key={`${planId}:${session?.user?.id}`}>{children}</Provider>;
}
