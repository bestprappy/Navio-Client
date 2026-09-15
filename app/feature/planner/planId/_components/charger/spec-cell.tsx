import { cn } from "@/lib/utils";

type SpecCellProps = {
  label: string;
  value: string;
  unit?: string;
  /** Numbers read in IBM Plex Mono; words such as plug names stay in the UI face. */
  mono?: boolean;
  className?: string;
};

/** One cell of a ruled, recessed spec grid: place inside `<dl className="surface-well grid gap-px bg-border/60 ...">`. */
export function SpecCell({ label, value, unit, mono = true, className }: SpecCellProps) {
  return (
    <div className={cn("min-w-0 bg-well px-3 py-2", className)}>
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold wrap-break-word text-foreground">
        <span className={cn(mono && "font-mono tabular-nums")}>{value}</span>
        {unit && <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>}
      </dd>
    </div>
  );
}
