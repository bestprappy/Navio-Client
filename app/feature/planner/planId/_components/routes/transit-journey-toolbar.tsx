"use client";

import { ArrowUpDown, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TRANSIT_JOURNEY_SORTS, type TransitJourneySort, type TransitVehicleKind } from "./transit-journey-filters";
import { TRANSIT_VEHICLE_ICON } from "./transit-vehicle-icon";
import styles from "./transit-journey-toolbar.module.css";

export function TransitJourneyToolbar({ kinds, totalCount, visibleCount, activeKind, onKindChange, sort, onSortChange, fareSortable }: {
  kinds: { kind: TransitVehicleKind; count: number }[]; totalCount: number; visibleCount: number;
  activeKind: TransitVehicleKind | null; onKindChange: (kind: TransitVehicleKind | null) => void;
  sort: TransitJourneySort; onSortChange: (sort: TransitJourneySort) => void; fareSortable: boolean;
}) {
  const sorts = fareSortable ? TRANSIT_JOURNEY_SORTS : TRANSIT_JOURNEY_SORTS.filter(item => item.value !== "lowest-fare");
  // A single vehicle type would only repeat "All", so filters appear once there is a real choice.
  const showKinds = kinds.length > 1;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      {showKinds ? <div role="group" aria-label="Filter routes by vehicle" className="flex min-w-0 flex-wrap gap-2">
        <KindChip label="All" count={totalCount} active={activeKind == null} onClick={() => onKindChange(null)} />
        {kinds.map(({ kind, count }) => <KindChip key={kind} label={kind} count={count} Icon={TRANSIT_VEHICLE_ICON[kind]}
          active={activeKind === kind} onClick={() => onKindChange(activeKind === kind ? null : kind)} />)}
      </div> : <span />}
      {totalCount > 1 ? <Select items={sorts} value={sort} onValueChange={value => { if (value) onSortChange(value); }}>
        <SelectTrigger size="sm" aria-label="Sort routes" className="ml-auto gap-1.5 text-xs">
          <ArrowUpDown className="size-3.5 text-muted-foreground" aria-hidden="true" /><SelectValue />
        </SelectTrigger>
        <SelectContent align="end" alignItemWithTrigger={false}>
          {sorts.map(item => <SelectItem key={item.value} value={item.value} className="text-xs">{item.label}</SelectItem>)}
        </SelectContent>
      </Select> : null}
      <p role="status" className="sr-only">{`Showing ${visibleCount} of ${totalCount} routes`}</p>
    </div>
  );
}

function KindChip({ label, count, active, onClick, Icon }: {
  label: "All" | TransitVehicleKind; count: number; active: boolean; onClick: () => void; Icon?: LucideIcon;
}) {
  return (
    <Button type="button" variant="outline" size="sm" data-vehicle-kind={label} aria-pressed={active} aria-label={`${label}, ${count} ${count === 1 ? "route" : "routes"}`} onClick={onClick}
      className={cn(styles.chip, "h-8 gap-1.5 rounded-full pl-3 pr-1.5 text-xs transition-colors motion-reduce:transition-none")}>
      {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}{label}
      <span className={cn(styles.count, "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-semibold tabular-nums")}>{count}</span>
    </Button>
  );
}
