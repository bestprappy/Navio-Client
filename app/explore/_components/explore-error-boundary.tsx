"use client";

import type { ReactNode } from "react";
import { Component } from "react";

type ExploreErrorBoundaryProps = {
  children: ReactNode;
  fallbackTitle?: string;
};

type ExploreErrorBoundaryState = {
  hasError: boolean;
};

export class ExploreErrorBoundary extends Component<
  ExploreErrorBoundaryProps,
  ExploreErrorBoundaryState
> {
  state: ExploreErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("ExploreErrorBoundary", error);
  }

  render() {
    const { hasError } = this.state;
    const { children, fallbackTitle } = this.props;

    if (hasError) {
      return (
        <section className="rounded-2xl border border-border bg-card p-6 text-center">
          <h2 className="text-lg font-semibold text-foreground">
            {fallbackTitle ?? "Something went wrong"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please refresh and try again.
          </p>
        </section>
      );
    }

    return children;
  }
}
