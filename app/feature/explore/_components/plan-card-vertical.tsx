import Link from "next/link";
import { Eye, Heart } from "lucide-react";

import type { Plan, UserProfile } from "./data";
import { formatCount, getPlanHref } from "./data";
import { UserBadge } from "./user-badge";

type PlanCardVerticalProps = {
  plan: Plan;
  author: UserProfile;
  onShare: (planId: string) => void;
};

export function PlanCardVertical({
  plan,
  author,
  onShare,
}: PlanCardVerticalProps) {
  const href = getPlanHref(plan);

  return (
    <article className="flex min-w-[260px] flex-col gap-3" data-plan-card>
      <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <Link href={href} className="block">
          <div
            className="h-72 w-full bg-cover bg-center transition duration-300 group-hover:scale-[1.02]"
            style={{ backgroundImage: `url(${plan.imageUrl})` }}
            aria-label={plan.title}
          />
        </Link>
        <div className="absolute right-3 top-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onShare(plan.id)}
            className="rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur transition hover:bg-background"
          >
            Share
          </button>
          <button
            type="button"
            aria-label="More options"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-lg text-foreground shadow-sm backdrop-blur transition hover:bg-background"
          >
            ...
          </button>
        </div>
      </div>
      <Link href={href} className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{plan.title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {plan.description}
        </p>
      </Link>
      <div className="flex items-center justify-between">
        <UserBadge user={author} />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {formatCount(plan.likes)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {formatCount(plan.views)}
          </span>
        </div>
      </div>
    </article>
  );
}
