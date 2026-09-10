"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function CommunityQueryError({
  error,
  onRetry,
}: {
  error: Error | null;
  onRetry?: () => void;
}) {
  if (!error) return null;
  return (
    <Card role="alert">
      <CardContent className="flex flex-wrap items-center gap-3 p-4">
        <AlertCircle
          className="size-5 shrink-0 text-destructive"
          aria-hidden="true"
        />
        <p className="min-w-0 flex-1 text-sm">{error.message}</p>
        {onRetry ? (
          <Button variant="outline" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function CommunityGroupLoading() {
  return (
    <div role="status" className="space-y-4">
      <span className="sr-only">Loading communities</span>
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
