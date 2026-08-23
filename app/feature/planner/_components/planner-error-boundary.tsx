"use client";

import type { ReactNode } from "react";
import { Component } from "react";

type PlannerErrorBoundaryProps = {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
};

type PlannerErrorBoundaryState = {
  hasError: boolean;
};

export class PlannerErrorBoundary extends Component<
  PlannerErrorBoundaryProps,
  PlannerErrorBoundaryState
> {
  state: PlannerErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PlannerErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("PlannerErrorBoundary caught a rendering error.", {
      component: "PlannerErrorBoundary",
      error,
    });
  }

  render() {
    const { hasError } = this.state;
    const { children, fallbackTitle, fallbackDescription } = this.props;

    if (hasError) {
      return (
        <section className="mx-auto my-10 max-w-3xl rounded-[var(--card-radius-lg)] border border-border bg-card p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">
            {fallbackTitle ?? "Something went wrong"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {fallbackDescription ?? "Please refresh the page and try again."}
          </p>
        </section>
      );
    }

    return children;
  }
}
