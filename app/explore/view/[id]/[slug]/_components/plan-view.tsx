import type { Plan } from "../../../../_components/data";
import { formatCount } from "../../../../_components/data";

type PlanViewProps = {
  plan?: Plan;
};

export function PlanView({ plan }: PlanViewProps) {
  if (!plan) {
    return (
      <section className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-14 text-center">
        <h1 className="text-2xl font-semibold text-foreground">
          Plan not found
        </h1>
        <p className="text-sm text-muted-foreground">
          This plan is not available yet. Try another one from Explore.
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 pb-16 pt-10">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        <div
          className="h-64 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${plan.imageUrl})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-6 left-6 space-y-2">
          <h1 className="text-3xl font-bold text-white">{plan.title}</h1>
          <p className="max-w-2xl text-sm text-white/80">{plan.description}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <article className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Plan highlights
          </h2>
          <p className="text-sm text-muted-foreground">
            This is a placeholder view until backend data is connected. Use this
            space to outline the route, EV stops, and daily focus areas.
          </p>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li>Morning drives with EV-friendly charging windows.</li>
            <li>Scenic coastal stretches and cafe stops.</li>
            <li>Stay options close to charging hubs.</li>
          </ul>
        </article>
        <aside className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">Plan stats</h3>
          <div className="mt-4 space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Likes</span>
              <span className="font-semibold text-foreground">
                {formatCount(plan.likes)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Views</span>
              <span className="font-semibold text-foreground">
                {formatCount(plan.views)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <span className="font-semibold text-primary">
                {plan.isTrending ? "Trending" : "Recent"}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
