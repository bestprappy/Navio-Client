type PlannerSetupFieldGroupProps = {
  label: string;
  placeholder?: string;
  hint?: string;
  type?: "text" | "date-range";
  startPlaceholder?: string;
  endPlaceholder?: string;
};

export function PlannerSetupFieldGroup({
  label,
  placeholder,
  hint,
  type = "text",
  startPlaceholder,
  endPlaceholder,
}: PlannerSetupFieldGroupProps) {
  if (type === "date-range") {
    return (
      <section className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
          <div className="flex items-center gap-3">
            <input
              type="date"
              aria-label={startPlaceholder ?? "Start date"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <div className="flex items-center gap-3">
            <input
              type="date"
              aria-label={endPlaceholder ?? "End date"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
      <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <div className="mt-3">
        <input
          type="text"
          placeholder={placeholder}
          aria-label={hint ?? label}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
    </section>
  );
}
