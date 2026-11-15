"use client"

import * as React from "react"
import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

type SliderProps = SliderPrimitive.Root.Props & {
  /** Accessible name for each thumb's hidden input. */
  getAriaLabel?: SliderPrimitive.Thumb.Props["getAriaLabel"]
  /** Spoken value for each thumb, e.g. "140 percent". */
  getAriaValueText?: SliderPrimitive.Thumb.Props["getAriaValueText"]
}

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  getAriaLabel,
  getAriaValueText,
  ...props
}: SliderProps) {
  const thumbCount = React.useMemo(() => {
    if (Array.isArray(value)) return value.length
    if (Array.isArray(defaultValue)) return defaultValue.length
    return 1
  }, [value, defaultValue])

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      className={cn("w-full", className)}
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      thumbAlignment="edge"
      {...props}
    >
      <SliderPrimitive.Control className="relative flex h-6 w-full touch-none items-center select-none data-disabled:opacity-50">
        <SliderPrimitive.Track
          data-slot="slider-track"
          className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-foreground/15 select-none"
        >
          <SliderPrimitive.Indicator
            data-slot="slider-range"
            className="h-full bg-primary select-none"
          />
        </SliderPrimitive.Track>
        {Array.from({ length: thumbCount }, (_, index) => (
          <SliderPrimitive.Thumb
            key={index}
            index={index}
            data-slot="slider-thumb"
            getAriaLabel={getAriaLabel}
            getAriaValueText={getAriaValueText}
            className="relative block size-4 shrink-0 rounded-full border-2 border-primary bg-background shadow-sm ring-ring/40 transition-[box-shadow] select-none after:absolute after:-inset-3 hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden active:ring-4 data-disabled:pointer-events-none motion-reduce:transition-none"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { Slider }
