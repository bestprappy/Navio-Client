"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { MousePointerClick } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";

export type Coordinate = { lat: number; lng: number };

export type PinPickerMapProps = {
  initial: Coordinate;
  point: Coordinate | null;
  onPointChange: (point: Coordinate) => void;
  /** Called when the map cannot be shown, so the form can fall back to coordinates. */
  onError: () => void;
};

function MapLoading() {
  return <Skeleton className="size-full rounded-none" />;
}

// Each provider is split into its own chunk so the Google pin picker never
// ships Mapbox's JS or stylesheet, and vice versa.
const PinPickerMapGoogle = dynamic(
  () => import("./pin-picker-map-google").then((m) => ({ default: m.PinPickerMapGoogle })),
  { ssr: false, loading: MapLoading },
);

const PinPickerMapMapbox = dynamic(
  () => import("./pin-picker-map-mapbox").then((m) => ({ default: m.PinPickerMapMapbox })),
  { ssr: false, loading: MapLoading },
);

const isMapbox = process.env.NEXT_PUBLIC_MAP_PROVIDER === "mapbox";

export function isPinMapConfigured(): boolean {
  return isMapbox
    ? Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN)
    : Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
}

type PinMapErrorBoundaryProps = { onError: () => void; children: ReactNode };

class PinMapErrorBoundary extends Component<PinMapErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Pin picker map crashed.", {
      component: "PinMapErrorBoundary",
      operation: "componentDidCatch",
      error,
      errorInfo,
    });
    this.props.onError();
  }

  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

export function PinPickerMap(props: PinPickerMapProps) {
  return (
    <div
      role="region"
      aria-label="Map for choosing a pinned location"
      className="relative h-48 w-full min-w-0 overflow-hidden rounded-lg bg-muted ring-1 ring-foreground/10 sm:h-56"
    >
      <PinMapErrorBoundary onError={props.onError}>
        {isMapbox ? <PinPickerMapMapbox {...props} /> : <PinPickerMapGoogle {...props} />}
      </PinMapErrorBoundary>
      {!props.point && (
        <p className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto flex w-fit items-center gap-1.5 rounded-full bg-popover/95 px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md ring-1 ring-foreground/10">
          <MousePointerClick className="size-3.5 text-primary" aria-hidden="true" />
          Click the map to drop a pin
        </p>
      )}
    </div>
  );
}
