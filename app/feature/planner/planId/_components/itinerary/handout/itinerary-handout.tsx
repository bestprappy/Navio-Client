"use client";

import { Fragment, memo, type CSSProperties } from "react";
import { CircleHelp, Zap } from "lucide-react";

import { formatMoney } from "../../budget/budget.utils";
import { getTripBlockColorById } from "../../constants/trip-block-colors";
import { PlaceNotesPreview } from "../../block/items/place-notes";
import { LEG_TRAVEL_MODE_META } from "../../routes/leg-travel-mode-meta";
import { getLineTextColor } from "../../routes/travel-options";
import { formatRouteDistance, formatRouteDuration } from "../../routes/trip-route.helpers";
import {
  formatTableDate,
  getTableDayLabel,
  TIME_RANGE_SEPARATOR,
  type ItineraryTable,
  type ItineraryTableDay,
  type ItineraryTableRow,
} from "../export/itinerary-table";
import { summarizeDayTravel, type TableLeg, type TableRide } from "../table/itinerary-table-legs";
import type { HandoutOptions } from "./handout-options";
import styles from "./itinerary-handout.module.css";

export type ItineraryHandoutProps = {
  table: ItineraryTable;
  legs: ReadonlyMap<string, TableLeg>;
  title: string;
  destinationName: string;
  options: HandoutOptions;
};

type DayStyle = CSSProperties & { "--day": string };

const ANCHOR_META = { start: "Day starts here", end: "Day ends here" } as const;

function pluralize(count: number, word: string) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

function getStops(day: ItineraryTableDay) {
  return day.rows.filter((row) => row.kind === "place" || row.kind === "charger");
}

/** "Wat Arun to Riva Hotel", from the day's first stop to its last. */
function describeRoute(day: ItineraryTableDay): string {
  const first = day.rows[0]?.name;
  const last = day.rows.at(-1)?.name;
  if (!first) return "Free day";
  return first === last ? first : `${first} to ${last}`;
}

function splitTime(time: string | null): [string, string | null] | null {
  if (!time) return null;
  const [start, end] = time.split(TIME_RANGE_SEPARATOR);
  return [start, end ?? null];
}

function RideLine({ ride }: { ride: TableRide }) {
  const style = ride.color ? ({ "--line": ride.color, "--line-ink": getLineTextColor(ride.color) } as CSSProperties) : undefined;
  const stops = ride.stopCount ? `, ${pluralize(ride.stopCount, "stop")}` : "";
  return (
    <li className={styles.ride}>
      <span className={styles.rideChip} data-colored={ride.color ? true : undefined} style={style}>{ride.line}</span>
      <span>
        {ride.vehicle}
        {ride.from && <> from <strong>{ride.from}</strong></>}
        {ride.to && <> to <strong>{ride.to}</strong></>}
        {stops}
        {ride.headsign && <span className={styles.rideTowards}>, towards {ride.headsign}</span>}
      </span>
    </li>
  );
}

function Leg({ leg }: { leg: TableLeg }) {
  const { label, Icon } = LEG_TRAVEL_MODE_META[leg.mode];
  const distance = leg.distanceMeters ? formatRouteDistance(leg.distanceMeters) : null;
  const walking = leg.walkingSeconds ? `${formatRouteDuration(leg.walkingSeconds)} walking` : null;
  return (
    <li className={styles.leg} data-mode={leg.mode} aria-label={`Travel by ${label.toLowerCase()}`}>
      <span />
      <span className={styles.rail} />
      <div className={styles.legContent}>
        <span className={styles.legBody}>
          {leg.status === "unverified" ? (
            <>
              <CircleHelp aria-hidden="true" />
              <span>{label}, route not confirmed{distance ? `, about ${distance}` : ""}</span>
            </>
          ) : (
            <>
              <Icon aria-hidden="true" />
              <strong>{label}</strong>
              {leg.durationSeconds && <span>{formatRouteDuration(leg.durationSeconds)}</span>}
              {leg.rides.length ? walking && <span>{walking}</span> : distance && <span>{distance}</span>}
            </>
          )}
        </span>
        {leg.rides.length > 0 && (
          <ol className={styles.rides}>
            {leg.rides.map((ride, index) => <RideLine key={`${index}-${ride.line}`} ride={ride} />)}
          </ol>
        )}
      </div>
      <span />
    </li>
  );
}

function Stop({ row, currency, options }: { row: ItineraryTableRow; currency: ItineraryTable["currency"]; options: HandoutOptions }) {
  const time = splitTime(row.time);
  const meta = row.kind === "start" || row.kind === "end"
    ? [ANCHOR_META[row.kind], row.address].filter(Boolean).join(", ")
    : row.kind === "charger"
      ? [row.chargeDetail ?? "EV charging", row.address].filter(Boolean).join(", ")
      : row.address;
  return (
    <li className={styles.stop}>
      <span className={styles.when}>
        {time?.[0]}
        {time?.[1] && <span className={styles.whenEnd}>to {time[1]}</span>}
      </span>
      <span className={styles.rail}>
        {row.kind === "charger" ? (
          <span className={styles.pin} data-kind="charger"><Zap className="size-[3.2mm]" aria-label="EV charging stop" /></span>
        ) : (
          <span className={styles.pin}>{row.position}</span>
        )}
      </span>
      <div className={styles.body}>
        <div className={styles.nameLine}>
          <span className={styles.name}>{row.name}</span>
          {options.showCosts && row.total !== null && <span className={styles.cost}>{formatMoney(row.total, currency)}</span>}
        </div>
        {meta && <p className={styles.meta}>{meta}</p>}
        {options.showNotes && row.notes && (
          <div className={styles.notes}>
            <PlaceNotesPreview value={row.notes} interactive={false} clamped={false} />
          </div>
        )}
        {row.moments.length > 0 && (
          <dl className={styles.moments}>
            {row.moments.map((moment) => (
              <Fragment key={moment.id}>
                <dt className={styles.momentTime}>{moment.time}</dt>
                <dd>{moment.label}</dd>
              </Fragment>
            ))}
          </dl>
        )}
      </div>
      {options.showPhotos && row.imageUrl ? (
        // A plain image prints reliably; the optimizer's lazy loading can leave print blank.
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.photo} src={row.imageUrl} alt="" loading="eager" decoding="sync" referrerPolicy="no-referrer" />
      ) : <span />}
    </li>
  );
}

function Day({ day, legs, currency, options }: {
  day: ItineraryTableDay;
  legs: ReadonlyMap<string, TableLeg>;
  currency: ItineraryTable["currency"];
  options: HandoutOptions;
}) {
  const color = getTripBlockColorById(day.colorId).mapColor;
  const date = formatTableDate(day.date);
  const travel = summarizeDayTravel(day.rows.map((row) => legs.get(row.id)));
  return (
    <section className={styles.day} style={{ "--day": color } as DayStyle}>
      <header className={styles.dayHead}>
        <div>
          <h2 className={styles.dayName}>{getTableDayLabel(day)}{day.title ? `: ${day.title}` : ""}</h2>
          {date && <p className={styles.dayDate}>{date}</p>}
        </div>
        {(day.timeSpan || travel.totalSeconds > 0) && (
          <p className={styles.dayStats}>
            {day.timeSpan && <strong>{day.timeSpan}</strong>}
            {options.showTravel && travel.totalSeconds > 0 && <span>{formatRouteDuration(travel.totalSeconds)} of travel</span>}
          </p>
        )}
      </header>
      {day.rows.length === 0 ? (
        <p className={styles.freeDay}>A free day, with nothing planned yet.</p>
      ) : (
        <ol className={styles.stops}>
          {day.rows.map((row, index) => {
            const leg = index > 0 && options.showTravel ? legs.get(row.id) : undefined;
            return (
              <Fragment key={row.id}>
                {leg && <Leg leg={leg} />}
                <Stop row={row} currency={currency} options={options} />
              </Fragment>
            );
          })}
        </ol>
      )}
      {options.showCosts && day.total > 0 && (
        <p className={styles.dayTotal}>
          <span>{getTableDayLabel(day)} total</span>
          <strong>{formatMoney(day.total, currency)}</strong>
        </p>
      )}
    </section>
  );
}

/** The printable itinerary handed to travellers: an overview, then one timetable per day. */
export const ItineraryHandout = memo(function ItineraryHandout({ table, legs, title, destinationName, options }: ItineraryHandoutProps) {
  const firstDate = formatTableDate(table.days[0]?.date ?? "");
  const lastDate = formatTableDate(table.days.at(-1)?.date ?? "");
  const dateRange = firstDate && lastDate && firstDate !== lastDate ? `${firstDate} – ${lastDate}` : firstDate;
  const stopCount = table.days.reduce((count, day) => count + getStops(day).length, 0);
  const preparedBy = options.preparedBy.trim();

  return (
    <article className={styles.sheet} data-day-breaks={options.dayPerPage} aria-label={`${title} itinerary handout`}>
      <div className={styles.masthead}>
        <span>{preparedBy ? `Prepared by ${preparedBy}` : "Trip itinerary"}</span>
        {dateRange && <span>{dateRange}</span>}
      </div>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.facts}>
        {destinationName && destinationName !== title && <strong>{destinationName}</strong>}
        <span>{pluralize(table.days.length, "day")}</span>
        <span>{pluralize(stopCount, "stop")}</span>
      </p>

      {table.days.length > 1 && (
        <ol className={styles.overview} aria-label="Days at a glance">
          {table.days.map((day) => (
            <li key={day.id} className={styles.overviewDay} style={{ "--day": getTripBlockColorById(day.colorId).mapColor } as DayStyle}>
              <span className={styles.overviewLabel}>{getTableDayLabel(day)}</span>
              {day.date && <span className={styles.overviewMeta}> {formatTableDate(day.date)}</span>}
              <p className={styles.overviewRoute}>{day.title || describeRoute(day)}</p>
              <p className={styles.overviewMeta}>{getStops(day).length ? pluralize(getStops(day).length, "stop") : "Nothing planned"}</p>
            </li>
          ))}
        </ol>
      )}

      {table.days.map((day) => (
        <Day key={day.id} day={day} legs={legs} currency={table.currency} options={options} />
      ))}

      {options.showCosts && table.days.length > 1 && (
        <p className={styles.tripTotal}>
          <span>Trip total</span>
          <strong>{formatMoney(table.total, table.currency)}</strong>
        </p>
      )}
      <p className={styles.closing}>
        Times and travel are estimates from the planned routes. Check opening hours and departures on the day.
      </p>
    </article>
  );
});
