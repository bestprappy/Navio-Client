"use client";

export default function PlanViewError() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-3 px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-foreground">
        Something went wrong
      </h1>
      <p className="text-sm text-muted-foreground">
        Please refresh the page or try a different plan.
      </p>
    </section>
  );
}
