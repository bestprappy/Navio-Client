export default function PlanViewLoading() {
  return (
    <section className="flex min-h-full flex-col pb-12">
      <div className="h-60 w-full bg-muted/50" />
      <div className="-mt-16 space-y-6 px-4 sm:px-6">
        <div className="h-56 rounded-sm border border-border bg-card shadow-xs" />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="h-10 rounded-sm bg-muted/40" />
          <div className="h-10 rounded-sm bg-muted/40" />
          <div className="h-10 rounded-sm bg-muted/40" />
        </div>
        <div className="h-80 rounded-sm border border-border bg-card shadow-xs" />
      </div>
    </section>
  );
}
