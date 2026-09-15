import { cn } from "@/lib/utils";

function getTagColor(label: string): string {
  if (/trip/i.test(label)) return "bg-info/10 text-info dark:bg-info/15";
  if (/nature|forest|mountain|hiking/i.test(label)) {
    return "bg-success/10 text-[color-mix(in_oklch,var(--success),var(--foreground)_25%)] dark:bg-success/15";
  }
  if (/food|restaurant|cafe/i.test(label)) return "bg-warning/10 text-warning dark:bg-warning/15";
  if (/peaceful|chilling/i.test(label)) return "bg-accent/10 text-accent dark:bg-accent/15";
  return "bg-primary/10 text-primary dark:bg-primary/15";
}

/** Consistent pastel colors by tag category across plan previews. */
export function PlanTag({ label }: { label: string }) {
  return (
    <span className={cn("rounded-full px-2 py-1 text-xs", getTagColor(label))}>
      {label}
    </span>
  );
}
