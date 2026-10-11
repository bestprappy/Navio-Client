"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { useTheme } from "next-themes";
import { ArrowLeft, Check, ChevronRight, Map, Monitor, Moon, Palette, Sun } from "lucide-react";

import { mapAppearanceAtom } from "@/components/map/map-appearance.atoms";
import { mapPalettes, mapStyleOptions, resolveMapStyle, type MapPalette } from "@/components/map/map-appearance";
import { Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function SidebarAppearance({ collapsed, className }: { collapsed: boolean; className: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [section, setSection] = useState<"appearance" | "map">("appearance");
  const [appearance, setAppearance] = useAtom(mapAppearanceAtom);
  const isDark = resolvedTheme === "dark";
  const selectedStyle = mapStyleOptions.find((option) => option.id === appearance.style)!;

  return (
    <Popover onOpenChange={(open) => { if (!open) setSection("appearance"); }}>
      <PopoverTrigger className={className} aria-label="Appearance" title={collapsed ? "Appearance" : undefined}>
        <Palette className="size-5 shrink-0" aria-hidden="true" />
        {!collapsed && "Appearance"}
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={8} className="w-80 max-w-[calc(100vw-2rem)] max-h-[min(680px,var(--available-height))] gap-0 overflow-y-auto p-4 motion-reduce:animate-none">
        {section === "appearance" ? (
          <>
            <PopoverTitle className="mb-4 text-base font-semibold">Appearance</PopoverTitle>
            <fieldset>
              <legend className="mb-2 text-xs font-medium text-muted-foreground">App mode</legend>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
                {([{ id: "light", label: "Light", icon: Sun }, { id: "dark", label: "Dark", icon: Moon }, { id: "system", label: "System", icon: Monitor }] as const).map(({ id, label, icon: Icon }) => (
                  <label key={id} className="cursor-pointer">
                    <input type="radio" name="app-mode" value={id} checked={(theme ?? "system") === id} onChange={() => setTheme(id)} className="peer sr-only" />
                    <span className="flex min-h-11 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground peer-checked:bg-popover peer-checked:text-foreground peer-checked:shadow-xs peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                      <Icon className="size-3.5" aria-hidden="true" />{label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="my-4 h-px bg-border" />
            <button type="button" onClick={() => setSection("map")} className="flex min-h-14 w-full items-center gap-3 rounded-lg px-2 text-left hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
              <Map className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="flex-1"><span className="block font-medium">Map</span><span className="text-xs text-muted-foreground">{selectedStyle.label}</span></span>
              <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setSection("appearance")} className="mb-3 flex min-h-8 w-fit items-center gap-1.5 rounded-sm text-xs text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
              <ArrowLeft className="size-3.5" aria-hidden="true" />Appearance
            </button>
            <PopoverTitle className="text-base font-semibold">Map appearance</PopoverTitle>
            <PopoverDescription className="mt-1 text-xs">Choose the backdrop for your next trip.</PopoverDescription>
            <fieldset className="mt-4">
              <legend className="mb-2 text-xs font-medium text-muted-foreground">Map style</legend>
              <div className="grid grid-cols-2 gap-2">
                {mapStyleOptions.map((option) => (
                  <label key={option.id} className="group cursor-pointer" title={option.description}>
                    <input type="radio" name="map-style" value={option.id} aria-label={option.label} checked={appearance.style === option.id}
                      onChange={() => setAppearance({ style: option.id })}
                      className="peer sr-only" />
                    <span className="relative block overflow-hidden rounded-lg border border-border peer-checked:border-primary peer-checked:ring-1 peer-checked:ring-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring">
                      <MapStyleSample palette={mapPalettes[resolveMapStyle(option.id, isDark)]} />
                      <span className="flex min-h-8 items-center justify-between gap-1 bg-popover px-2 text-xs font-medium">
                        {option.label}<Check className={cn("size-3.5 shrink-0 text-primary", appearance.style !== option.id && "invisible")} aria-hidden="true" />
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <p className="sr-only" role="status">Map set to {selectedStyle.label}.</p>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

function MapStyleSample({ palette }: { palette: MapPalette }) {
  return (
    <svg viewBox="0 0 140 52" className="h-12 w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <path fill={palette.land} d="M0 0h140v52H0z" />
      <path fill={palette.park} d="M8 6h30v19H8zM88 33h27v19H88z" />
      <path fill={palette.building} d="M47 8h18v13H47zM73 5h20v17H73zM45 36h29v16H45z" />
      <path fill={palette.water} d="M113-5c-18 17-6 27-16 40L83 58h25l17-28c8-13 2-19 15-35z" />
      <path d="M-8 32 145 19M40-4 28 57M76-4 84 58" stroke={palette.road} strokeWidth="5" fill="none" />
      <path d="M-5 53 102-6" stroke={palette.highway} strokeWidth="3" fill="none" />
      <circle cx="63" cy="26" r="4" fill={palette.label} />
      <circle cx="63" cy="26" r="1.5" fill={palette.road} />
    </svg>
  );
}
