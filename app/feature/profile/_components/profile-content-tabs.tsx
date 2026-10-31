"use client";

import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Map as MapIcon, Pin, PinOff } from "lucide-react";
import Link from "next/link";

import { CommunityPostCard } from "@/app/feature/community/_components/community-post-card";
import { SharedPlanCard } from "@/app/feature/explore/_components/shared-plans/shared-plan-card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button.variants";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { listProfilePlans, listProfilePosts, setPlanPinned, setPostPinned, socialKeys } from "@/lib/social-api";
import { cn } from "@/lib/utils";

type ProfileContentTabsProps = {
  accountId: string;
  name: string;
  isOwner: boolean;
};

/** Public posts and shared plans, pinned first. Only the owner sees pin controls. */
export function ProfileContentTabs({ accountId, name, isOwner }: ProfileContentTabsProps) {
  return (
    <Tabs defaultValue="posts" className="mt-6">
      <TabsList variant="line" className="h-10 border-b border-border w-full justify-start rounded-none">
        <TabsTrigger value="posts" className="h-10 px-3"><FileText aria-hidden="true" />Posts</TabsTrigger>
        <TabsTrigger value="plans" className="h-10 px-3"><MapIcon aria-hidden="true" />Shared plans</TabsTrigger>
      </TabsList>
      <TabsContent value="posts" className="pt-4">
        <PostsTab accountId={accountId} name={name} isOwner={isOwner} />
      </TabsContent>
      <TabsContent value="plans" className="pt-4">
        <PlansTab accountId={accountId} name={name} isOwner={isOwner} />
      </TabsContent>
    </Tabs>
  );
}

function PinnedLabel() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
      <Pin aria-hidden="true" className="size-3" />
      Pinned
    </span>
  );
}

function PinButton({ pinned, pending, onToggle, label }: { pinned: boolean; pending: boolean; onToggle: () => void; label: string }) {
  return (
    <Button type="button" variant="ghost" className="h-8 px-2 text-xs text-muted-foreground" disabled={pending}
      aria-label={pinned ? `Unpin ${label}` : `Pin ${label} to your profile`} onClick={onToggle}>
      {pinned ? <PinOff aria-hidden="true" /> : <Pin aria-hidden="true" />}
      {pinned ? "Unpin" : "Pin"}
    </Button>
  );
}

function TabState({ loading, error, onRetry, empty, emptyText, emptyAction }: {
  loading: boolean; error: Error | null; onRetry: () => void; empty: boolean; emptyText: string; emptyAction?: React.ReactNode;
}) {
  if (loading) return <div className="flex flex-col gap-3">{[0, 1, 2].map((row) => <Skeleton key={row} className="h-28 w-full" />)}</div>;
  if (error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-[var(--card-radius-md)] border border-border bg-card p-5 text-sm text-muted-foreground">
        {error.message}
        <Button type="button" variant="outline" className="h-10 px-4" onClick={onRetry}>Try again</Button>
      </div>
    );
  }
  if (empty) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-[var(--card-radius-md)] border border-dashed border-border p-6 text-sm text-muted-foreground">
        {emptyText}
        {emptyAction}
      </div>
    );
  }
  return null;
}

function PostsTab({ accountId, name, isOwner }: ProfileContentTabsProps) {
  const client = useQueryClient();
  const posts = useInfiniteQuery({
    queryKey: socialKeys.posts(accountId),
    queryFn: ({ pageParam, signal }) => listProfilePosts(accountId, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
  });
  const pin = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => setPostPinned(id, pinned),
    onSettled: () => client.invalidateQueries({ queryKey: socialKeys.posts(accountId) }),
    onError: (error) => console.error("Post pin failed.", { component: "PostsTab", error }),
  });
  const rows = posts.data?.pages.flatMap((page) => page.content) ?? [];

  const state = (
    <TabState loading={posts.isPending} error={posts.error} onRetry={() => void posts.refetch()} empty={!posts.isPending && !posts.error && rows.length === 0}
      emptyText={isOwner ? "You haven't posted in a community yet." : `${name} hasn't posted publicly yet.`}
      emptyAction={isOwner ? <Link href="/community" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}>Go to Community</Link> : undefined} />
  );
  if (posts.isPending || posts.error || rows.length === 0) return state;

  return (
    <div className="flex flex-col gap-2">
      {pin.isError ? <p role="alert" className="text-sm text-destructive">{pin.error.message}</p> : null}
      <ul role="list" className="flex flex-col divide-y divide-border rounded-[var(--card-radius-md)] border border-border bg-card">
        {rows.map(({ post, pinned }) => (
          <li key={post.id} className="py-1">
            {pinned || isOwner ? (
              <div className="flex items-center justify-between gap-2 px-3 pt-2 sm:px-4">
                {pinned ? <PinnedLabel /> : <span />}
                {isOwner ? <PinButton pinned={pinned} pending={pin.isPending} label={post.title} onToggle={() => pin.mutate({ id: post.id, pinned: !pinned })} /> : null}
              </div>
            ) : null}
            <CommunityPostCard post={post} group={null} showJoinAction={false} />
          </li>
        ))}
      </ul>
      {posts.hasNextPage ? (
        <Button type="button" variant="outline" className="h-10 w-fit px-4" disabled={posts.isFetchingNextPage} onClick={() => void posts.fetchNextPage()}>
          {posts.isFetchingNextPage ? "Loading…" : "Show more posts"}
        </Button>
      ) : null}
    </div>
  );
}

function PlansTab({ accountId, name, isOwner }: ProfileContentTabsProps) {
  const client = useQueryClient();
  const plans = useInfiniteQuery({
    queryKey: socialKeys.plans(accountId),
    queryFn: ({ pageParam, signal }) => listProfilePlans(accountId, pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
  });
  const pin = useMutation({
    mutationFn: ({ token, pinned }: { token: string; pinned: boolean }) => setPlanPinned(token, pinned),
    onSettled: () => client.invalidateQueries({ queryKey: socialKeys.plans(accountId) }),
    onError: (error) => console.error("Plan pin failed.", { component: "PlansTab", error }),
  });
  const rows = plans.data?.pages.flatMap((page) => page.content) ?? [];

  if (plans.isPending || plans.error || rows.length === 0) {
    return (
      <TabState loading={plans.isPending} error={plans.error} onRetry={() => void plans.refetch()} empty={!plans.isPending && !plans.error && rows.length === 0}
        emptyText={isOwner
          ? "Plans you list on Explore with your name shown appear here. Link-only shares stay private."
          : `${name} hasn't shared any plans publicly yet.`}
        emptyAction={isOwner ? <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}>Open your trips</Link> : undefined} />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {pin.isError ? <p role="alert" className="text-sm text-destructive">{pin.error.message}</p> : null}
      <ul role="list" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ plan, pinned }) => (
          <li key={plan.token} className="flex flex-col gap-2">
            {pinned || isOwner ? (
              <div className="flex min-h-8 items-center justify-between gap-2">
                {pinned ? <PinnedLabel /> : <span />}
                {isOwner ? <PinButton pinned={pinned} pending={pin.isPending} label={plan.title ?? "this plan"} onToggle={() => pin.mutate({ token: plan.token, pinned: !pinned })} /> : null}
              </div>
            ) : null}
            <SharedPlanCard plan={plan} />
          </li>
        ))}
      </ul>
      {plans.hasNextPage ? (
        <Button type="button" variant="outline" className="h-10 w-fit px-4" disabled={plans.isFetchingNextPage} onClick={() => void plans.fetchNextPage()}>
          {plans.isFetchingNextPage ? "Loading…" : "Show more plans"}
        </Button>
      ) : null}
    </div>
  );
}
