"use client";

import { useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { atom, useAtom } from "jotai";
import { format, parseISO } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useTripMetadata, useUpdateTripMetadata } from "../../../_components/use-trip-metadata";
import { tripDateRangeAtom } from "./trip-builder.atoms";

export function useTripDates(initialFrom?: string, initialTo?: string) {
  const { planId } = useParams<{ planId?: string }>();
  const metadata = useTripMetadata(planId);
  const mutation = useUpdateTripMetadata(planId);
  const [storedRange, setStoredRange] = useAtom(tripDateRangeAtom);
  const draftAtom = useMemo(() => {
    const value = atom<DateRange | null>(null);
    value.debugLabel = `trip-date-draft-${planId}`;
    return value;
  }, [planId]);
  const [draft, setDraft] = useAtom(draftAtom);
  const from = metadata.data?.startDate ?? storedRange.from ?? initialFrom;
  const to = metadata.data?.endDate ?? storedRange.to ?? initialTo;

  useEffect(() => {
    if (metadata.data) {
      setStoredRange({ from: metadata.data.startDate, to: metadata.data.endDate });
    }
  }, [metadata.data, setStoredRange]);

  const pickerValue = draft ?? (from ? { from: parseISO(from), to: to ? parseISO(to) : undefined } : undefined);

  function changeRange(range: DateRange | undefined, onSaved: () => void) {
    if (mutation.isPending) return;
    mutation.reset();
    setDraft(range ?? null);
    if (!range?.from || !range.to) return;
    mutation.mutate({
      startDate: format(range.from, "yyyy-MM-dd"),
      endDate: format(range.to, "yyyy-MM-dd"),
    }, {
      onSuccess: (trip) => {
        setStoredRange({ from: trip.startDate, to: trip.endDate });
        setDraft(null);
        onSaved();
      },
      onError: () => setDraft(null),
    });
  }

  return { pickerValue, changeRange, isPending: mutation.isPending, isError: mutation.isError, isReady: Boolean(metadata.data) };
}
