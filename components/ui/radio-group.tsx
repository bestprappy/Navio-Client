"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props<string>) {
  return <RadioGroupPrimitive data-slot="radio-group" className={cn("grid gap-2", className)} {...props} />;
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props<string>) {
  return <RadioPrimitive.Root data-slot="radio-group-item" className={cn("relative flex size-4 shrink-0 items-center justify-center rounded-full border border-input bg-background text-primary outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-checked:border-primary disabled:cursor-not-allowed disabled:opacity-50 before:absolute before:-inset-2", className)} {...props}>
    <RadioPrimitive.Indicator data-slot="radio-group-indicator"><Circle className="size-2 fill-current" /></RadioPrimitive.Indicator>
  </RadioPrimitive.Root>;
}

export { RadioGroup, RadioGroupItem };
