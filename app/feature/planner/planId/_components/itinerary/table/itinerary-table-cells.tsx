"use client";

import type { CSSProperties, MouseEvent } from "react";
import {
  AlertTriangle,
  BedDouble,
  ChartColumn,
  ChevronRight,
  CircleHelp,
  Clock,
  ExternalLink,
  Flag,
  Footprints,
  House,
  MoreHorizontal,
  Receipt,
  Route,
  Zap,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

import { formatMoney } from "../../budget/budget.utils";
import { getPlaceTagCategory } from "../../place/place-tag-category";
import { PLACE_TAG_ICONS } from "../../place/place-tag-icon";
import { PlaceTypeTag } from "../../place/place-type-tag";
import { LEG_TRAVEL_MODE_META } from "../../routes/leg-travel-mode-meta";
import { getLineTextColor } from "../../routes/travel-options";
import { formatRouteDistance, formatRouteDuration } from "../../routes/trip-route.helpers";
import {
  TIME_RANGE_SEPARATOR,
  type ItineraryTable,
  type ItineraryTableDay,
  type ItineraryTableRow,
} from "../export/itinerary-table";
import {
  formatMinutes,
  getStayMinutes,
  summarizeDayTravel,
  type TableLeg,
  type TableRide,
} from "./itinerary-table-legs";
import styles from "./itinerary-table-view.module.css";

export type RouteState = {
  legs: ReadonlyMap<string, TableLeg>;
  isLoading: boolean;
  isError: boolean;
};

const ANCHOR_META = {
  // A day starts from where the traveller stays and usually ends at the night's accommodation.
  start: { label: "Day starts here", Icon: House },
  end: { label: "Day ends here", Icon: BedDouble },
} as const;
const MAX_MOMENTS = 3;

function pluralize(count: number, word: string) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

/** The stop's number on the map, or a charging bolt for unnumbered charging stops. */
export function PositionCell({ row }: { row: ItineraryTableRow }) {
  if (row.kind === "charger") {
    return (
      <span className={styles.position} data-kind="charger" title="EV charging stop">
        <Zap className="size-4" aria-hidden="true" />
      </span>
    );
  }
  return <span className={styles.position} aria-hidden="true">{row.position}</span>;
}

function getStopIcon(row: ItineraryTableRow) {
  if (row.kind === "start" || row.kind === "end") return { Icon: ANCHOR_META[row.kind].Icon, category: "general" };
  if (row.kind === "charger") return { Icon: Zap, category: "charging" };
  const category = getPlaceTagCategory(row.placeType ?? undefined, row.category ?? "");
  return { Icon: PLACE_TAG_ICONS[category], category };
}

export function StopCell({ row, onShow }: { row: ItineraryTableRow; onShow: (event: MouseEvent) => void }) {
  const meta = row.kind === "start" || row.kind === "end"
    ? ANCHOR_META[row.kind].label
    : row.kind === "charger"
      ? row.chargeDetail ?? "EV charging"
      : row.address;
  const { Icon, category } = getStopIcon(row);
  return (
    <div className={styles.stop}>
      <span className={`place-type-tag ${styles.stopIcon}`} data-place-category={category} aria-hidden="true">
        <Icon className="size-4" />
      </span>
      <span className={styles.stopText}>
        <button type="button" className={styles.stopName} onClick={onShow} title={`Show ${row.name} in the plan`}>
          {row.position !== null && <span className="sr-only">Stop {row.position}: </span>}
          {row.kind === "charger" && <span className="sr-only">EV charging stop: </span>}
          {row.name}
        </button>
        {meta && <span className={styles.stopMeta} title={meta}>{meta}</span>}
      </span>
    </div>
  );
}

/** The kind of place, as the same coloured tag the plan's cards show. */
export function TypeCell({ row }: { row: ItineraryTableRow }) {
  if (row.kind === "charger") {
    return <PlaceTypeTag label="EV charging" placeType="electric_vehicle_charging_station" withIcon className={styles.category} />;
  }
  if (!row.category) return <span className={styles.empty} aria-label="No type">–</span>;
  return <PlaceTypeTag label={row.category} placeType={row.placeType ?? undefined} withIcon className={styles.category} />;
}

/** The stop's time, how long it lasts, whether travel makes it late, and the times planned inside it. */
export function TimeCell({ row, lateMinutes }: { row: ItineraryTableRow; lateMinutes: number | undefined }) {
  const stay = getStayMinutes(row);
  const moments = row.moments.slice(0, MAX_MOMENTS);
  const hidden = row.moments.length - moments.length;
  if (!row.time && !moments.length) return <span className={styles.empty} aria-label="No time">–</span>;
  return (
    <div className={styles.timeStack}>
      {row.time && (
        <span
          className={styles.time}
          data-source={row.timeIsCalculated ? "calculated" : "fixed"}
          title={row.timeIsCalculated ? "Calculated time" : "Fixed time"}
        >
          {row.timeIsCalculated ? <Route className="size-3.5" aria-hidden="true" /> : <Clock className="size-3.5" aria-hidden="true" />}
          <span className="sr-only">{row.timeIsCalculated ? "Calculated time: " : "Fixed time: "}</span>
          {row.time}
        </span>
      )}
      {stay && <span className={styles.stay}>{formatMinutes(stay)}</span>}
      {lateMinutes && (
        <span className={styles.late} title="The stop before ends too late to travel here by this time. Adjust the times in the plan.">
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
          Arrives {formatMinutes(lateMinutes)} late
        </span>
      )}
      {moments.length > 0 && (
        <ol className={styles.moments} aria-label={`Schedule at ${row.name}`}>
          {moments.map((moment) => (
            <li key={moment.id} className={styles.moment}>
              <span className={styles.momentTime}>{moment.time.split(TIME_RANGE_SEPARATOR)[0]}</span>
              {moment.label && <span className={styles.momentLabel} title={`${moment.time} ${moment.label}`}>{moment.label}</span>}
            </li>
          ))}
          {hidden > 0 && <li className={styles.momentMore}>{hidden} more in the plan</li>}
        </ol>
      )}
    </div>
  );
}

function RideChip({ ride }: { ride: TableRide }) {
  const style = ride.color
    ? ({ "--line": ride.color, "--line-ink": getLineTextColor(ride.color) } as CSSProperties)
    : undefined;
  const route = [ride.from && `from ${ride.from}`, ride.to && `to ${ride.to}`, ride.stopCount && pluralize(ride.stopCount, "stop")]
    .filter(Boolean)
    .join(", ");
  return (
    <span className={styles.ride} data-colored={ride.color ? true : undefined} style={style} title={`${ride.vehicle} ${ride.line}${route ? `, ${route}` : ""}`}>
      <span className="sr-only">{ride.vehicle} </span>
      {ride.line}
    </span>
  );
}

export function TravelCell({ leg, isFirst, routes }: { leg: TableLeg | undefined; isFirst: boolean; routes: RouteState }) {
  if (isFirst) {
    return (
      <span className={styles.firstStop}>
        <Flag className="size-4" aria-hidden="true" />
        First stop
      </span>
    );
  }
  if (!leg) {
    if (routes.isLoading) return <Skeleton className="h-16 w-full rounded-md" aria-label="Finding the route" />;
    return <span className={styles.empty}>{routes.isError ? "Route unavailable" : "–"}</span>;
  }
  const { label, Icon } = LEG_TRAVEL_MODE_META[leg.mode];
  if (leg.status === "unverified") {
    return (
      <div className={styles.mode} data-mode={leg.mode} data-status="unverified" title="Only a straight line is known for this leg. Check the route in the plan.">
        <span className={styles.modeHead}>
          <CircleHelp className="size-4 shrink-0" aria-hidden="true" />
          <span className={styles.modeLabel}>Route not confirmed</span>
        </span>
        <span className={styles.modeMeta}>
          {label}{leg.distanceMeters ? `, about ${formatRouteDistance(leg.distanceMeters)}` : ""}
        </span>
      </div>
    );
  }
  const transfers = Math.max(0, leg.rides.length - 1);
  const walkText = [leg.walkingSeconds && `${formatRouteDuration(leg.walkingSeconds)} walk`, transfers > 0 && pluralize(transfers, "transfer")]
    .filter(Boolean)
    .join(", ");
  // Transit lists its lines below; other modes show the distance beside the mode.
  const inlineDistance = !leg.rides.length && leg.distanceMeters ? formatRouteDistance(leg.distanceMeters) : null;
  return (
    <div className={styles.mode} data-mode={leg.mode}>
      <span className={styles.modeHead}>
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className={styles.modeLabel}>{label}</span>
        {inlineDistance && <span className={styles.modeDistance}>{inlineDistance}</span>}
        {leg.durationSeconds && <span className={styles.modeDuration}>{formatRouteDuration(leg.durationSeconds)}</span>}
      </span>
      {leg.rides.length > 0 && (
        <ol className={styles.rides} aria-label="Lines taken" title={leg.rides.map((ride) => `${ride.vehicle} ${ride.line}`).join(", then ")}>
          {leg.rides.map((ride, index) => (
            <li key={`${index}-${ride.line}`} className={styles.rideStep}>
              {index > 0 && <ChevronRight className="size-3 shrink-0 opacity-60" aria-hidden="true" />}
              <RideChip ride={ride} />
            </li>
          ))}
        </ol>
      )}
      {walkText && (
        <span className={styles.modeMeta}>
          <Footprints className="size-3.5 shrink-0" aria-hidden="true" />
          {walkText}
        </span>
      )}
      {leg.savedRouteUnavailable && (
        <span className={styles.modeWarning} title="Your saved line is not offered for the next departures; the closest current route is shown.">
          Saved route not offered now
        </span>
      )}
    </div>
  );
}

export function NotesCell({ text }: { text: string }) {
  return text ? <p className={styles.notes} title={text}>{text}</p> : null;
}

function getMapsUrl(row: ItineraryTableRow): string {
  const query = row.coordinates
    ? `${row.coordinates.lat},${row.coordinates.lng}`
    : [row.name, row.address].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** The stop's cost and its actions: show it in the plan or open it in Google Maps. */
export function CostCell({ row, currency, onShow }: {
  row: ItineraryTableRow;
  currency: ItineraryTable["currency"];
  onShow: () => void;
}) {
  return (
    <div className={styles.costCell}>
      <span className={styles.costValue}>
        {row.total !== null && <span className={styles.amount}>{formatMoney(row.total, currency)}</span>}
        {row.expenses.length > 1 && <span className={styles.sumLabel}>{pluralize(row.expenses.length, "expense")}</span>}
      </span>
      {/* The menu sits inside a clickable row, so its clicks must not also open the plan. */}
      <span onClick={(event) => event.stopPropagation()} className="contents">
        <DropdownMenu>
          <DropdownMenuTrigger className={styles.rowMenu} aria-label={`Actions for ${row.name}`}>
            <MoreHorizontal className="size-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={onShow} className="min-h-9">
              <Route aria-hidden="true" />
              Show in plan
            </DropdownMenuItem>
            <DropdownMenuItem
              className="min-h-9"
              render={<a href={getMapsUrl(row)} target="_blank" rel="noopener noreferrer" />}
            >
              <ExternalLink aria-hidden="true" />
              Open in Google Maps
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </span>
    </div>
  );
}

export function SummaryLabel({ label }: { label: string }) {
  return (
    <span className={styles.summaryLabel}>
      <ChartColumn className="size-4 shrink-0" aria-hidden="true" />
      {label} summary
    </span>
  );
}

export function SummarySpan({ timeSpan }: { timeSpan: string | null }) {
  if (!timeSpan) return <span className={styles.empty}>No times set</span>;
  return (
    <span className={styles.summaryTime}>
      <Clock className="size-4 shrink-0" aria-hidden="true" />
      <span className={styles.span}>{timeSpan}</span>
    </span>
  );
}

export function SummaryCost({ total, currency }: { total: number; currency: ItineraryTable["currency"] }) {
  if (total <= 0) return <span className={styles.empty}>No costs</span>;
  return (
    <span className={styles.summaryCost}>
      <Receipt className="size-4 shrink-0" aria-hidden="true" />
      <span>
        <span className={styles.sumValue}>{formatMoney(total, currency)}</span>
        <span className={styles.sumLabel}>Day total</span>
      </span>
    </span>
  );
}

export function TravelSummary({ day, routes }: { day: ItineraryTableDay; routes: RouteState }) {
  const summary = summarizeDayTravel(day.rows.map((row) => routes.legs.get(row.id)));
  if (!summary.totalSeconds) {
    return <span className={styles.empty}>{routes.isLoading ? "Finding routes…" : "No routed travel"}</span>;
  }
  const description = summary.modes
    .map(({ mode, seconds }) => `${LEG_TRAVEL_MODE_META[mode].label} ${formatRouteDuration(seconds)}`)
    .join(", ");
  // The icon follows the mode the day spends longest in.
  const MainIcon = LEG_TRAVEL_MODE_META[summary.modes[0].mode].Icon;
  return (
    <div className={styles.travel}>
      <span className={styles.travelIcon} data-mode={summary.modes[0].mode}>
        <MainIcon className="size-4" aria-hidden="true" />
        <span className={styles.travelLabel}>Travel</span>
      </span>
      <div className={styles.travelBody}>
        <div className={styles.bar} role="img" aria-label={`Travel time by mode: ${description}`}>
          {summary.modes.map(({ mode, share, seconds }) => (
            <span
              key={mode}
              className={styles.barPart}
              data-mode={mode}
              style={{ flexGrow: share }}
              title={`${LEG_TRAVEL_MODE_META[mode].label}: ${formatRouteDuration(seconds)}`}
            />
          ))}
        </div>
        <strong className={styles.travelTotal}>{formatRouteDuration(summary.totalSeconds)}</strong>
        {summary.unverifiedCount > 0 && (
          <span className="text-xs text-warning">{pluralize(summary.unverifiedCount, "leg")} not confirmed</span>
        )}
      </div>
    </div>
  );
}
