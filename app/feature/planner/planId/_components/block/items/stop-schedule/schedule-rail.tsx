import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

import styles from "./stop-schedule.module.css";

export type RailDot = "moment" | "outside" | "add";

/** The ordered list the rail is drawn along. */
function Timeline({ label, density = "comfortable", children }: {
  label: string;
  density?: "comfortable" | "compact";
  children: ReactNode;
}) {
  return (
    <ol aria-label={label} className={styles.timeline} data-density={density}>
      {children}
    </ol>
  );
}

function Item({ children }: { children: ReactNode }) {
  return <li className={styles.item}>{children}</li>;
}

/** One line on the rail: time, dot, what happens, then an optional action. */
function Row({ time, dot, children, trailing }: {
  time?: ReactNode;
  dot: RailDot;
  children: ReactNode;
  trailing?: ReactNode;
}) {
  return (
    <div className={styles.row}>
      <div className={styles.times}>{time}</div>
      <div className={styles.marker} aria-hidden="true">
        <span className={styles.dot} data-variant={dot} />
      </div>
      <div className="min-w-0">{children}</div>
      <div>{trailing}</div>
    </div>
  );
}

/** Free time between two moments, drawn on the rail without a dot. */
function Gap({ children }: { children: ReactNode }) {
  return (
    <div className={cn(styles.row, styles.gapRow)}>
      <span />
      <div className={styles.marker} aria-hidden="true" />
      <span className={styles.gapText}>{children}</span>
      <span />
    </div>
  );
}

export const ScheduleRail = { Timeline, Item, Row, Gap };
