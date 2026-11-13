"use client";

import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createStore, Provider, useAtomValue } from "jotai";

import { BANGKOK_ADMIN_GUIDE } from "@/app/feature/admin/_components/guides/data";
import { TripBlock } from "@/app/feature/planner/planId/_components/block/trip-block";
import type { TripBlockData } from "@/app/feature/planner/planId/_components/constants/types";
import { publishedGuidesAtom } from "@/app/feature/planner/planId/_components/guide/guide.atoms";
import { activeSearchAtom, tripBlocksAtom } from "@/app/feature/planner/planId/_components/overview/trip-builder.atoms";
import { PlacePopularitySetting } from "@/app/feature/settings/_components/privacy/place-popularity-setting";
import { placePopularityKeys } from "@/lib/place-popularity-api";

const account="22222222-2222-4222-8222-222222222222";
const block: TripBlockData={id:"day-test",kind:"itinerary",title:"Bangkok",date:"2026-11-13",colorId:"blue",items:[]};
const key=[...placePopularityKeys.recommendations,account,undefined,13.75,100.5];
function State() {
  const blocks=useAtomValue(tripBlocksAtom);
  const preview=useAtomValue(activeSearchAtom);
  return <div className="mt-5 text-sm text-muted-foreground"><output aria-label="Saved stop count">{blocks[0].items.length}</output>
    <output aria-label="Previewed place">{preview?.results[preview.selectedIndex]?.name ?? ""}</output></div>;
}
export default function Fixture() {
  const [store]=useState(()=>{const s=createStore();s.set(tripBlocksAtom,[block]);s.set(publishedGuidesAtom,[BANGKOK_ADMIN_GUIDE]);return s;});
  const [client]=useState(()=>new QueryClient({defaultOptions:{queries:{retry:false}}}));
  const popular=()=>client.setQueryData(key,{minimumTravelers:5,items:Object.values(BANGKOK_ADMIN_GUIDE.places).slice(0,6).map((place,index)=>({placeId:place.id,travelerCount:12-index,place:null}))});
  return <SessionProvider session={{user:{id:account,name:"Test traveler"},expires:"2099-01-01"}}>
    <QueryClientProvider client={client}><Provider store={store}>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex gap-3"><button onClick={popular}>Traveler counts</button>
          <button onClick={()=>client.setQueryData(key,{minimumTravelers:5,items:[]})}>Guide picks</button>
          <button onClick={()=>document.documentElement.classList.toggle("dark")}>Toggle theme</button></div>
        <div id="test-day"><TripBlock.Root block={block} variant="day"><TripBlock.Actions placeSearchBias={{label:"Bangkok",lat:13.75,lng:100.5}} /></TripBlock.Root></div>
        <State /><PlacePopularitySetting />
      </main>
    </Provider></QueryClientProvider>
  </SessionProvider>;
}
