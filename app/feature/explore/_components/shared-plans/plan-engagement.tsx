import { Copy, Eye, Star, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type PlanEngagementValues = {
  viewCount?: number | null;
  copyCount?: number | null;
  uniqueCopierCount?: number | null;
};
function count(value: number | null | undefined): string {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value) : "\u2014";
}
export function PlanEngagement({ viewCount, copyCount, uniqueCopierCount, detail = false }: PlanEngagementValues & { detail?: boolean }) {
  return (
    <div aria-label="Plan activity" className={cn("grid items-center gap-x-3 gap-y-2 text-xs text-muted-foreground", detail ? "grid-cols-2" : "grid-cols-3")}>
      <span className="inline-flex min-w-0 items-center gap-1.5" title={viewCount == null ? "Views unavailable" : `${viewCount.toLocaleString("en")} public views`}>
        <Eye className="size-3.5 shrink-0" aria-hidden="true" />{count(viewCount)} views
      </span>
      <span className="inline-flex min-w-0 items-center gap-1.5" title="This plan has not been rated">
        <Star className="size-3.5 shrink-0" aria-hidden="true" /><span>Not rated yet</span>
      </span>
      <span className="inline-flex min-w-0 items-center gap-1.5" title={copyCount == null ? "Copy count unavailable" : `${copyCount.toLocaleString("en")} successful plan copies recorded`}>
        <Copy className="size-3.5 shrink-0" aria-hidden="true" />{count(copyCount)} {copyCount === 1 ? "copy" : "copies"}
      </span>
      {detail && <span className="inline-flex min-w-0 items-center gap-1.5" title="Distinct travelers who successfully copied this plan">
        <Users className="size-3.5 shrink-0" aria-hidden="true" />{count(uniqueCopierCount)} {uniqueCopierCount === 1 ? "traveler" : "travelers"}
      </span>}
    </div>
  );
}
