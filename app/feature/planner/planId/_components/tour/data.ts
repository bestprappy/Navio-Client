import type { TourDefinition } from "@/components/tour/tour.types";

/** First-time tips for `/planner/[planId]`, shown to the trip's owner. */
export const PLANNER_TOUR: TourDefinition = {
  id: "planner",
  version: 1,
  label: "Trip planner",
  summary: "A quick look at each part of the planner.",
  steps: [
    {
      title: "This is your trip planner",
      description: "Your plan and the map work together: whatever you add here appears on the map. Here's what each part does.",
    },
    {
      target: "planner.my-list",
      title: "Collect places in My List",
      description: "Save places you might visit, then move them into a day when you're ready.",
      side: "bottom",
    },
    {
      target: "planner.itinerary",
      title: "Plan your days",
      description: "Each day keeps its stops in order. Open a day to add places, notes and checklists.",
      side: "bottom",
    },
    {
      target: "planner.day-options",
      title: "Let Auto plan order a day",
      description: "Open a day's menu and choose Auto plan. It orders your places around meals and opening hours, and nothing changes until you apply it.",
      side: "left",
    },
    {
      target: "planner.garage",
      title: "Add your EV",
      description: "Choose your car in My garage so battery estimates and charging stops fit how far it can go.",
      side: "bottom",
    },
    {
      target: "planner.budget",
      title: "Keep an eye on costs",
      description: "Set a budget and add expenses to see what the trip will cost.",
      side: "top",
    },
    {
      target: "planner.trip-options",
      title: "Share your plan",
      description: "Open Trip options to publish the plan as a link, or to manage the trip.",
      side: "bottom",
      align: "end",
    },
    {
      target: "help",
      title: "More tips any time",
      description: "Show tips lists a short tour for every part of the planner. The ? beside a section starts the tours for that section.",
      side: "right",
    },
  ],
};

/*
 * Feature tours. Each teaches one part of the planner in a few steps and runs
 * only when asked, from a section's "?" or the Show tips menu. Steps inside
 * the day menu set `opens` so the tour opens it; steps that need something
 * first (places in a day, a car) carry a `fallback` that says what to do.
 */

export const PLANNER_DAYS_TOUR: TourDefinition = {
  id: "planner-days",
  version: 1,
  label: "Days and timing",
  summary: "Day colours, start and end stops, and calculated times.",
  steps: [
    {
      target: "planner.day-header",
      title: "One block per day",
      description: "Days follow your trip dates. Add places, notes and checklists inside a day, and drag them to change the order.",
      side: "bottom",
    },
    {
      target: "planner.day-anchors",
      title: "Where each day starts and ends",
      description: "Set tonight's stop, such as your hotel. The next day starts from it, so routes and battery carry on from there.",
      side: "bottom",
      fallback: {
        title: "Where each day starts and ends",
        description: "Open a day to set where it starts and tonight's stop. The next day starts from that stop.",
      },
    },
    {
      target: "planner.day-color",
      opens: "planner.day-options",
      title: "Give a day its colour",
      description: "The day's stops, pins and route on the map use this colour, so days are easy to tell apart.",
      side: "left",
    },
    {
      target: "planner.day-times",
      opens: "planner.day-options",
      title: "Calculate times",
      description: "Fills in arrival times from driving time and how long you stay at each place. Recalculate after you change the order.",
      side: "left",
      fallback: {
        title: "Calculate times",
        description: "Add a place to a day, then open the day's menu and choose Calculate times to fill in arrival times.",
      },
    },
  ],
};

export const PLANNER_AUTO_PLAN_TOUR: TourDefinition = {
  id: "planner-auto-plan",
  version: 1,
  label: "Auto plan",
  summary: "Let Navio order a day around meals and opening hours.",
  steps: [
    {
      target: "planner.add-stop",
      title: "Start with a few places",
      description: "Add the places you want to visit to the day, from search here or from My List. Auto plan works with what is in the day.",
      side: "top",
    },
    {
      target: "planner.auto-plan-action",
      opens: "planner.day-options",
      title: "Choose Auto plan",
      description: "It orders the day's places around meals and opening hours. It works on days without sections.",
      side: "left",
    },
    {
      title: "Preview before anything changes",
      description: "You see the proposed order first. Nothing changes until you choose Apply plan, and Undo stays on the day until you edit it again.",
    },
  ],
};

export const PLANNER_NOTES_TOUR: TourDefinition = {
  id: "planner-notes",
  version: 1,
  label: "Notes and checklists",
  summary: "Add notes, checklists and sections inside a day.",
  steps: [
    {
      target: "planner.day-actions",
      title: "Add to a day",
      description: "Search for a stop, or add a note, a checklist, an EV station or a new section. To put something in a particular spot, use + between items.",
      side: "top",
    },
    {
      target: "planner.add-note",
      title: "Notes",
      description: "Keep reminders, booking numbers and links right where they matter in the day.",
      side: "top",
    },
    {
      target: "planner.add-checklist",
      title: "Checklists",
      description: "Things to pack or book. Tick items off as you go.",
      side: "top",
    },
    {
      target: "planner.add-section",
      title: "Sections",
      description: "Split a long day, or start the part of the day spent in another city. Fold a section away when you don't need it.",
      side: "top",
    },
  ],
};

export const PLANNER_EV_TOUR: TourDefinition = {
  id: "planner-ev",
  version: 1,
  label: "Your EV",
  summary: "Pick your car and see the battery for every day.",
  steps: [
    {
      target: "planner.garage",
      title: "My garage",
      description: "Add your car once. Its battery and plugs set every estimate in this trip.",
      side: "bottom",
    },
    {
      target: "planner.add-vehicle",
      unless: "planner.vehicle",
      title: "Choose your car",
      description: "Choose Add vehicle and pick your model. Navio uses its battery size and plugs for every estimate.",
      side: "bottom",
    },
    {
      target: "planner.vehicle",
      title: "The car for this trip",
      description: "Set the starting battery and how Navio estimates energy use. Changes update every day's estimate.",
      side: "bottom",
    },
    {
      target: "planner.ev-usage",
      title: "Battery for each day",
      description: "See the battery at the end of every day and where it runs low. Each day starts with what the day before left.",
      side: "top",
      fallback: {
        title: "Battery for each day",
        description: "With a car chosen, add at least two places to an itinerary day to see the battery at the end of each day.",
      },
    },
  ],
};

export const PLANNER_CHARGING_TOUR: TourDefinition = {
  id: "planner-charging",
  version: 1,
  label: "Charging stops",
  summary: "Find chargers, set charging targets and plan stops.",
  steps: [
    {
      target: "planner.add-ev-station",
      unless: "planner.ev-preferences",
      title: "Open the charger list",
      description: "Choose Add EV station on a day to list chargers near it. The ? in the charger panel then shows the rest of these tips.",
      side: "top",
      fallback: {
        title: "Open the charger list",
        description: "Open a day and choose Add EV station to list chargers near it. The ? in the charger panel then shows the rest of these tips.",
      },
    },
    {
      target: "planner.ev-preferences",
      title: "Charging preferences",
      description: "These settings apply to every charging stop on this trip.",
      side: "left",
    },
    {
      target: "planner.ev-reserve",
      title: "Arrive with at least",
      description: "The lowest battery you are happy to arrive with. Plans keep you above it.",
      side: "left",
    },
    {
      target: "planner.ev-charge-target",
      title: "Charge each stop to",
      description: "Each planned stop charges to at least this level, more if the next leg needs it.",
      side: "left",
    },
    {
      target: "planner.ev-optimize",
      title: "Plan charging stops",
      description: "Checks live chargers on the road route and may add, remove or replace stops you have not locked. You review the plan before applying it.",
      side: "left",
    },
    {
      target: "planner.ev-stations",
      title: "Pick a station yourself",
      description: "Open a station to see its plugs, power and opening hours, then add it to the day. Turn on Show only compatible to hide plugs your car can't use.",
      side: "left",
    },
  ],
};

export const PLANNER_BUDGET_TOUR: TourDefinition = {
  id: "planner-budget",
  version: 1,
  label: "Budget",
  summary: "Set a budget, log expenses and see the breakdown.",
  steps: [
    {
      target: "planner.budget",
      title: "Add expenses",
      description: "Choose Add expense to log what you spend or expect to spend.",
      side: "top",
    },
    {
      target: "planner.budget-card",
      title: "Your budget at a glance",
      description: "Set a total with Edit budget and see how much is spent and how much remains.",
      side: "top",
    },
    {
      target: "planner.budget-actions",
      title: "Breakdown and settings",
      description: "View breakdown shows where the money goes. Settings changes the currency.",
      side: "left",
    },
  ],
};

export const PLANNER_SHARE_TOUR: TourDefinition = {
  id: "planner-share",
  version: 1,
  label: "Share and export",
  summary: "See the trip as a table, export it, or share a link.",
  steps: [
    {
      target: "planner.itinerary-toolbar",
      title: "Plan or Table",
      description: "Switch to Table to see every day as one sheet. From there you can export to Excel, CSV or a PDF handout.",
      side: "bottom",
    },
    {
      target: "planner.trip-options",
      title: "Share a link",
      description: "Open Trip options and choose Publish plan as a link. You decide what the link shows, and you can manage it later.",
      side: "bottom",
      align: "end",
    },
  ],
};

/** Feature tours in the order the tips menu lists them. */
export const PLANNER_FEATURE_TOURS: readonly TourDefinition[] = [
  PLANNER_DAYS_TOUR,
  PLANNER_AUTO_PLAN_TOUR,
  PLANNER_NOTES_TOUR,
  PLANNER_EV_TOUR,
  PLANNER_CHARGING_TOUR,
  PLANNER_BUDGET_TOUR,
  PLANNER_SHARE_TOUR,
];

/** The itinerary's "?" covers everything that happens inside days. */
export const ITINERARY_SECTION_TOURS: readonly TourDefinition[] = [
  PLANNER_DAYS_TOUR,
  PLANNER_AUTO_PLAN_TOUR,
  PLANNER_NOTES_TOUR,
  PLANNER_SHARE_TOUR,
];
