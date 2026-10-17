"use client";

import { useId, useState } from "react";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 12 }, (_, index) => {
  const value = String(index + 1).padStart(2, "0");
  return { value, label: value };
});
const MINUTES = Array.from({ length: 60 }, (_, index) => {
  const value = String(index).padStart(2, "0");
  return { value, label: value };
});
const PERIODS = [{ value: "AM", label: "AM" }, { value: "PM", label: "PM" }];

type TimePickerProps = {
  id?: string;
  label: string;
  /** A 24-hour HH:mm value; the control displays a 12-hour clock. */
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

function TimePart({ id, label, value, items, onValueChange }: {
  id: string;
  label: string;
  value: string;
  items: { value: string; label: string }[];
  onValueChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} items={items} onValueChange={(next) => { if (next !== null) onValueChange(next); }}>
        <SelectTrigger id={id} className="w-full tabular-nums data-[size=default]:h-10"><SelectValue /></SelectTrigger>
        <SelectContent alignItemWithTrigger={false} className="max-h-64 min-w-0">
          {items.map((item) => <SelectItem key={item.value} value={item.value} className="py-2">{item.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

/** A themed time control composed from shadcn Popover, Select and Button. */
export function TimePicker({ id, label, value, onValueChange, className, disabled, ...ariaProps }: TimePickerProps) {
  const generatedId = useId();
  const [open, setOpen] = useState(false);
  const valid = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  const [hour24, minute] = (valid ? value : "09:00").split(":");
  const hour = String(Number(hour24) % 12 || 12).padStart(2, "0");
  const period = Number(hour24) >= 12 ? "PM" : "AM";
  const display = valid ? `${Number(hour)}:${minute} ${period}` : "Choose time";

  function update(nextHour: string, nextMinute: string, nextPeriod: string) {
    const nextHour24 = Number(nextHour) % 12 + (nextPeriod === "PM" ? 12 : 0);
    onValueChange(`${String(nextHour24).padStart(2, "0")}:${nextMinute}`);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={<Button type="button" variant="outline" />}
        id={id ?? generatedId}
        disabled={disabled}
        aria-label={`${label}, ${display}. Choose time`}
        className={cn("h-10 w-full min-w-0 justify-between gap-2 px-3 text-xs tabular-nums", className)}
        {...ariaProps}
      >
        <span>{display}</span>
        <Clock aria-hidden="true" className="size-4 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 max-w-[calc(100vw-1rem)] gap-4 p-4">
        <PopoverTitle>{label}</PopoverTitle>
        <div className="grid grid-cols-3 gap-2">
          <TimePart id={`${generatedId}-hour`} label="Hour" value={hour} items={HOURS} onValueChange={(next) => update(next, minute, period)} />
          <TimePart id={`${generatedId}-minute`} label="Minute" value={minute} items={MINUTES} onValueChange={(next) => update(hour, next, period)} />
          <TimePart id={`${generatedId}-period`} label="AM / PM" value={period} items={PERIODS} onValueChange={(next) => update(hour, minute, next)} />
        </div>
        <Button type="button" variant="secondary" className="h-10 w-full" onClick={() => setOpen(false)}>Done</Button>
      </PopoverContent>
    </Popover>
  );
}
