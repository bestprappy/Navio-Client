"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DateRangePickerProps = {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  startPlaceholder?: string
  endPlaceholder?: string
  disabled?: boolean
  className?: string
}

export function DateRangePicker({
  value,
  onChange,
  startPlaceholder = "Start date",
  endPlaceholder = "End date",
  disabled = false,
  className,
}: DateRangePickerProps) {
  const [internal, setInternal] = React.useState<DateRange | undefined>()
  const range = value ?? internal
  const setRange = onChange ?? setInternal

  const formattedFrom = range?.from ? format(range.from, "MMM d, yyyy") : null
  const formattedTo = range?.to ? format(range.to, "MMM d, yyyy") : null

  const triggerClass =
    "flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm text-left transition-colors hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50"

  return (
    <Popover>
      <div
        className={cn(
          "grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center",
          className
        )}
      >
        <PopoverTrigger
          render={
            <button
              type="button"
              className={triggerClass}
              aria-label={startPlaceholder}
              disabled={disabled}
            />
          }
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn(!formattedFrom && "text-muted-foreground")}>
            {formattedFrom ?? startPlaceholder}
          </span>
        </PopoverTrigger>

        <div className="hidden h-6 w-px bg-border sm:block" />

        <PopoverTrigger
          render={
            <button
              type="button"
              className={triggerClass}
              aria-label={endPlaceholder}
              disabled={disabled}
            />
          }
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className={cn(!formattedTo && "text-muted-foreground")}>
            {formattedTo ?? endPlaceholder}
          </span>
        </PopoverTrigger>
      </div>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={setRange}
          numberOfMonths={1}
          disabled={{ before: new Date() }}
        />
      </PopoverContent>
    </Popover>
  )
}
