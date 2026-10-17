import { AlertTriangle } from "lucide-react";

import type { PlaceItem } from "../../../constants/types";
import { formatClock, isOutsideStop } from "../../../itinerary/stop-schedule";
import { ScheduleRail } from "./schedule-rail";
import styles from "./stop-schedule.module.css";

/** Moments shown on a closed card before the rest are summarised. */
const VISIBLE_MOMENTS = 5;

/** The stop's moments as a read-only rail, for closed cards and shared plans. */
export function StopScheduleList({ item }: { item: PlaceItem }) {
  const entries = item.schedule ?? [];
  if (!entries.length) return null;
  const visible = entries.slice(0, VISIBLE_MOMENTS);
  const hidden = entries.length - visible.length;

  return (
    <ScheduleRail.Timeline label={`Schedule at ${item.name}`} density="compact">
      {visible.map((entry) => {
        const outside = isOutsideStop(entry, item);
        return (
          <ScheduleRail.Item key={entry.id}>
            <ScheduleRail.Row dot={outside ? "outside" : "moment"} time={<span className={styles.staticTime}>{formatClock(entry.time)}</span>}>
              <p className={styles.staticLabel}>
                {entry.label || <span className="text-muted-foreground">No description</span>}
                {entry.timeEnd ? <span className={styles.staticEnd}> until {formatClock(entry.timeEnd)}</span> : null}
                {outside ? (
                  <span className="ml-1 inline-flex align-text-bottom text-warning">
                    <AlertTriangle className="size-3" aria-hidden="true" />
                    <span className="sr-only">, outside this stop&apos;s time</span>
                  </span>
                ) : null}
              </p>
            </ScheduleRail.Row>
          </ScheduleRail.Item>
        );
      })}
      {hidden > 0 ? (
        <ScheduleRail.Item>
          <ScheduleRail.Row dot="add">
            <p className={styles.staticLabel}>
              <span className="text-muted-foreground">{hidden} more</span>
            </p>
          </ScheduleRail.Row>
        </ScheduleRail.Item>
      ) : null}
    </ScheduleRail.Timeline>
  );
}
