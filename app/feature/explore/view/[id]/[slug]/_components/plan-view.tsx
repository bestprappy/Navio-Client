"use client";

import { Fragment, type CSSProperties, type ReactNode, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  BatteryCharging,
  BatteryWarning,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  CreditCard,
  Loader2,
  MapPin,
  Plug,
  PlugZap,
  Route,
  ShoppingBag,
  Star,
  Timer,
  Utensils,
  Wallet,
  Zap,
} from "lucide-react";
import { useAtom } from "jotai";

import type {
  Plan,
  PlanBudget,
  PlanExpenseItem,
  PlanGarage,
} from "../../../../_components/data";
import {
  getPlanCopyHref,
  getUserById,
} from "../../../../_components/data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button.variants";
import { getTripBlockColorById } from "@/app/feature/planner/planId/_components/constants/trip-block-colors";
import { getPlanGarageEvCar, getPlanGarageUserVehicle, getPlanTemplatePlaceEvChargerDetails } from "@/app/feature/planner/planId/_components/constants/template-ev";
import type { PlaceItemEvChargerDetails } from "@/app/feature/planner/planId/_components/constants/types";
import type { EvCar } from "@/app/feature/planner/planId/_components/constants/vehicle.types";
import { PlaceCardVisual } from "@/app/feature/planner/planId/_components/block/items/place-card-visual";
import {
  calcBatteryUsedPct,
  calcDayChargeStats,
  calcDayRouteStats,
  calcTripEvSummary,
  type DayBlockSummary,
} from "@/app/feature/planner/planId/_components/garage/ev-calculator";
import { formatMinutes } from "@/app/feature/planner/planId/_components/garage/garage-formatters";
import { VehicleUsageOverview } from "@/app/feature/planner/planId/_components/garage/vehicle-usage-overview";
import { ChargeSegmentInfo, DischargeSegmentInfo } from "@/app/feature/planner/planId/_components/routes/charge-segment-info";
import { RouteSegmentInfo } from "@/app/feature/planner/planId/_components/routes/route-segment-info";
import { getRouteSegmentByToItemId, getTripRouteGroups } from "@/app/feature/planner/planId/_components/routes/trip-route.helpers";
import { useTripRoutesForGroups } from "@/app/feature/planner/planId/_components/routes/trip-route-query";
import type { RouteSegment } from "@/app/feature/planner/planId/_components/routes/trip-route.types";
import { cn } from "@/lib/utils";

import { selectedExplorePlanPlaceIdAtom } from "./plan-view-atoms";
import {
  getExplorePlanBlocks,
  getExplorePlanTripBlocks,
  type ExplorePlanBlock,
  type ExplorePlanPlace,
} from "./plan-view-model";

type PlanViewProps = {
  plan?: Plan;
};

function formatDisplayTime(time: string): string {
  const [hourStr, minuteStr = "00"] = time.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minuteStr} ${period}`;
}

function parseDateValue(isoDate: string): Date {
  const [year = 0, month = 1, day = 1] = isoDate
    .split("-")
    .map((part) => Number(part));

  return new Date(year, month - 1, day);
}

function formatDate(isoDate: string): string {
  return parseDateValue(isoDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatBlockDate(isoDate: string): string {
  return parseDateValue(isoDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type BatteryState = {
  arrivalPct: number;
  departurePct: number;
};

const EXPLORE_STARTING_BATTERY_PCT = 80;

function isItineraryBlock(block: ExplorePlanBlock): boolean {
  return block.type !== "list";
}

function getBlockChargerDetails(
  block: ExplorePlanBlock,
): PlaceItemEvChargerDetails[] {
  return block.places
    .map((place) => getPlanTemplatePlaceEvChargerDetails(place))
    .filter((charger): charger is PlaceItemEvChargerDetails => Boolean(charger));
}

function getRouteablePositionByPlaceId(
  places: ExplorePlanPlace[],
): Map<string, number> {
  const positions = new Map<string, number>();
  let routeablePosition = 0;

  places.forEach((place) => {
    routeablePosition += 1;
    positions.set(place.displayId, routeablePosition);
  });

  return positions;
}

function buildBatteryStateMap(
  places: ExplorePlanPlace[],
  segments: Map<string, RouteSegment>,
  car: EvCar,
  startPct: number,
): Map<string, BatteryState> {
  const batteryByPlaceId = new Map<string, BatteryState>();
  let currentPct = startPct;

  places.forEach((place, index) => {
    let arrivalPct = currentPct;

    if (index > 0) {
      const segment = segments.get(place.displayId);
      const distanceKm = (segment?.distanceMeters ?? 0) / 1000;
      const usedPct = distanceKm > 0 ? calcBatteryUsedPct(distanceKm, car) : 0;
      arrivalPct = Math.max(0, currentPct - usedPct);
    }

    let departurePct = arrivalPct;
    const charger = getPlanTemplatePlaceEvChargerDetails(place);

    if (charger) {
      const chargeStats = calcDayChargeStats([charger], car);
      const addedPct = (chargeStats.chargeEnergyKwh / car.batteryKwh) * 100;
      departurePct = Math.min(100, arrivalPct + addedPct);
    }

    batteryByPlaceId.set(place.displayId, { arrivalPct, departurePct });
    currentPct = departurePct;
  });

  return batteryByPlaceId;
}

function getDaySummary(
  block: ExplorePlanBlock,
  routeSegments: RouteSegment[],
  car: EvCar,
): DayBlockSummary {
  const segments = routeSegments.filter((segment) => segment.blockId === block.id);
  const routeStats = calcDayRouteStats(segments, car);
  const chargeStats = calcDayChargeStats(getBlockChargerDetails(block), car);

  return {
    distanceKm: routeStats.totalDistanceKm,
    energyKwh: routeStats.energyKwh,
    chargeEnergyKwh: chargeStats.chargeEnergyKwh,
    chargeMinutes: chargeStats.chargeMinutes,
  };
}

function getBatteryAtBlockStart(
  blocks: ExplorePlanBlock[],
  blockIndex: number,
  routeSegments: RouteSegment[],
  car: EvCar,
  startingBatteryPct: number,
): number {
  const priorSummaries = blocks
    .slice(0, blockIndex)
    .filter(isItineraryBlock)
    .map((block) => getDaySummary(block, routeSegments, car));

  if (priorSummaries.length === 0) {
    return startingBatteryPct;
  }

  return calcTripEvSummary(priorSummaries, car, startingBatteryPct)
    .finalBatteryPct;
}

/* ══════════════════════ Garage ══════════════════════ */
function GarageSection({
  planId,
  garage,
  blocks,
  routeSegments,
  isRouteLoading,
  isRouteError,
}: {
  planId: string;
  garage: PlanGarage;
  blocks: ExplorePlanBlock[];
  routeSegments: RouteSegment[];
  isRouteLoading: boolean;
  isRouteError: boolean;
}) {
  const car = useMemo(
    () => getPlanGarageEvCar(`explore-car-${planId}`, garage),
    [garage, planId],
  );
  const vehicle = useMemo(
    () =>
      getPlanGarageUserVehicle(
        `explore-vehicle-${planId}`,
        garage,
        EXPLORE_STARTING_BATTERY_PCT,
      ),
    [garage, planId],
  );
  const itineraryBlocks = useMemo(
    () => blocks.filter(isItineraryBlock),
    [blocks],
  );
  const tripSummary = useMemo(() => {
    if (routeSegments.length === 0 || itineraryBlocks.length === 0) return null;

    return calcTripEvSummary(
      itineraryBlocks.map((block) => getDaySummary(block, routeSegments, car)),
      car,
      EXPLORE_STARTING_BATTERY_PCT,
    );
  }, [car, itineraryBlocks, routeSegments]);
  const totalDrivingMinutes = useMemo(
    () =>
      Math.round(
        routeSegments.reduce(
          (sum, segment) => sum + (segment.durationSeconds ?? 0),
          0,
        ) / 60,
      ),
    [routeSegments],
  );

  return (
    <section className="px-4 py-4 mx-6">
      <div className="mb-4 flex items-center justify-between pl-1">
        <div>
          <h2 className="text-2xl font-bold text-foreground">My Garage</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Vehicle used for this trip template.
          </p>
        </div>
      </div>

      <div className="mx-1 rounded-sm border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-sm bg-primary/10">
            <Car className="size-6 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base font-bold leading-snug text-foreground">
              {garage.year} {garage.make} {garage.model}
              {garage.trim ? (
                <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                  · {garage.trim}
                </span>
              ) : null}
            </p>
            {garage.color ? (
              <p className="text-xs text-muted-foreground">{garage.color}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs font-medium text-foreground">
                <BatteryCharging className="size-3 text-primary" aria-hidden="true" />
                {garage.batteryCapacityKwh} kWh
              </span>
              <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs font-medium text-foreground">
                <Route className="size-3 text-primary" aria-hidden="true" />
                {garage.rangeKm} km range
              </span>
              <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-1 text-xs font-medium text-foreground">
                <Plug className="size-3 text-primary" aria-hidden="true" />
                {car.connectorTypes.join(", ")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isRouteLoading ? (
        <div className="mx-1 mt-4 flex items-center gap-2 rounded-sm border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground shadow-xs">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>Calculating EV usage...</span>
        </div>
      ) : isRouteError ? (
        <div className="mx-1 mt-4 flex items-center gap-2 rounded-sm border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground shadow-xs">
          <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
          <span>Route estimate unavailable.</span>
        </div>
      ) : tripSummary ? (
        <div className="mx-1 mt-4">
          <VehicleUsageOverview
            car={car}
            vehicle={vehicle}
            tripSummary={tripSummary}
            totalDrivingMinutes={totalDrivingMinutes}
            plannedDays={itineraryBlocks.length}
          />
        </div>
      ) : null}
    </section>
  );
}

/* ══════════════════════ Budget ══════════════════════ */
const EXPENSE_ICONS: Record<PlanExpenseItem["category"], typeof Wallet> = {
  accommodation: MapPin,
  food: Utensils,
  activities: Star,
  transport: Route,
  shopping: ShoppingBag,
  charging: Zap,
  other: CreditCard,
};

function BudgetSection({ budget }: { budget: PlanBudget }) {
  const spent = budget.items.reduce((sum, item) => sum + item.amount, 0);
  const remaining = budget.total - spent;
  const progress = Math.min(100, (spent / budget.total) * 100);

  return (
    <section className="px-4 pb-12 pt-2">
      <div className="mb-5 flex items-center justify-between pl-4">
        <h2 className="text-2xl font-bold text-foreground">Budgeting</h2>
      </div>

      <div className="mx-2 rounded-sm border bg-card p-5">
        <div>
          <div className="flex items-end justify-between gap-4">
            <p className="text-3xl font-semibold text-foreground">
              {budget.currency} {spent.toLocaleString()}
            </p>
            <p className="pb-1 text-xs font-medium text-muted-foreground">
              Budget: {budget.currency} {budget.total.toLocaleString()}
            </p>
          </div>
          <div
            className="mt-2 h-1.5 rounded-full bg-muted-foreground/25"
            role="progressbar"
            aria-label={`${Math.round(progress)} percent of budget spent`}
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                progress >= 100 ? "bg-destructive" : "bg-primary",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-full bg-background px-4 py-2 text-sm font-semibold text-foreground">
              <Coins className="size-4 text-muted-foreground" aria-hidden="true" />
              Remaining {budget.currency} {remaining.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-3 mt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-lg font-semibold text-foreground">Expenses</p>
        </div>
        <div className="space-y-2">
          {budget.items.map((item) => {
            const Icon = EXPENSE_ICONS[item.category];
            return (
              <div
                key={item.id}
                className="flex items-center rounded-sm border border-border bg-card"
              >
                <div className="grid flex-1 grid-cols-[2rem_1fr_auto] items-center gap-3 p-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.category}
                      {item.date ? ` · ${formatDate(item.date)}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground">
                    {item.currency} {item.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════ Block title header ══════════════════════ */
function ReadOnlyBlockTitle({ block }: { block: ExplorePlanBlock }) {
  const blockColor = getTripBlockColorById(block.colorId);

  return (
    <div className="flex items-center gap-2 mx-6">
      <div className="min-w-0 flex-1">
        {isItineraryBlock(block) && block.date ? (
          /* Date header — matches BlockDatePicker visual */
          <div className="flex min-h-12 items-center gap-3 rounded-sm border border-transparent bg-muted/50 px-3 py-2">
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold leading-tight text-foreground">
                {formatBlockDate(block.date)}
              </p>
            </div>
          </div>
        ) : (
          /* List title — matches TripBlock.Title list-block style */
          <div className="min-h-12 w-full rounded-sm bg-muted/50 px-3 py-2 text-left text-xl font-bold leading-tight text-foreground">
            <span className="line-clamp-2">{block.title}</span>
          </div>
        )}
      </div>
      <span
        className="size-3 shrink-0 rounded-full"
        style={{ backgroundColor: blockColor.value }}
        aria-hidden="true"
      />
    </div>
  );
}

/* ══════════════════════ Place meta badges ══════════════════════ */
function PlaceMetaBadges({ place }: { place: ExplorePlanPlace }) {
  const hasMeta =
    place.isVisited || place.time || place.cost !== undefined || place.notes;
  if (!hasMeta) return null;

  return (
    <div className="space-y-2 border-t border-border/70 px-4 pb-4 pt-3">
      <div className="flex flex-wrap gap-1.5">
        {place.isVisited ? (
          <span className="inline-flex items-center gap-1 rounded-sm bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
            <CheckCircle2 className="size-3" aria-hidden="true" />
            Visited
          </span>
        ) : null}
        {place.time ? (
          <span className="inline-flex items-center gap-1 rounded-sm bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-700 dark:text-sky-400">
            <Clock className="size-3" aria-hidden="true" />
            {place.timeEnd
              ? `${formatDisplayTime(place.time)} – ${formatDisplayTime(place.timeEnd)}`
              : formatDisplayTime(place.time)}
          </span>
        ) : null}
        {place.cost !== undefined ? (
          <span className="inline-flex items-center gap-1 rounded-sm bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
            THB {place.cost.toLocaleString()}
          </span>
        ) : null}
      </div>
      {place.notes ? (
        <p className="text-xs leading-5 text-muted-foreground">{place.notes}</p>
      ) : null}
    </div>
  );
}

/* ══════════════════════ EV charger card ══════════════════════ */
function ReadOnlyEvCard({
  place,
  selected,
  onSelect,
  chargeBatteryFrom,
  chargeBatteryTo,
}: {
  place: ExplorePlanPlace;
  selected: boolean;
  onSelect: () => void;
  chargeBatteryFrom?: number;
  chargeBatteryTo?: number;
}) {
  const blockColor = getTripBlockColorById(place.colorId);
  const markerStyle: CSSProperties = {
    backgroundColor: blockColor.value,
    color: blockColor.foreground,
  };
  const selectedStyle: CSSProperties | undefined = selected
    ? {
        borderColor: blockColor.value,
        boxShadow: `0 0 0 2px color-mix(in oklch, ${blockColor.value} 28%, transparent)`,
      }
    : undefined;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "w-full cursor-pointer overflow-hidden rounded-sm border text-left shadow-xs transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.99]",
        "border-primary/30 bg-primary/5 ring-1 ring-primary/10",
        selected && "border-2",
      )}
      style={selectedStyle}
    >
      <div className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-sm text-xs font-bold shadow-xs"
            style={markerStyle}
          >
            <Zap className="size-4" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <Badge
              variant="outline"
              className="mb-1.5 h-6 rounded-sm border-primary/30 bg-background/70 px-2 text-primary"
            >
              <Zap className="size-3" aria-hidden="true" />
              Charging Stop
            </Badge>
            <h3 className="text-base font-bold leading-snug text-foreground">
              {place.name}
            </h3>
          </div>
        </div>

        <div className="grid gap-1.5 rounded-sm border border-primary/15 bg-background/80 p-3 text-sm">
          {place.evConnectors ? (
            <div className="flex items-center gap-2">
              <Plug className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="font-medium text-foreground">Connector:</span>
              <span className="text-muted-foreground">{place.evConnectors}</span>
            </div>
          ) : null}
          {place.evPowerKw ? (
            <div className="flex items-center gap-2">
              <BatteryCharging className="size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="font-medium text-foreground">Power:</span>
              <span className="text-muted-foreground">{place.evPowerKw} kW</span>
            </div>
          ) : null}
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span className="text-muted-foreground">{place.address}</span>
          </div>
        </div>

        <ChargeSegmentInfo
          batteryFrom={chargeBatteryFrom}
          batteryTo={chargeBatteryTo}
        />

        {(place.time || place.notes) ? (
          <div className="space-y-1.5">
            {place.time ? (
              <span className="inline-flex items-center gap-1 rounded-sm bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-700 dark:text-sky-400">
                <Clock className="size-3" aria-hidden="true" />
                {place.timeEnd
                  ? `${formatDisplayTime(place.time)} – ${formatDisplayTime(place.timeEnd)}`
                  : formatDisplayTime(place.time)}
              </span>
            ) : null}
            {place.notes ? (
              <p className="text-xs leading-5 text-muted-foreground">{place.notes}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </button>
  );
}

/* ══════════════════════ Regular place card ══════════════════════ */
function ReadOnlyPlaceCard({
  place,
  selected,
  onSelect,
}: {
  place: ExplorePlanPlace;
  selected: boolean;
  onSelect: () => void;
}) {
  const blockColor = getTripBlockColorById(place.colorId);

  const selectedStyle: CSSProperties | undefined = selected
    ? {
        borderColor: blockColor.value,
        boxShadow: `0 0 0 2px color-mix(in oklch, ${blockColor.value} 28%, transparent)`,
      }
    : undefined;

  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "w-full cursor-pointer overflow-hidden rounded-sm border bg-card text-left shadow-xs transition-all duration-200 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.99]",
        selected ? "border-2" : "border-border",
      )}
      style={selectedStyle}
    >
      <PlaceCardVisual
        name={place.name}
        imageUrl={place.imageUrl}
        rating={place.rating}
        reviewCount={place.reviewCount}
        address={place.address}
        description={place.description}
        position={place.position}
        colorId={place.colorId}
      />
      <PlaceMetaBadges place={place} />
    </button>
  );
}

/* ══════════════════════ Block (list or itinerary day) ══════════════════════ */
function ReadOnlyDayRouteOverview({
  block,
  blockIndex,
  blocks,
  routeSegments,
  isRouteLoading,
  isRouteError,
  activeEvCar,
}: {
  block: ExplorePlanBlock;
  blockIndex: number;
  blocks: ExplorePlanBlock[];
  routeSegments: RouteSegment[];
  isRouteLoading: boolean;
  isRouteError: boolean;
  activeEvCar: EvCar | null;
}) {
  if (!activeEvCar || !isItineraryBlock(block)) return null;

  const daySegments = routeSegments.filter(
    (segment) => segment.blockId === block.id,
  );

  if (isRouteLoading) {
    return (
      <div className="mx-8 mt-4 pl-2">
        <div className="flex items-center gap-2 rounded-sm border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground shadow-xs">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          <span>Calculating day overview...</span>
        </div>
      </div>
    );
  }

  if (isRouteError) {
    return (
      <div className="mx-8 mt-4 pl-2">
        <div className="flex items-center gap-2 rounded-sm border border-border bg-card/80 px-3 py-2 text-sm text-muted-foreground shadow-xs">
          <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
          <span>Route estimate unavailable.</span>
        </div>
      </div>
    );
  }

  if (daySegments.length === 0) return null;

  const batteryAtDayStart = getBatteryAtBlockStart(
    blocks,
    blockIndex,
    routeSegments,
    activeEvCar,
    EXPLORE_STARTING_BATTERY_PCT,
  );
  const dayStats = calcDayRouteStats(daySegments, activeEvCar);
  const chargeStats = calcDayChargeStats(
    getBlockChargerDetails(block),
    activeEvCar,
  );
  const batteryEndPct = Math.min(
    100,
    Math.max(
      0,
      batteryAtDayStart -
        dayStats.batteryUsedPct +
        (chargeStats.chargeEnergyKwh / activeEvCar.batteryKwh) * 100,
    ),
  );
  const batteryLow = batteryEndPct < 20;
  const hasIncompatibleStops = chargeStats.incompatibleStops > 0;
  const drivingMinutes = Math.round(dayStats.totalDrivingSeconds / 60);

  return (
    <div
      className="mx-8 mt-4 pl-2"
      aria-label={`Day ${blockIndex + 1} route overview`}
    >
      <div className="rounded-sm border border-border bg-card/80 p-3 shadow-xs">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Route Estimate
          </p>
          <p className="text-[11px] font-semibold text-muted-foreground">
            Start {batteryAtDayStart.toFixed(0)}%
          </p>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <StatPill
            icon={<MapPin className="size-3.5" />}
            label={`${dayStats.totalDistanceKm.toFixed(1)} km`}
            aria="Distance"
          />
          <StatPill
            icon={<Timer className="size-3.5" />}
            label={formatMinutes(drivingMinutes)}
            aria="Driving time"
          />
          <StatPill
            icon={<Zap className="size-3.5" />}
            label={`${dayStats.energyKwh.toFixed(1)} kWh`}
            aria="Energy used"
          />
          {chargeStats.chargeMinutes > 0 ? (
            <StatPill
              icon={<PlugZap className="size-3.5 text-primary" />}
              label={`Charge ${formatMinutes(chargeStats.chargeMinutes)}`}
              aria="Charge time"
              highlight
            />
          ) : null}
          {chargeStats.compatibleStops > 0 ? (
            <StatPill
              icon={<PlugZap className="size-3.5" />}
              label={`${chargeStats.compatibleStops} compatible stop${
                chargeStats.compatibleStops === 1 ? "" : "s"
              }`}
              aria="Compatible charge stops"
            />
          ) : null}
        </div>

        {hasIncompatibleStops ? (
          <div className="mt-3 flex items-start gap-2 rounded-sm bg-warning/10 px-3 py-2 text-xs font-medium text-warning">
            <AlertTriangle
              className="mt-0.5 size-3.5 shrink-0"
              aria-hidden="true"
            />
            <span>
              {chargeStats.incompatibleStops} charger stop
              {chargeStats.incompatibleStops === 1 ? "" : "s"} does not match
              this vehicle connector.
            </span>
          </div>
        ) : null}

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Battery at end of day</span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                batteryLow ? "text-destructive" : "text-foreground",
              )}
            >
              {batteryEndPct.toFixed(0)}%
              {batteryLow ? (
                <BatteryWarning
                  className="ml-1 inline size-3.5 text-destructive"
                  aria-hidden="true"
                />
              ) : null}
            </span>
          </div>
          <div
            className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-label={`Battery remaining: ${batteryEndPct.toFixed(0)}%`}
            aria-valuenow={Math.round(batteryEndPct)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                batteryLow
                  ? "bg-destructive"
                  : batteryEndPct < 40
                    ? "bg-warning"
                    : "bg-primary",
              )}
              style={{ width: `${Math.min(100, batteryEndPct)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

type StatPillProps = {
  icon: ReactNode;
  label: string;
  aria: string;
  highlight?: boolean;
};

function StatPill({ icon, label, aria, highlight }: StatPillProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs",
        highlight ? "font-semibold text-primary" : "text-muted-foreground",
      )}
      aria-label={aria}
    >
      <span
        className={highlight ? "text-primary" : "text-muted-foreground"}
        aria-hidden="true"
      >
        {icon}
      </span>
      {label}
    </div>
  );
}

function ReadOnlyBlock({
  block,
  blockIndex,
  blocks,
  selectedPlaceId,
  onSelectPlace,
  routeSegments,
  isRouteLoading,
  isRouteError,
  activeEvCar,
}: {
  block: ExplorePlanBlock;
  blockIndex: number;
  blocks: ExplorePlanBlock[];
  selectedPlaceId: string | null;
  onSelectPlace: (id: string) => void;
  routeSegments: RouteSegment[];
  isRouteLoading: boolean;
  isRouteError: boolean;
  activeEvCar: EvCar | null;
}) {
  const shouldShowRouting = isItineraryBlock(block);
  const blockRouteSegments = useMemo(
    () => routeSegments.filter((segment) => segment.blockId === block.id),
    [block.id, routeSegments],
  );
  const routeSegmentByToItemId = useMemo(
    () => getRouteSegmentByToItemId(blockRouteSegments),
    [blockRouteSegments],
  );
  const routeablePositionByPlaceId = useMemo(
    () => getRouteablePositionByPlaceId(block.places),
    [block.places],
  );
  const batteryAtBlockStart = useMemo(
    () =>
      activeEvCar
        ? getBatteryAtBlockStart(
            blocks,
            blockIndex,
            routeSegments,
            activeEvCar,
            EXPLORE_STARTING_BATTERY_PCT,
          )
        : EXPLORE_STARTING_BATTERY_PCT,
    [activeEvCar, blockIndex, blocks, routeSegments],
  );
  const batteryStateByPlaceId = useMemo(() => {
    if (!activeEvCar || !shouldShowRouting) {
      return new Map<string, BatteryState>();
    }

    return buildBatteryStateMap(
      block.places,
      routeSegmentByToItemId,
      activeEvCar,
      batteryAtBlockStart,
    );
  }, [
    activeEvCar,
    batteryAtBlockStart,
    block.places,
    routeSegmentByToItemId,
    shouldShowRouting,
  ]);

  return (
    <div id={`explore-block-${block.id}`} className="flex w-full scroll-mt-4 flex-col">
      {/* Header — matches TripBlock.Header */}
      <div className="mx-3 mb-4 space-y-3">
        <ReadOnlyBlockTitle block={block} />
      </div>

      {/* Items — matches SortableBlockItems layout */}
      <div
        role="list"
        className="space-y-3"
        aria-label={`${block.title} places`}
      >
        {block.places.map((place) => {
          const routeablePosition =
            routeablePositionByPlaceId.get(place.displayId) ?? 0;
          const shouldShowRouteInfo =
            shouldShowRouting && routeablePosition > 1;
          const segment = shouldShowRouteInfo
            ? routeSegmentByToItemId.get(place.displayId)
            : undefined;
          const fromState = segment
            ? batteryStateByPlaceId.get(segment.fromItemId)
            : undefined;
          const toState = shouldShowRouteInfo
            ? batteryStateByPlaceId.get(place.displayId)
            : undefined;
          const itemBatteryState = batteryStateByPlaceId.get(place.displayId);

          return (
            <Fragment key={place.displayId}>
              {shouldShowRouteInfo ? (
                <div
                  role="listitem"
                  className="mr-8 grid grid-cols-[2rem_minmax(0,1fr)] gap-3 rounded-sm"
                >
                  <div
                    className="ml-3 flex justify-center py-1"
                    aria-hidden="true"
                  >
                    <span className="h-full min-h-8 w-px bg-border" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <RouteSegmentInfo
                      segment={segment ?? null}
                      isLoading={isRouteLoading}
                      isError={isRouteError}
                      routeColor={getTripBlockColorById(block.colorId).value}
                    />
                    <DischargeSegmentInfo
                      batteryFrom={fromState?.departurePct}
                      batteryTo={toState?.arrivalPct}
                    />
                  </div>
                </div>
              ) : null}

              <div
                role="listitem"
                className="mr-8 grid grid-cols-[2rem_minmax(0,1fr)] gap-3"
              >
                {/* Left column spacer (replaces drag handle) */}
                <div className="ml-3" aria-hidden="true" />
                {/* Card */}
                {place.isEvCharger ? (
                  <ReadOnlyEvCard
                    place={place}
                    selected={selectedPlaceId === place.displayId}
                    onSelect={() => onSelectPlace(place.displayId)}
                    chargeBatteryFrom={itemBatteryState?.arrivalPct}
                    chargeBatteryTo={itemBatteryState?.departurePct}
                  />
                ) : (
                  <ReadOnlyPlaceCard
                    place={place}
                    selected={selectedPlaceId === place.displayId}
                    onSelect={() => onSelectPlace(place.displayId)}
                  />
                )}
              </div>
            </Fragment>
          );
        })}
      </div>
      <ReadOnlyDayRouteOverview
        block={block}
        blockIndex={blockIndex}
        blocks={blocks}
        routeSegments={routeSegments}
        isRouteLoading={isRouteLoading}
        isRouteError={isRouteError}
        activeEvCar={activeEvCar}
      />
    </div>
  );
}

/* ══════════════════════ Main view ══════════════════════ */
export function PlanView({ plan }: PlanViewProps) {
  const [selectedPlaceId, setSelectedPlaceId] = useAtom(
    selectedExplorePlanPlaceIdAtom,
  );

  useEffect(() => {
    setSelectedPlaceId(null);
  }, [plan?.id, setSelectedPlaceId]);

  const author = plan ? getUserById(plan.authorId) : null;
  const copyHref = plan ? getPlanCopyHref(plan) : "/planner";
  const allBlocks = useMemo(() => getExplorePlanBlocks(plan), [plan]);
  const tripBlocks = useMemo(() => getExplorePlanTripBlocks(plan), [plan]);
  const routeGroups = useMemo(
    () => getTripRouteGroups(tripBlocks),
    [tripBlocks],
  );
  const tripRoutes = useTripRoutesForGroups(routeGroups);
  const routeSegments = useMemo(
    () => tripRoutes.data?.segments ?? [],
    [tripRoutes.data?.segments],
  );
  const activeEvCar = useMemo(
    () =>
      plan?.garage
        ? getPlanGarageEvCar(`explore-car-${plan.id}`, plan.garage)
        : null,
    [plan],
  );
  const itineraryBlocks = useMemo(
    () => allBlocks.filter(isItineraryBlock),
    [allBlocks],
  );
  const listBlocks = useMemo(
    () => allBlocks.filter((b) => b.type === "list"),
    [allBlocks],
  );

  const tripDateLabel = (() => {
    if (!plan?.templateStartDate || !plan?.templateEndDate) return null;
    return `${formatDate(plan.templateStartDate)} – ${formatDate(plan.templateEndDate)}`;
  })();

  if (!plan) {
    return (
      <section className="mx-auto flex max-w-3xl flex-col gap-4 px-6 py-14 text-center">
        <h1 className="text-2xl font-semibold text-foreground">Plan not found</h1>
        <p className="text-sm text-muted-foreground">
          This plan is not available yet. Try another one from Explore.
        </p>
      </section>
    );
  }

  return (
    <section className="flex min-h-full flex-col pb-16">
      {/* Hero — matches TripHero */}
      <div
        className="relative h-[15rem] w-full overflow-hidden"
        role="img"
        aria-label={`Cover photo for ${plan.title}`}
      >
        <Image
          src={plan.imageUrl}
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 38vw"
          className="object-cover"
        />
      </div>

      {/* Info card — matches TripInfoCard: -mt-20 mx-16 */}
      <div className="relative z-10 -mt-20 mx-16 flex flex-col gap-4 rounded-sm bg-card p-6 shadow-2xs">
        <h1 className="text-4xl font-extrabold leading-tight text-foreground">
          {plan.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {author ? (
            <Badge variant="outline" className="rounded-sm bg-background/70">
              Shared by {author.name}
            </Badge>
          ) : null}
          {tripDateLabel ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {tripDateLabel}
            </span>
          ) : null}
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          {plan.description}
        </p>
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-muted/70 px-2 py-1">
            <MapPin className="size-3.5 text-primary" aria-hidden="true" />
            {plan.location}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-sm bg-muted/70 px-2 py-1">
            <Star className="size-3.5 fill-primary text-primary" aria-hidden="true" />
            {plan.rating.toFixed(1)} ({plan.reviews.toLocaleString()} reviews)
          </span>
        </div>
        <Link
          href={copyHref}
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-fit rounded-full px-6 shadow-md",
          )}
        >
          <Copy className="size-4" aria-hidden="true" />
          Copy Plan
        </Link>
      </div>

      {/* Garage — matches GarageSection */}
      {plan.garage ? (
        <GarageSection
          planId={plan.id}
          garage={plan.garage}
          blocks={itineraryBlocks}
          routeSegments={routeSegments}
          isRouteLoading={tripRoutes.isFetching && !tripRoutes.data}
          isRouteError={tripRoutes.isError}
        />
      ) : null}

      {/* My List — matches MyListSection with Accordion */}
      {listBlocks.length > 0 ? (
        <section className="px-4 py-4">
          <Accordion defaultValue={["my-list"]}>
            <AccordionItem value="my-list" className="border-none">
              <div className="mb-6 flex items-center justify-between">
                <AccordionTrigger
                  iconSide="left"
                  className="items-center py-0 text-2xl font-bold text-foreground hover:text-primary hover:no-underline"
                >
                  My List
                </AccordionTrigger>
              </div>
              <AccordionContent className="pt-0">
                <div className="space-y-8 pb-8 pt-2">
                  {listBlocks.map((block, blockIndex) => (
                    <ReadOnlyBlock
                      key={block.id}
                      block={block}
                      blockIndex={blockIndex}
                      blocks={listBlocks}
                      selectedPlaceId={selectedPlaceId}
                      onSelectPlace={setSelectedPlaceId}
                      routeSegments={routeSegments}
                      isRouteLoading={tripRoutes.isFetching && !tripRoutes.data}
                      isRouteError={tripRoutes.isError}
                      activeEvCar={null}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      ) : null}

      {/* Itinerary — matches ItinerarySection with Accordion */}
      {itineraryBlocks.length > 0 ? (
        <section className="px-4 py-4">
          <Accordion defaultValue={["itinerary"]}>
            <AccordionItem value="itinerary" className="border-none">
              <div className="mb-6 flex items-center justify-between">
                <AccordionTrigger
                  iconSide="left"
                  className="items-center py-0 text-2xl font-bold text-foreground hover:text-primary hover:no-underline"
                >
                  Itinerary
                </AccordionTrigger>
                {tripDateLabel ? (
                  <span className="mr-6 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
                    {tripDateLabel}
                  </span>
                ) : null}
              </div>
              <AccordionContent className="pt-0">
                <div className="space-y-4 pb-10 pt-2">
                  {itineraryBlocks.map((block, blockIndex) => (
                    <ReadOnlyBlock
                      key={block.id}
                      block={block}
                      blockIndex={blockIndex}
                      blocks={itineraryBlocks}
                      selectedPlaceId={selectedPlaceId}
                      onSelectPlace={setSelectedPlaceId}
                      routeSegments={routeSegments}
                      isRouteLoading={tripRoutes.isFetching && !tripRoutes.data}
                      isRouteError={tripRoutes.isError}
                      activeEvCar={activeEvCar}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      ) : null}

      {/* Budget — matches BudgetSection */}
      {plan.budget ? <BudgetSection budget={plan.budget} /> : null}
    </section>
  );
}
