"use client";
import { createContext, createElement, useContext, useMemo, type ReactNode } from "react";
import { atom, useAtomValue } from "jotai";
import type { LegTravelMode } from "../../../planId/_components/constants/types";
import { useTripRoutesForGroups } from "../../../planId/_components/routes/trip-route-query";
import { useTripBlockColorResolver } from "../../../planId/_components/constants/use-trip-block-color";
import { readerDayModeAtom, readerFilterMapAtom, readerModelAtom, readerSelectionAtom, readerSingleDayAtom } from "./reader-state";
import { readerRouteGroups, readerRouteLegs } from "./reader-route-model";

export const readerRouteOverridesAtom=atom<Record<string,LegTravelMode>>({});
export const readerFocusedRouteAtom=atom<string|null>(null);
function useReaderRouteState() {
  const model=useAtomValue(readerModelAtom)!;
  const resolveColor=useTripBlockColorResolver();
  const selection=useAtomValue(readerSelectionAtom);
  const overrides=useAtomValue(readerRouteOverridesAtom);
  const mode=useAtomValue(readerDayModeAtom);
  const singleDay=useAtomValue(readerSingleDayAtom);
  const filter=useAtomValue(readerFilterMapAtom);
  const focused=useAtomValue(readerFocusedRouteAtom);
  const singleId=singleDay??model.days.find(g=>g.id===selection.groupId)?.id??model.days[0]?.id;
  const groups=useMemo(()=>model.groups.filter(g=>g.kind==="day"&&(mode!=="single"||g.id===singleId)),[model,mode,singleId]);
  const legs=useMemo(()=>readerRouteLegs(groups),[groups]);
  const requests=useMemo(()=>readerRouteGroups(legs,overrides),[legs,overrides]);
  const query=useTripRoutesForGroups(requests);
  const allSegments=query.data?.segments??[];
  const visibleSegments=allSegments.filter(s=>!filter||s.blockId===selection.groupId);
  const focusedSegment=visibleSegments.find(s=>s.toItemId===focused);
  const colors=useMemo(()=>new Map(model.groups.map(g=>[g.id,resolveColor(g.colorId).mapColor])),[model,resolveColor]);
  return {legs,query,segments:visibleSegments,allSegments,colors,focusedSegmentId:focusedSegment?.id??null};
}
const ReaderRoutesContext=createContext<ReturnType<typeof useReaderRouteState>|null>(null);
export function ReaderRoutesProvider({children}:{children:ReactNode}) {
  const value=useReaderRouteState();return createElement(ReaderRoutesContext.Provider,{value},children);
}
export function useReaderRoutes(){const value=useContext(ReaderRoutesContext);if(!value)throw new Error("Reader routes require their provider");return value;}
