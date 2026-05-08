"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

type TripBuilderErrorBoundaryProps = {
  children: ReactNode;
};

type TripBuilderErrorBoundaryState = {
  hasError: boolean;
};

export class TripBuilderErrorBoundary extends Component<
  TripBuilderErrorBoundaryProps,
  TripBuilderErrorBoundaryState
> {
  state: TripBuilderErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): TripBuilderErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Trip builder failed to render.", {
      component: "TripBuilderErrorBoundary",
      operation: "componentDidCatch",
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="m-10 rounded-sm border border-destructive/40 bg-destructive/10 p-4 text-sm text-foreground">
          <p className="font-semibold">Trip planning tools could not load.</p>
          <p className="mt-1 text-muted-foreground">
            Try reloading this panel or continue editing the rest of the trip.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 rounded-sm"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
