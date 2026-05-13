"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CommunityErrorBoundaryProps = {
  children: ReactNode;
  fallbackTitle?: string;
};

type CommunityErrorBoundaryState = {
  hasError: boolean;
};

export class CommunityErrorBoundary extends Component<
  CommunityErrorBoundaryProps,
  CommunityErrorBoundaryState
> {
  state: CommunityErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): CommunityErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Community feature failed to render.", {
      component: "CommunityErrorBoundary",
      operation: "componentDidCatch",
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>
              {this.props.fallbackTitle ?? "Community could not load"}
            </CardTitle>
            <CardDescription>
              Refresh the page and try again. Your mock session data may need to
              be recreated.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The rest of Navio is still available from the sidebar.
            </p>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
