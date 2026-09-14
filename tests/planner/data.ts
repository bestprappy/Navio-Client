import type { TripResponse, PlannerSnapshot } from "../../app/feature/planner/_components/planner-api";
import type { EvCharger } from "../../app/feature/planner/planId/_components/constants/types";

export const drawerTrip: TripResponse = {
  id: "a1000000-0000-4000-8000-000000000014", displayName: "Drawer test trip", title: "Drawer test trip",
  startDate: "2026-09-01", endDate: "2026-09-20", destinationId: "bangkok", destinationName: "Bangkok",
  destinationCountry: "Thailand", destinationCity: "Bangkok", destinationRegion: "Bangkok",
  destinationCountryCode: "TH", destinationLat: 13.75, destinationLng: 100.5, visibility: "PRIVATE",
  createdAt: "2026-09-14T00:00:00Z", updatedAt: "2026-09-14T00:00:00Z",
};
export const drawerSnapshot: PlannerSnapshot = {
  blocks: Array.from({ length: 20 }, (_, i) => ({ id: `day-${i+1}`, kind: "itinerary", title: `Day ${i+1}`, date: `2026-09-${String(i+1).padStart(2,"0")}`, colorId: "teal", items: [] })),
  budget: { currency: "THB", amount: 0, expenses: [] }, version: 1, savedAt: drawerTrip.updatedAt,
};
export const drawerChargers: EvCharger[] = [
  {id:"compatible",name:"Compatible test station",connectorTypes:["CCS2"]},
  {id:"incompatible",name:"Other connector station",connectorTypes:["CHADEMO"]},
  {id:"unknown",name:"Unknown connector station",connectorTypes:[]},
].map((entry, index) => ({
  ...entry, connectorTypes: entry.connectorTypes as EvCharger["connectorTypes"],
  operatorName: "Test operator", location: {lat:13.75+index*.005,lng:100.5,address:"Bangkok, Thailand",placeId:null},
  address:"Bangkok, Thailand",province:"Bangkok",maxKw:50,totalConnectors:2,availableConnectors:2,
  priceText:null,openingHours:{summary:"Open 24 hours"},source:"ADMIN_IMPORT",verificationStatus:"ADMIN_VERIFIED",status:"active",ratingAvg:4,ratingCount:1,confidenceScore:1,stale:false,
}));
