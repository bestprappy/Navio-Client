import { getDistanceKm } from "../constants/place.data";
import {
  isEvChargerPlaceItem,
  isPlaceItem,
  type PlaceItem,
  type PlaceSearchResult,
  type TripBlockItem,
} from "../constants/types";
import { DEFAULT_DAY_START_MINUTE, formatClockMinute, isFixedTime, parseClockMinute } from "../itinerary/day-timing";
import { typicalVisitMinutes } from "../itinerary/visit-length";
import { getPlaceTagCategory, type PlaceTagCategory } from "../place/place-tag-category";
import { fitVisit, getOpeningWindows, type OpeningWindow } from "./opening-hours";

export type AutoPlanMode = "drive" | "transit" | "walk";
export type AutoPlanSettings = {
  startMinute: number;
  endMinute: number;
  mode: AutoPlanMode;
  /** Times the traveller set stay where they are; off lets Auto plan move them too. */
  keepSetTimes: boolean;
};
type Point = { lat: number; lng: number };

/**
 * - `plan`: put in order and given a time.
 * - `follow`: stations, parking and chargers stay right after the place they followed.
 * - `last`: a hotel stays at the end of the day.
 */
export type AutoPlanRole = "plan" | "follow" | "last";
export type AutoPlanStopKind = "visit" | "meal" | "cafe" | "evening";

export type AutoPlanPlace = {
  item: PlaceItem;
  kind: AutoPlanStopKind;
  category: PlaceTagCategory;
  duration: number;
  /** Opening windows on the day's date: `[]` closed, `null` unknown. */
  hours: readonly OpeningWindow[] | null;
};

/**
 * Why a stop gets a fixed time once applied, so Calculate times keeps lunch at lunchtime,
 * never moves a stop before it opens, and keeps a later start than its usual 9:00 AM.
 */
export type AutoPlanPin = "yours" | "start" | "meal" | "opening" | null;

export type PlannedStop = {
  itemId: string;
  name: string;
  kind: AutoPlanStopKind;
  category: PlaceTagCategory;
  start: number;
  end: number;
  travelMinutes: number;
  distanceKm: number;
  /** Time spent waiting for the place to open or for a mealtime. */
  waitMinutes: number;
  /** How late the traveller reaches a time they set. */
  lateMinutes: number;
  meal: "lunch" | "dinner" | null;
  pin: AutoPlanPin;
  hours: readonly OpeningWindow[] | null;
};

export type UnplannedReason = "closed" | "hours" | "time";
export type UnplannedStop = {
  itemId: string;
  name: string;
  reason: UnplannedReason;
  hours: readonly OpeningWindow[] | null;
};

export type DayAutoPlan = {
  stops: PlannedStop[];
  unplanned: UnplannedStop[];
  /** Places that keep their spot: stations and chargers follow, hotels end the day. */
  followCount: number;
  lastIds: string[];
  travelMinutes: number;
  returnMinutes: number;
  returnDistanceKm: number;
  /** Estimated travel for the day in the order it has now, for comparison. */
  currentTravelMinutes: number;
  settings: AutoPlanSettings;
};

export type DayAutoPlanInput = {
  items: readonly TripBlockItem[];
  date: string;
  /** Live place details by item id, for opening hours and type. */
  details: ReadonlyMap<string, PlaceSearchResult | undefined>;
  start: Point | null;
  end: Point | null;
  settings: AutoPlanSettings;
};

const FOLLOW: ReadonlySet<PlaceTagCategory> = new Set(["rail", "bus", "airport", "ferry", "parking", "charging"]);
const MEALS = [
  { meal: "lunch", first: 11 * 60 + 30, last: 14 * 60, ideal: 12 * 60 + 30 },
  { meal: "dinner", first: 17 * 60 + 30, last: 20 * 60 + 30, ideal: 19 * 60 },
] as const;
const EVENING = 17 * 60;
const UNPLANNED_COST = 5000;
const LATE_COST = 40;

/** Geographic estimate with a detour allowance plus parking or station time. */
export function estimateTravel(from: Point, to: Point, mode: AutoPlanMode): { minutes: number; distanceKm: number } {
  const distanceKm = getDistanceKm(from, to);
  const walk = distanceKm * 1.3 / 4.6 * 60 + 2;
  const minutes = mode === "walk" || distanceKm < 0.5 ? walk
    : mode === "transit" ? Math.min(walk, distanceKm * 1.3 / 20 * 60 + 12)
      : distanceKm * 1.35 / 28 * 60 + 8;
  return { minutes: Math.max(distanceKm < 0.05 ? 0 : 3, Math.ceil(minutes)), distanceKm };
}

/** The way most of the day is already travelled, or driving. */
export function defaultAutoPlanMode(items: readonly TripBlockItem[]): AutoPlanMode {
  const counts = { drive: 0, transit: 0, walk: 0 };
  for (const item of items) {
    if (!isPlaceItem(item) || !item.arrivalMode) continue;
    const mode = item.arrivalMode === "walk" ? "walk" : ["transit", "rail", "bus"].includes(item.arrivalMode) ? "transit" : "drive";
    counts[mode]++;
  }
  return counts.transit > counts.drive && counts.transit >= counts.walk ? "transit"
    : counts.walk > counts.drive ? "walk" : "drive";
}

/** Minutes the traveller gave this visit by setting both ends of its time. */
function setDuration(item: PlaceItem): number | null {
  if (item.timeSource === "calculated") return null;
  const start = parseClockMinute(item.time);
  const end = parseClockMinute(item.timeEnd);
  return start !== null && end !== null && end - start >= 10 ? end - start : null;
}

export function classifyDayPlace(item: PlaceItem, detail: PlaceSearchResult | undefined, date: string): { role: AutoPlanRole; place: AutoPlanPlace } {
  const category = isEvChargerPlaceItem(item) ? "charging" : getPlaceTagCategory(detail?.primaryType ?? item.placeType, detail?.category ?? "");
  const kind: AutoPlanStopKind = category === "restaurant" ? "meal"
    : category === "cafe" || category === "bakery" ? "cafe"
      : category === "bar" ? "evening" : "visit";
  const role: AutoPlanRole = FOLLOW.has(category) ? "follow" : category === "lodging" ? "last" : "plan";
  return {
    role,
    place: {
      item,
      kind,
      category,
      duration: setDuration(item) ?? typicalVisitMinutes(category),
      hours: detail ? getOpeningWindows(detail, date) : null,
    },
  };
}

type Leg = { minutes: number; distanceKm: number };
type Context = {
  settings: AutoPlanSettings;
  hasStart: boolean;
  hasEnd: boolean;
  fixedStart: ReadonlyMap<string, number>;
  leg: (from: string | null, to: string) => Leg;
};
type Placement = { start: number; meal: PlannedStop["meal"]; penalty: number };
type SimStop = { place: AutoPlanPlace; start: number; leg: Leg; wait: number; late: number; meal: PlannedStop["meal"] };
type Simulation = { stops: SimStop[]; skipped: AutoPlanPlace[]; cost: number; travel: number; returnLeg: Leg };

const START = "\u0000start";
const END = "\u0000end";

function place(stop: AutoPlanPlace, arrival: number, latestEnd: number, taken: ReadonlySet<string>): Placement | null {
  const { duration, hours } = stop;
  if (stop.kind === "meal") {
    for (const window of MEALS) {
      if (taken.has(window.meal)) continue;
      const start = fitVisit(hours, Math.max(arrival, window.first), duration, Math.min(latestEnd, window.last + duration));
      if (start !== null) return { start, meal: window.meal, penalty: Math.abs(start - window.ideal) * 0.15 };
    }
    // Lunch and dinner are taken or out of reach: still a stop, just not a meal.
    const start = fitVisit(hours, arrival, duration, latestEnd);
    return start === null ? null : { start, meal: null, penalty: 90 };
  }
  if (stop.kind === "evening") {
    // Without hours, assume a bar is an evening place rather than opening at breakfast.
    const start = fitVisit(hours, hours === null ? Math.max(arrival, EVENING) : arrival, duration, latestEnd)
      ?? (hours === null ? fitVisit(null, arrival, duration, latestEnd) : null);
    return start === null ? null : { start, meal: null, penalty: Math.max(0, EVENING - start) * 0.5 };
  }
  const start = fitVisit(hours, arrival, duration, latestEnd);
  return start === null ? null : { start, meal: null, penalty: 0 };
}

function simulate(order: readonly AutoPlanPlace[], context: Context): Simulation {
  const { settings, fixedStart, leg } = context;
  const stops: SimStop[] = [];
  const skipped: AutoPlanPlace[] = [];
  const taken = new Set<string>();
  let clock = settings.startMinute;
  let from: string | null = context.hasStart ? START : null;
  let cost = 0;
  let travel = 0;
  const nextFixed: (AutoPlanPlace | undefined)[] = [];
  for (let index = order.length - 1, next: AutoPlanPlace | undefined; index >= 0; index--) {
    nextFixed[index] = next;
    if (fixedStart.has(order[index].item.id)) next = order[index];
  }

  order.forEach((stop, index) => {
    const id = stop.item.id;
    const into = leg(from, id);
    const arrival = clock + into.minutes;
    const fixed = fixedStart.get(id);
    if (fixed !== undefined) {
      const late = Math.max(0, arrival - fixed);
      stops.push({ place: stop, start: fixed, leg: into, wait: Math.max(0, fixed - arrival), late, meal: null });
      cost += into.minutes + late * LATE_COST;
      travel += into.minutes;
      clock = Math.max(fixed, arrival) + stop.duration;
      from = id;
      return;
    }
    let latestEnd = settings.endMinute - (context.hasEnd ? leg(id, END).minutes : 0);
    // Never make the traveller late for the next time they set.
    const next = nextFixed[index];
    if (next) latestEnd = Math.min(latestEnd, fixedStart.get(next.item.id)! - leg(id, next.item.id).minutes);
    const placement = place(stop, arrival, latestEnd, taken);
    if (!placement) {
      skipped.push(stop);
      return;
    }
    const wait = placement.start - arrival;
    if (placement.meal) taken.add(placement.meal);
    stops.push({ place: stop, start: placement.start, leg: into, wait, late: 0, meal: placement.meal });
    // Idle time costs about the same anywhere, so the morning is never left empty for lunch;
    // a late first stop costs slightly more, so the day starts when the traveller asked.
    cost += into.minutes + wait * (stops.length === 1 ? 0.9 : 0.8) + placement.penalty;
    travel += into.minutes;
    clock = placement.start + stop.duration;
    from = id;
  });

  const returnLeg = context.hasEnd && from !== null && from !== START ? leg(from, END) : { minutes: 0, distanceKm: 0 };
  cost += returnLeg.minutes + skipped.length * UNPLANNED_COST;
  return { stops, skipped, cost, travel, returnLeg };
}

function nearestNeighbour(places: readonly AutoPlanPlace[], context: Context): AutoPlanPlace[] {
  const left = [...places];
  const order: AutoPlanPlace[] = [];
  let from: string | null = context.hasStart ? START : null;
  while (left.length) {
    let best = 0;
    // Without a start, begin with the place farthest out so the day sweeps in one direction.
    const score = (candidate: AutoPlanPlace) => from === null
      ? -left.reduce((sum, other) => sum + context.leg(candidate.item.id, other.item.id).distanceKm, 0)
      : context.leg(from, candidate.item.id).distanceKm;
    left.forEach((candidate, index) => { if (score(candidate) < score(left[best])) best = index; });
    const [next] = left.splice(best, 1);
    order.push(next);
    from = next.item.id;
  }
  return order;
}

function cheapestInsertion(seed: readonly AutoPlanPlace[], fixed: readonly AutoPlanPlace[], context: Context): AutoPlanPlace[] {
  let order = [...fixed];
  for (const stop of seed) {
    let best: AutoPlanPlace[] | null = null;
    let bestCost = Infinity;
    for (let index = 0; index <= order.length; index++) {
      const candidate = order.toSpliced(index, 0, stop);
      const { cost } = simulate(candidate, context);
      if (cost < bestCost - 1e-9) { best = candidate; bestCost = cost; }
    }
    order = best!;
  }
  return order;
}

/** Relocates single stops and reverses runs between set times until nothing improves. */
function improve(start: AutoPlanPlace[], context: Context): { order: AutoPlanPlace[]; cost: number } {
  let order = start;
  let cost = simulate(order, context).cost;
  const isFixed = (stop: AutoPlanPlace) => context.fixedStart.has(stop.item.id);
  for (let pass = 0; pass < 40; pass++) {
    let improved = false;
    for (let from = 0; from < order.length; from++) {
      if (isFixed(order[from])) continue;
      const without = order.toSpliced(from, 1);
      for (let to = 0; to <= without.length; to++) {
        if (to === from) continue;
        const candidate = without.toSpliced(to, 0, order[from]);
        const next = simulate(candidate, context).cost;
        if (next < cost - 1e-9) { order = candidate; cost = next; improved = true; break; }
      }
    }
    if (order.length <= 40) {
      for (let a = 0; a < order.length - 1; a++) {
        if (isFixed(order[a])) continue;
        for (let b = a + 1; b < order.length; b++) {
          if (isFixed(order[b])) break;
          const candidate = [...order.slice(0, a), ...order.slice(a, b + 1).reverse(), ...order.slice(b + 1)];
          const next = simulate(candidate, context).cost;
          if (next < cost - 1e-9) { order = candidate; cost = next; improved = true; }
        }
      }
    }
    if (!improved) break;
  }
  return { order, cost };
}

function closingMinute(stop: AutoPlanPlace): number {
  return stop.hours?.length ? Math.max(...stop.hours.map(([, close]) => close)) : Infinity;
}

function unplannedReason(stop: AutoPlanPlace, settings: AutoPlanSettings): UnplannedReason {
  if (stop.hours && !stop.hours.length) return "closed";
  if (stop.hours && fitVisit(stop.hours, settings.startMinute, stop.duration, settings.endMinute) === null) return "hours";
  return "time";
}

/** The day's place items split by how Auto plan treats them. */
export function classifyDayPlaces(items: readonly TripBlockItem[], details: DayAutoPlanInput["details"], date: string) {
  const plan: AutoPlanPlace[] = [];
  const last: string[] = [];
  let followCount = 0;
  for (const item of items) {
    if (!isPlaceItem(item)) continue;
    const { role, place: stop } = classifyDayPlace(item, details.get(item.id), date);
    if (role === "plan") plan.push(stop);
    else if (role === "last") last.push(item.id);
    else followCount++;
  }
  return { plan, last, followCount };
}

/**
 * Orders the day's places so nearby ones are visited together, restaurants land at lunch
 * and dinner, and every stop is open for its whole visit. Times the traveller set are kept,
 * and nothing is made late for them. Travel is a geographic estimate.
 */
export function buildDayAutoPlan(input: DayAutoPlanInput): DayAutoPlan {
  const { settings } = input;
  const { plan: places, last, followCount } = classifyDayPlaces(input.items, input.details, input.date);
  const fixedStart = new Map<string, number>();
  if (settings.keepSetTimes) {
    for (const stop of places) if (isFixedTime(stop.item)) fixedStart.set(stop.item.id, parseClockMinute(stop.item.time)!);
  }
  const points = new Map<string, Point>(places.map((stop) => [stop.item.id, stop.item]));
  if (input.start) points.set(START, input.start);
  if (input.end) points.set(END, input.end);
  const legs = new Map<string, Leg>();
  const context: Context = {
    settings,
    hasStart: input.start !== null,
    hasEnd: input.end !== null,
    fixedStart,
    leg(from, to) {
      if (from === null) return { minutes: 0, distanceKm: 0 };
      const key = `${from}\u0001${to}`;
      let leg = legs.get(key);
      if (!leg) legs.set(key, leg = estimateTravel(points.get(from)!, points.get(to)!, settings.mode));
      return leg;
    },
  };

  const fixed = places.filter((stop) => fixedStart.has(stop.item.id)).toSorted((a, b) => fixedStart.get(a.item.id)! - fixedStart.get(b.item.id)!);
  const free = places.filter((stop) => !fixedStart.has(stop.item.id));
  const seeds = [nearestNeighbour(free, context), free, free.toSorted((a, b) => closingMinute(a) - closingMinute(b))];
  let best: { order: AutoPlanPlace[]; cost: number } | null = null;
  for (const seed of places.length > 30 ? seeds.slice(0, 1) : seeds) {
    const result = improve(cheapestInsertion(seed, fixed, context), context);
    if (!best || result.cost < best.cost - 1e-9) best = result;
  }
  const simulation = simulate(best?.order ?? [], context);
  // The day as it is now, ignoring hours: only the distance travelled is compared.
  const currentIds = places.map((stop) => stop.item.id);
  const currentTravel = currentIds.reduce((sum, id, index) => sum + context.leg(index ? currentIds[index - 1] : context.hasStart ? START : null, id).minutes, 0)
    + (context.hasEnd && currentIds.length ? context.leg(currentIds.at(-1)!, END).minutes : 0);

  const stops = simulation.stops.map((stop, index): PlannedStop => {
    const fromStart = index === 0 && context.hasStart ? stop.leg.minutes : 0;
    const pin: AutoPlanPin = fixedStart.has(stop.place.item.id) ? "yours"
      : stop.meal ? "meal"
        : index === 0 ? (stop.start === DEFAULT_DAY_START_MINUTE + fromStart ? null : "start")
          : stop.wait > 0 ? "opening" : null;
    return {
      itemId: stop.place.item.id,
      name: stop.place.item.name,
      kind: stop.place.kind,
      category: stop.place.category,
      start: stop.start,
      end: stop.start + stop.place.duration,
      travelMinutes: stop.leg.minutes,
      distanceKm: stop.leg.distanceKm,
      waitMinutes: stop.wait,
      lateMinutes: stop.late,
      meal: stop.meal,
      pin,
      hours: stop.place.hours,
    };
  });

  return {
    stops,
    unplanned: simulation.skipped.map((stop) => ({
      itemId: stop.item.id,
      name: stop.item.name,
      reason: unplannedReason(stop, settings),
      hours: stop.hours,
    })),
    followCount,
    lastIds: last,
    travelMinutes: simulation.travel + simulation.returnLeg.minutes,
    returnMinutes: simulation.returnLeg.minutes,
    returnDistanceKm: simulation.returnLeg.distanceKm,
    currentTravelMinutes: currentTravel,
    settings,
  };
}

/**
 * The day's items in planned order. Notes, checklists, stations and chargers stay right after
 * the place they followed; hotels stay last. Places that did not fit lose their time and either
 * stay at the end of the day or come back in `moved` for another day.
 */
export function arrangeDayItems(items: readonly TripBlockItem[], plan: DayAutoPlan, keepUnplanned: boolean): { items: TripBlockItem[]; moved: TripBlockItem[] } {
  const stops = new Map(plan.stops.map((stop) => [stop.itemId, stop]));
  const unplanned = new Set(plan.unplanned.map((stop) => stop.itemId));
  const heads = new Set([...stops.keys(), ...unplanned, ...plan.lastIds]);
  const leading: TripBlockItem[] = [];
  const groups = new Map<string, TripBlockItem[]>();
  let current: TripBlockItem[] | null = null;
  for (const item of items) {
    if (isPlaceItem(item) && heads.has(item.id)) groups.set(item.id, current = [item]);
    else if (current) current.push(item);
    else leading.push(item);
  }

  const timed = (group: TripBlockItem[]): TripBlockItem[] => {
    const [head, ...rest] = group;
    const stop = stops.get(head.id);
    if (!stop || !isPlaceItem(head) || stop.pin === "yours") return group;
    return [{
      ...head,
      time: formatClockMinute(stop.start),
      timeEnd: formatClockMinute(stop.end),
      timeSource: stop.pin ? "fixed" : "calculated",
    }, ...rest];
  };
  const untimed = (group: TripBlockItem[]): TripBlockItem[] => {
    const [head, ...rest] = group;
    return isPlaceItem(head) ? [{ ...head, time: undefined, timeEnd: undefined, timeSource: null }, ...rest] : group;
  };
  const groupOf = (id: string) => groups.get(id) ?? [];

  const left = plan.unplanned.flatMap((stop) => untimed(groupOf(stop.itemId)));
  return {
    items: [
      ...leading,
      ...plan.stops.flatMap((stop) => timed(groupOf(stop.itemId))),
      ...(keepUnplanned ? left : []),
      ...plan.lastIds.flatMap(groupOf),
    ],
    moved: keepUnplanned ? [] : left,
  };
}
