"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useCommunityGroups,
  useCommunityIdentity,
} from "./community-group-queries";
import { CommunityQueryError } from "./community-query-state";
import { Skeleton } from "@/components/ui/skeleton";

export function CommunityMyGroups() {
  const { authenticated } = useCommunityIdentity();
  const groups = useCommunityGroups("", true);
  if (!authenticated) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your communities</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {groups.isLoading ? <Skeleton className="h-16 w-full" /> : null}
        <CommunityQueryError
          error={groups.error}
          onRetry={() => void groups.refetch()}
        />
        <ul className="space-y-2">
          {groups.data.map((group) => (
            <li key={group.id}>
              <Button
                variant="ghost"
                className="h-auto max-w-full justify-start whitespace-normal text-left"
                nativeButton={false}
                render={
                  <Link
                    href={`/community/${encodeURIComponent(group.slug!)}`}
                  />
                }
              >
                {group.name}
                {group.muted ? " (muted)" : ""}
              </Button>
            </li>
          ))}
        </ul>
        {!groups.isLoading && !groups.error && groups.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Join a community to find it here.
          </p>
        ) : null}
        {groups.hasNextPage ? (
          <Button
            variant="outline"
            disabled={groups.isFetchingNextPage}
            onClick={() => void groups.fetchNextPage()}
          >
            Load more
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
