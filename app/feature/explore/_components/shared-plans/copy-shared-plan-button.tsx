"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";

import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import type { TripResponse } from "@/app/feature/planner/_components/planner-api";

export function CopySharedPlanButton({ token, hasUnlocatedStops = false,startDate }: { token: string; hasUnlocatedStops?: boolean;startDate?:string }) {
  const router = useRouter();
  const { requireAuth, isAuthenticationLoading } = useRequireAuth();
  const [open,setOpen]=useState(false);
  const [dateMode,setDateMode]=useState<"retain"|"change">(startDate?"retain":"change");
  const [newDate,setNewDate]=useState("");
  const [isCopying, setIsCopying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyPlan() {
    setIsCopying(true);
    setError(null);
    try {
      const response = await fetch(`/api/shared-plans/${encodeURIComponent(token)}/copies`, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type":"application/json" },
        body:JSON.stringify({dateMode,startDate:dateMode==="change"?newDate:undefined}),
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
      <Button type="button" size="lg" disabled={isCopying || isAuthenticationLoading} onClick={() => requireAuth(() => {setDateMode(startDate?"retain":"change");setError(null);setOpen(true);})}>
        {isCopying ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
        {isCopying ? "Copying plan…" : "Copy this plan"}
      </Button>
      <Dialog open={open} onOpenChange={value=>{if(!isCopying)setOpen(value);}}><DialogContent className="max-w-md"><form onSubmit={event=>{event.preventDefault();void copyPlan();}}><DialogHeader><DialogTitle>Make this trip your own</DialogTitle><DialogDescription>Keep the published dates or choose a new start. You can edit the copied trip afterward.</DialogDescription></DialogHeader><fieldset className="my-5 space-y-3"><legend className="mb-3 text-sm font-medium">Trip dates</legend>{startDate&&<label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border p-3 text-sm"><input type="radio" name="copy-dates" value="retain" checked={dateMode==="retain"} onChange={()=>setDateMode("retain")} className="mt-1 accent-primary" /><span>Retain published dates<span className="mt-1 block text-xs text-muted-foreground">Starting {startDate}</span></span></label>}<label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3 text-sm"><input type="radio" name="copy-dates" value="change" checked={dateMode==="change"} onChange={()=>setDateMode("change")} className="accent-primary" />Choose new dates</label>{dateMode==="change"&&<label className="block text-sm">New start date<input type="date" value={newDate} required onChange={event=>setNewDate(event.target.value)} className="mt-2 block min-h-10 w-full rounded-xl border border-border bg-background px-3" /><span className="mt-2 block text-xs text-muted-foreground">The order and spacing of the shared days stay the same.</span></label>}</fieldset>{error&&<p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}<DialogFooter><Button type="button" variant="outline" disabled={isCopying} onClick={()=>setOpen(false)}>Cancel</Button><Button type="submit" disabled={isCopying||(dateMode==="change"&&!newDate)}>{isCopying?"Copying...":"Copy to my trips"}</Button></DialogFooter></form></DialogContent></Dialog>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {hasUnlocatedStops && <p className="max-w-sm text-xs leading-5 text-muted-foreground">Stops without shared map locations become editable notes in your copy.</p>}
    </div>
  );
}
