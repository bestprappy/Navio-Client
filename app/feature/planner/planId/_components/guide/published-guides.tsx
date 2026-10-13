"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { guideKeys, listPublishedGuides } from "@/app/feature/admin/_components/guides/guides-api";
import { publishedGuidesAtom } from "./guide.atoms";

/** Public server data feeds the existing planner selection and map state. */
export function PublishedGuides() {
  const result = useQuery({ queryKey: guideKeys.published, queryFn: listPublishedGuides, refetchInterval: 60_000 });
  const setGuides = useSetAtom(publishedGuidesAtom);
  useEffect(() => { if (result.data) setGuides(result.data); }, [result.data, setGuides]);
  return null;
}
