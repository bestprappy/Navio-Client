"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import type { TripResponse } from "@/app/feature/planner/_components/planner-api";

export function CopySharedPlanButton({ token, hasUnlocatedStops = false }: { token: string; hasUnlocatedStops?: boolean }) {
  const router = useRouter();
  const { requireAuth, isAuthenticationLoading } = useRequireAuth();
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyPlan() {
    setIsCopying(true);
    setError(null);
    try {
      const response = await fetch(`/api/shared-plans/${encodeURIComponent(token)}/copies`, {
        method: "POST",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!response.ok) {
        const body: unknown = await response.json().catch(() => null);
        const detail = body && typeof body === "object" && "message" in body && typeof body.message === "string"
          ? body.message : null;
        throw new Error(detail ?? "This plan could not be copied. Try again.");
      }
      const trip = await response.json() as TripResponse;
      if (!trip.id || !trip.destinationId) throw new Error("The copied trip was incomplete. Open your trips and try again.");
      const params = new URLSearchParams({
        destinationId: trip.destinationId,
        destinationName: trip.destinationName,
        country: trip.destinationCountry ?? "",
        from: trip.startDate,
        to: trip.endDate,
      });
      if (trip.destinationLat !== null) params.set("lat", String(trip.destinationLat));
      if (trip.destinationLng !== null) params.set("lng", String(trip.destinationLng));
      router.push(`/planner/${trip.id}?${params.toString()}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This plan could not be copied. Try again.");
      setIsCopying(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" size="lg" disabled={isCopying || isAuthenticationLoading} onClick={() => requireAuth(() => void copyPlan())}>
        {isCopying ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        {isCopying ? "Copying plan…" : "Copy this plan"}
      </Button>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {hasUnlocatedStops && <p className="max-w-sm text-xs leading-5 text-muted-foreground">Stops without shared map locations become editable notes in your copy.</p>}
    </div>
  );
}
