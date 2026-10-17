"use client";

import { useId } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TimePicker } from "@/components/ui/time-picker";

import { AUTO_PLAN_MODE_OPTIONS } from "./auto-plan-format";
import { useAutoPlanContext } from "./auto-plan-context";
import type { AutoPlanMode } from "./day-auto-plan";

/** Start, finish and travel mode. The plan rebuilds as soon as any of them changes. */
export function AutoPlanSettings() {
  const { settings, setStart, setEnd, setMode, setKeepSetTimes } = useAutoPlanContext();
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <fieldset className="min-w-0 space-y-5">
      <legend className="mb-3 text-sm font-semibold">Plan settings</legend>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-1">
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-start`}>Start</Label>
          <TimePicker id={`${id}-start`} label="Start" value={settings.start} aria-invalid={Boolean(settings.error)} aria-describedby={settings.error ? errorId : undefined} onValueChange={setStart} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-end`}>Finish by</Label>
          <TimePicker id={`${id}-end`} label="Finish by" value={settings.end} aria-invalid={Boolean(settings.error)} aria-describedby={settings.error ? errorId : undefined} onValueChange={setEnd} />
        </div>
        <div className="col-span-2 space-y-1.5 md:col-span-1">
          <Label htmlFor={`${id}-mode`}>Getting around</Label>
          <Select<AutoPlanMode> value={settings.mode} items={AUTO_PLAN_MODE_OPTIONS} onValueChange={(next) => { if (next !== null) setMode(next); }}>
            <SelectTrigger id={`${id}-mode`} className="w-full bg-background data-[size=default]:h-10"><SelectValue /></SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {AUTO_PLAN_MODE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {settings.error ? <p id={errorId} role="alert" className="text-xs text-destructive">{settings.error}</p> : null}
      {settings.setTimeCount > 0 ? (
        <div className="flex items-start gap-3 border-t border-border pt-5">
          <Checkbox id={`${id}-keep`} checked={settings.keepSetTimes} onCheckedChange={(checked) => setKeepSetTimes(checked === true)} aria-describedby={`${id}-keep-hint`} className="mt-0.5" />
          <div className="min-w-0 space-y-1.5">
            <Label className="leading-snug" htmlFor={`${id}-keep`}>Keep {settings.setTimeCount === 1 ? "the fixed time" : `the ${settings.setTimeCount} fixed times`}</Label>
            <p id={`${id}-keep-hint`} className="text-xs leading-relaxed text-muted-foreground">Keep the times you set. Turn off to let Auto plan move them.</p>
          </div>
        </div>
      ) : null}
      <p className="text-xs leading-relaxed text-muted-foreground">The preview updates as you change these settings.</p>
    </fieldset>
  );
}
