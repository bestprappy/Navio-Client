"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { notify } from "@/components/toast/notify";
import { useViewer } from "@/hooks/use-social";
import { getPopularityPreference, placePopularityKeys, setPopularityPreference } from "@/lib/place-popularity-api";

import { SettingSwitch } from "../setting-switch";
import { SettingsGroup } from "../settings-section";

export function PlacePopularitySetting() {
  const viewer = useViewer();
  const client = useQueryClient();
  const key = placePopularityKeys.preference(viewer.accountId);
  const preference = useQuery({
    queryKey: key, queryFn: ({ signal }) => getPopularityPreference(signal), enabled: viewer.signedIn,
    staleTime: 30_000, retry: false,
  });
  const save = useMutation({
    mutationFn: setPopularityPreference,
    onSuccess: async (saved) => {
      client.setQueryData(key, saved);
      await client.invalidateQueries({ queryKey: placePopularityKeys.recommendations });
      notify.success({ title: saved.contributes ? "Place popularity contribution enabled" : "Place popularity contribution disabled" });
    },
    onError: (error) => notify.error({ title: "Privacy setting not saved", description: error.message }),
  });

  return (
    <SettingsGroup title="Place recommendations" description="Help travelers discover places that people choose for their trips.">
      {preference.data ? <SettingSwitch label="Contribute to place popularity"
        description="Include places from my public and private itineraries in combined traveler counts. My name, trip details, notes and personal saved locations are never shared. Turning this off removes my contribution from future results."
        checked={preference.data.contributes} disabled={save.isPending}
        onCheckedChange={(checked) => save.mutate(checked)} />
        : preference.isError ? <div className="space-y-2"><p role="alert" className="text-sm text-muted-foreground">Your recommendation privacy setting could not be loaded.</p>
          <Button type="button" variant="outline" onClick={() => void preference.refetch()}>Try again</Button></div>
          : <Skeleton className="h-16 w-full" />}
    </SettingsGroup>
  );
}
