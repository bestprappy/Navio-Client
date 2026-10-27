"use client";

import type { ReactElement, ReactNode, ComponentProps } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: ReactElement | null;
  finalFocus?: ComponentProps<typeof DialogContent>["finalFocus"];
  title: string;
  description: string;
  children: ReactNode;
  desktop?: "dialog" | "popover";
};

/** One accessible picker: an anchored panel or dialog on desktop, a sheet on mobile. */
export function ResponsivePicker({
  open,
  onOpenChange,
  trigger,
  finalFocus,
  title,
  description,
  children,
  desktop = "dialog",
}: Props) {
  const mobile = useIsMobile();
  if (mobile)
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        {trigger && <SheetTrigger render={trigger} />}
        <SheetContent
          finalFocus={finalFocus}
          side="bottom"
          className="max-h-[85dvh] overflow-y-auto rounded-t-2xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
        >
          <div className="space-y-2 pr-7">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description}</SheetDescription>
          </div>
          {children}
        </SheetContent>
      </Sheet>
    );
  if (desktop === "popover")
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        {trigger && <PopoverTrigger render={trigger} />}
        <PopoverContent
          finalFocus={finalFocus}
          align="end"
          className="w-[min(24rem,calc(100vw-2rem))] max-h-[min(34rem,var(--available-height))] overflow-y-auto p-4"
        >
          <div className="space-y-1">
            <PopoverTitle>{title}</PopoverTitle>
            <PopoverDescription>{description}</PopoverDescription>
          </div>
          {children}
        </PopoverContent>
      </Popover>
    );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent finalFocus={finalFocus} className="max-h-[85dvh] overflow-y-auto rounded-2xl p-5 sm:max-w-lg">
        <div className="space-y-2 pr-7">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}
