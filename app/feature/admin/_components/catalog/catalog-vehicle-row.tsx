"use client";

import Link from "next/link";
import { memo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Archive, BatteryCharging, Gauge, MoreHorizontal, Pencil, Send, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatAdminRelative } from "../admin-format";
import type { CatalogEntry } from "./catalog-api";
import { CatalogVehicleThumb } from "./catalog-vehicle-thumb";
import { STATUS_TONES } from "./catalog-status";

export type CatalogTransition = { entry: CatalogEntry; action: "publish" | "archive" };

/** Shared by the header row and each vehicle row so columns always line up. */
export const CATALOG_ROW_GRID = "lg:grid lg:grid-cols-[minmax(0,2.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)_8.5rem_2rem] lg:items-center lg:gap-6";

const BASIS_LABELS: Record<CatalogEntry["specification"]["batteryCapacityBasis"], string> = {
  MANUFACTURER_DECLARED: "Declared", USABLE: "Usable", GROSS: "Gross", UNKNOWN: "Basis unknown",
};

const formatNumber = (value: number) => new Intl.NumberFormat("en", { maximumFractionDigits: 2 }).format(value);

/** Missing specifications are flagged so an admin can see what to fill in. */
function NotSet() {
  return <span className="font-medium text-warning">Not set</span>;
}

function Spec({ label, icon, value, detail }: { label: string; icon: ReactNode; value: ReactNode; detail: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground lg:sr-only">{icon}{label}</dt>
      <dd className="truncate text-sm font-semibold tabular-nums text-foreground">{value}</dd>
      <dd className="truncate text-xs text-muted-foreground">{detail}</dd>
    </div>
  );
}

type CatalogVehicleRowProps = {
  entry: CatalogEntry;
  onTransition: (transition: CatalogTransition) => void;
};

export const CatalogVehicleRow = memo(function CatalogVehicleRow({ entry, onTransition }: CatalogVehicleRowProps) {
  const router = useRouter();
  const spec = entry.specification;
  const name = `${spec.make} ${spec.model}`;
  const href = `/admin/vehicles/${entry.id}`;
  const tone = STATUS_TONES[entry.status];
  const charging = [spec.maxDcKw !== null && `DC ${formatNumber(spec.maxDcKw)} kW`, spec.maxAcKw !== null && `AC ${formatNumber(spec.maxAcKw)} kW`].filter(Boolean).join(" / ");

  return (
    <li className={cn("group relative flex flex-col gap-4 px-4 py-4 transition-colors hover:bg-muted/40 sm:px-5", CATALOG_ROW_GRID, "lg:py-3")}>
      <div className="flex min-w-0 items-center gap-3">
        <CatalogVehicleThumb imageUrl={spec.imageUrl} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <Link href={href} className="truncate font-semibold text-foreground outline-none underline-offset-4 hover:underline focus-visible:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:rounded-sm">
            {name}
          </Link>
          <p className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{[spec.trim, spec.year].filter(Boolean).join(" ") || "No trim or year"}</span>
            <span className="rounded-sm bg-muted px-1.5 py-px font-medium text-foreground/80" title="Market">{spec.market}</span>
          </p>
        </div>
        {/* On small screens status and actions sit beside the name. */}
        <div className="flex items-center gap-1 lg:hidden">
          <StatusBadge status={entry.status} />
          <RowActions entry={entry} name={name} onEdit={() => router.push(href)} onTransition={onTransition} />
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-3 rounded-lg bg-muted/40 p-3 lg:contents">
          <Spec label="Battery" icon={<BatteryCharging className="size-3.5 text-primary" aria-hidden="true" />}
            value={spec.batteryCapacityKwh === null ? <NotSet /> : `${formatNumber(spec.batteryCapacityKwh)} kWh`}
            detail={BASIS_LABELS[spec.batteryCapacityBasis]} />
          <Spec label="Range" icon={<Gauge className="size-3.5 text-primary" aria-hidden="true" />}
            value={spec.rangeKm === null ? <NotSet /> : `${formatNumber(spec.rangeKm)} km`}
            detail={spec.rangeStandard ?? "No test standard"} />
          <Spec label="Charging" icon={<Zap className="size-3.5 text-primary" aria-hidden="true" />}
            value={charging || <NotSet />}
            detail={spec.connectorTypes.length ? spec.connectorTypes.join(", ") : "No connectors"} />
      </dl>

      <div className="hidden min-w-0 flex-col items-start gap-1 lg:flex">
        <StatusBadge status={entry.status} />
        <span className="truncate text-xs text-muted-foreground" title={entry.updatedAt}>Updated {formatAdminRelative(entry.updatedAt)}</span>
      </div>
      <div className="hidden lg:flex lg:justify-end">
        <RowActions entry={entry} name={name} onEdit={() => router.push(href)} onTransition={onTransition} />
      </div>
      <span aria-hidden="true" className={cn("absolute inset-y-3 left-0 w-0.75 rounded-r-full opacity-0 transition-opacity group-hover:opacity-100", tone.bar)} />
    </li>
  );
});

function StatusBadge({ status }: { status: CatalogEntry["status"] }) {
  const tone = STATUS_TONES[status];
  return (
    <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium ring-1 ring-inset", tone.badge)}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", tone.dot)} />
      {tone.label}
    </span>
  );
}

type RowActionsProps = {
  entry: CatalogEntry;
  name: string;
  onEdit: () => void;
  onTransition: (transition: CatalogTransition) => void;
};

function RowActions({ entry, name, onEdit, onTransition }: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${name}`} />}>
        <MoreHorizontal aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onEdit}><Pencil aria-hidden="true" />Edit vehicle</DropdownMenuItem>
        {entry.status !== "PUBLISHED" && <DropdownMenuItem onClick={() => onTransition({ entry, action: "publish" })}>
          <Send aria-hidden="true" />{entry.status === "ARCHIVED" ? "Republish" : "Publish"}
        </DropdownMenuItem>}
        {entry.status !== "ARCHIVED" && <>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => onTransition({ entry, action: "archive" })}><Archive aria-hidden="true" />Archive</DropdownMenuItem>
        </>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
