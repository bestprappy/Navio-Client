"use client";

import { useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { BlockDialog } from "@/components/social/block-dialog";
import { AuthorChip, useResolvedAuthor } from "@/components/social/profile-link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyProfile } from "@/hooks/use-my-profile";
import { setShowTravelPreferences } from "@/lib/profile-api";
import { getSocialSettings, listBlocked, socialKeys, updateSocialSettings } from "@/lib/social-api";
import type { ConnectionsVisibility } from "@/lib/validations/social";
import { SettingSwitch } from "../setting-switch";
import { SettingsGroup, SettingsHeader } from "../settings-section";

const VISIBILITY: { id: ConnectionsVisibility; label: string; description: string }[] = [
  { id: "everyone", label: "Everyone on Navio", description: "Any signed-in traveller can open your lists." },
  { id: "followers", label: "People who follow you", description: "Only your followers can open them." },
  { id: "only_me", label: "Only you", description: "Your counts still show; the lists don't." },
];

/** Settings > Privacy: what optional details others can see, and who you've blocked. */
export function PrivacySection() {
  const profile = useMyProfile();
  const client = useQueryClient();

  const settings = useQuery({ queryKey: socialKeys.settings, queryFn: ({ signal }) => getSocialSettings(signal) });
  const visibility = useMutation({
    mutationFn: updateSocialSettings,
    onSuccess: (saved) => client.setQueryData(socialKeys.settings, saved),
    onError: (error) => console.error("Visibility change failed.", { component: "PrivacySection", error }),
  });
  const preferences = useMutation({
    mutationFn: setShowTravelPreferences,
    onSuccess: (updated) => profile.replace(updated),
    onError: (error) => console.error("Travel preference visibility failed.", { component: "PrivacySection", error }),
  });

  return (
    <main className="flex flex-col">
      <SettingsHeader title="Privacy" description="Control the optional parts of your profile and who can reach you." />
      <div className="divide-y divide-border">
        <SettingsGroup title="Always private" description="These never appear on your profile or to other travellers.">
          <ul role="list" className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
            {["Email address", "Private and link-only plans", "Saved places and lists", "Garage and vehicles", "Browsing history", "Your live location"].map((item) => (
              <li key={item} className="flex items-center gap-2"><span aria-hidden="true" className="size-1.5 rounded-full bg-muted-foreground/50" />{item}</li>
            ))}
          </ul>
        </SettingsGroup>

        <SettingsGroup title="Travel preferences" description="Your interests and travel pace from Settings > Profile.">
          {profile.data ? (
            <>
              <SettingSwitch
                label="Show on my profile"
                description="When off, they stay saved but nobody else sees them."
                checked={profile.data.showTravelPreferences}
                disabled={preferences.isPending}
                onCheckedChange={(checked) => preferences.mutate(checked)}
              />
              {preferences.isError ? <p role="alert" className="text-sm text-destructive">{preferences.error.message}</p> : null}
            </>
          ) : <Skeleton className="h-10 w-full" />}
        </SettingsGroup>

        <SettingsGroup title="Followers and following" description="Who can open your follower and following lists.">
          {settings.data ? (
            <div className="flex flex-col gap-2">
              <RadioGroup
                value={visibility.variables ?? settings.data.connectionsVisibility}
                onValueChange={(value) => visibility.mutate(value as ConnectionsVisibility)}
                aria-label="Who can see your follower and following lists"
                className="gap-1"
              >
                {VISIBILITY.map((option) => (
                  <Label key={option.id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md px-2 py-2 font-normal hover:bg-muted/60">
                    <RadioGroupItem value={option.id} className="mt-0.5" disabled={visibility.isPending} />
                    <span className="flex flex-col">
                      <span className="font-medium text-foreground">{option.label}</span>
                      <span className="text-xs text-muted-foreground">{option.description}</span>
                    </span>
                  </Label>
                ))}
              </RadioGroup>
              {visibility.isError ? <p role="alert" className="text-sm text-destructive">{visibility.error.message}</p> : null}
            </div>
          ) : settings.isError ? (
            <Button type="button" variant="outline" className="h-10 px-4" onClick={() => void settings.refetch()}>Try again</Button>
          ) : <Skeleton className="h-24 w-full" />}
        </SettingsGroup>

        <SettingsGroup title="Blocked accounts"
          description="Blocked people can't follow you, comment on or vote on your posts, or appear in your notifications. You won't see their posts.">
          <BlockedList />
        </SettingsGroup>
      </div>
    </main>
  );
}

function BlockedList() {
  const blocked = useInfiniteQuery({
    queryKey: socialKeys.blocked,
    queryFn: ({ pageParam, signal }) => listBlocked(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (last) => (last.last ? undefined : last.number + 1),
  });

  if (blocked.isPending) return <Skeleton className="h-12 w-full" />;
  if (blocked.isError) {
    return <Button type="button" variant="outline" className="h-10 px-4" onClick={() => void blocked.refetch()}>Try again</Button>;
  }
  const rows = blocked.data.pages.flatMap((page) => page.content);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">You haven&apos;t blocked anyone.</p>;

  return (
    <div className="flex flex-col gap-3">
      <ul role="list" className="flex flex-col divide-y divide-border/60">
        {rows.map((row) => <BlockedRow key={row.accountId} accountId={row.accountId} />)}
      </ul>
      {blocked.hasNextPage ? (
        <Button type="button" variant="outline" className="h-10 w-fit px-4" disabled={blocked.isFetchingNextPage} onClick={() => void blocked.fetchNextPage()}>
          Show more
        </Button>
      ) : null}
    </div>
  );
}

function BlockedRow({ accountId }: { accountId: string }) {
  const [open, setOpen] = useState(false);
  const author = useResolvedAuthor(accountId);
  return (
    <li className="flex items-center justify-between gap-3 py-2">
      <AuthorChip accountId={accountId} size="default" />
      <Button type="button" variant="outline" className="h-9 shrink-0 px-3" onClick={() => setOpen(true)}>Unblock</Button>
      <BlockDialog open={open} onOpenChange={setOpen} accountId={accountId} name={author.name} unblock />
    </li>
  );
}
