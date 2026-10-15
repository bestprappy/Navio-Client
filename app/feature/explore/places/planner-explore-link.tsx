"use client";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { flushPlannerAutosave } from "../../planner/_components/planner-autosave-flush";
import { placesEnabled } from "./places-config";

export function PlannerExploreLink({ destination }: { destination: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function open() {
    const planId = /^\/planner\/([^/]+)$/.exec(pathname)?.[1];
    if (!planId) return;
    setPending(true); setError(null);
    try {
      await flushPlannerAutosave(planId);
      router.push(`/explore?${new URLSearchParams({ tab: placesEnabled ? "places" : "plans", plan: planId, destination })}`);
    } catch { setError("Save your plan before exploring. Please retry."); setPending(false); }
  }
  return <div className="max-w-60"><button type="button" disabled={pending} onClick={() => void open()} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3.5 text-sm font-medium shadow-sm hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">{pending ? "Saving…" : "Explore all"}<ArrowUpRight className="size-3.5 text-primary" aria-hidden="true" /></button>{error && <p role="alert" className="mt-2 text-xs text-destructive">{error}</p>}</div>;
}
