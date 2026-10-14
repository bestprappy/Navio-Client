"use client";

import { useId } from "react";
import { CircleSlash } from "lucide-react";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { describeUnplanned } from "./auto-plan-format";
import { useAutoPlanContext } from "./auto-plan-context";
import { KEEP_ON_THIS_DAY } from "./use-day-auto-plan";

/** Places the day has no room for, and where they go instead. */
export function AutoPlanUnplanned() {
  const { plan, weekday, otherDays, moveTo, setMoveTo } = useAutoPlanContext();
  const id = useId();
  if (!plan?.unplanned.length) return null;
  const options = [{ value: KEEP_ON_THIS_DAY, label: "At the end of this day, without a time" }, ...otherDays];
  const count = plan.unplanned.length;

  return (
    <section aria-labelledby={`${id}-title`} className="space-y-4 border-t border-border pt-5">
      <h3 id={`${id}-title`} className="text-sm font-semibold text-foreground">
        {count === 1 ? "1 place doesn't fit" : `${count} places don't fit`}
      </h3>
      <ul className="space-y-3">
        {plan.unplanned.map((stop) => (
          <li key={stop.itemId} className="flex items-start gap-2 text-sm">
            <CircleSlash className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden="true" />
            <span className="min-w-0">
              <span className="font-medium text-foreground">{stop.name}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{describeUnplanned(stop, weekday, plan.settings.endMinute)}</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-move`}>Put {count === 1 ? "it" : "them"}</Label>
        <Select<string> value={moveTo} items={options} onValueChange={(next) => { if (next !== null) setMoveTo(next); }}>
          <SelectTrigger id={`${id}-move`} className="min-h-10 w-full bg-card text-left data-[size=default]:h-auto [&_[data-slot=select-value]]:whitespace-normal"><SelectValue /></SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}

/** What the plan could not check, and what stays put. */
export function AutoPlanNotes() {
  const { plan, hoursUnknown } = useAutoPlanContext();
  if (!plan?.stops.length) return null;
  const notes: string[] = [];
  const spansLunch = plan.settings.startMinute < 13 * 60 && plan.settings.endMinute > 13 * 60;
  if (spansLunch && !plan.stops.some((stop) => stop.meal)) {
    notes.push("There's no restaurant on this day. Add one from a guide or the map and Auto plan will put it at lunch or dinner.");
  }
  if (hoursUnknown.length) {
    notes.push(`Opening hours aren't available for ${hoursUnknown.length === 1 ? hoursUnknown[0] : `${hoursUnknown.length} places`}, so check before you go.`);
  }
  if (plan.followCount) notes.push("Stations and charging stops stay right after the place they followed.");
  if (plan.lastIds.length) notes.push("Your hotel stays at the end of the day.");
  if (plan.stops.some((stop) => stop.pin && stop.pin !== "yours")) {
    notes.push("Lunch, dinner and stops that wait to open get fixed times, so Calculate times keeps them there.");
  }
  notes.push("Travel is estimated from distance here. Once your routes load, the calculated times update to match them.");

  return (
    <Accordion className="border-t border-border">
      <AccordionItem value="about">
        <AccordionTrigger className="min-h-11 text-xs text-muted-foreground">About this plan</AccordionTrigger>
        <AccordionContent>
          <ul aria-label="About this plan" className="list-disc space-y-2 pl-4 text-xs leading-relaxed text-muted-foreground">
            {notes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
