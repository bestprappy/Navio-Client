import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PlaceCardFrame({
  children,
  className,
  style,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  return <article className={cn("surface-card min-w-0 overflow-hidden rounded-xl border border-border bg-card dark:border-border/70", className)} style={style} onClick={onClick}>{children}</article>;
}
