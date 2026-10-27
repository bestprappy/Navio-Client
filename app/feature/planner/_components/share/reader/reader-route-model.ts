import { isLegTravelMode, isTransitMode } from "../../../planId/_components/routes/leg-travel-mode";
import { isTransitRouteKey } from "../../../planId/_components/routes/transit-route-choice";
import type { LegTravelMode } from "../../../planId/_components/constants/types";
import type { RoutePoint, RoutePointGroup } from "../../../planId/_components/routes/trip-route.types";
import type { ReaderGroup, ReaderStop } from "./reader-model";

export type ReaderRouteLeg = {id:string;groupId:string;from:ReaderStop;to:ReaderStop;plannedMode:LegTravelMode|null};
export function readerRouteLegs(groups:ReaderGroup[]):ReaderRouteLeg[] {
  return groups.filter(group=>group.kind==="day").flatMap(group=>group.stops.flatMap((to,index)=>{
    const from=group.stops[index-1];
    if(!from?.located||!to.located)return [];
    return [{id:to.id,groupId:group.id,from,to,plannedMode:isLegTravelMode(to.item.arrivalMode)?to.item.arrivalMode:null}];
  }));
}
export function readerRoutePoint(stop:ReaderStop):RoutePoint {
  return {id:stop.id,name:stop.item.name??"Planned stop",type:stop.item.type==="charger"?"charger":"place",lat:stop.item.lat!,lng:stop.item.lng!};
}
export function readerRouteGroups(legs:ReaderRouteLeg[],overrides:Record<string,LegTravelMode>):RoutePointGroup[] {
  return legs.map(leg=>{
    const mode=overrides[leg.id]??leg.plannedMode??"drive";
    const savedKey=leg.to.item.arrivalRouteKey;
    return {blockId:leg.groupId,points:[readerRoutePoint(leg.from),{...readerRoutePoint(leg.to),arrivalMode:mode,
      ...(!overrides[leg.id]&&isTransitMode(mode)&&isTransitRouteKey(savedKey)?{arrivalRouteKey:savedKey}:{}),
      ...(mode==="rail"?{railOnly:true}:{})}]};
  });
}
