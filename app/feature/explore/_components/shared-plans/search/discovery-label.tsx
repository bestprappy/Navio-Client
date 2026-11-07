import { Clock3, Sparkles, TrendingUp } from 'lucide-react';

const labels = {
  trending: { text: 'Trending now', icon: TrendingUp },
  popular: { text: 'Popular pick', icon: Sparkles },
  recent: { text: 'Recently shared', icon: Clock3 },
} as const;

export type DiscoveryLabelKind = keyof typeof labels;

/** Only display evidence supplied by the backend; old responses remain compatible. */
export function DiscoveryLabel({ kind }: { kind?: DiscoveryLabelKind }) {
  if (!kind) return null;
  const { text, icon: Icon } = labels[kind];
  return <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
    <Icon aria-hidden="true" className="size-3.5 shrink-0" />{text}
  </span>;
}
