import type { SharedPlan } from "../publication-api";
import type { ReaderPresentation } from "./reader-model";

/** Demonstration data for the development-only reader preview, never a public plan. */
export const readerPreviewPlan: SharedPlan = {
  publishedAt:"2026-10-26",listedInExplore:true,authorName:"Navio UI preview",
  plan:{sanitizerVersion:1,title:"Kyoto, one stop at a time",destinationCity:"Kyoto",destinationCountry:"Japan",dayCount:3,
    budget:{currency:"JPY",amount:32000,expenses:[{label:"Food & cafés",amount:12000},{label:"Transport",amount:8000},{label:"Places & activities",amount:12000}]},
    days:[{label:"Day 1",title:"Quiet paths & the old city",items:[
      {type:"place",name:"Fushimi Inari Taisha",placeId:"preview:fushimi",lat:34.9671,lng:135.7727,imageUrl:"/images/plan-covers/kyoto.webp",description:"A walk through wooded paths and rows of vermilion torii.",notes:"Go early if you enjoy a quieter walk. We left plenty of room in the morning rather than trying to see everything in one day.",time:"08:30",timeEnd:"10:00"},
      {type:"place",name:"Kiyomizu-dera",placeId:"preview:kiyomizu",lat:34.9949,lng:135.7850,notes:"Take your time on the walk up. The little streets are part of the visit.",time:"11:30"},
      {type:"note",noteContent:"Leave the afternoon flexible. It is a trip, not a checklist."},
      {type:"place",name:"Gion",placeId:"preview:gion",lat:35.003,lng:135.778,notes:"An evening walk, then dinner somewhere nearby. Respect the private lanes and local signs.",time:"17:00"}]},
    {label:"Day 2",title:"A slower day by the hills",items:[
      {type:"place",name:"Arashiyama",placeId:"preview:arashiyama",lat:35.0094,lng:135.6668,description:"Make space for a longer walk and an unhurried lunch.",time:"09:00"},
      {type:"charger",name:"Charging stop (preview)",placeId:"preview:charger",lat:35.011,lng:135.681,charger:{maxKw:50,connectorTypes:["CHAdeMO"],openingHoursSummary:"Example only · verify before traveling",priceText:"Check the operator’s current pricing"},notes:"This demonstrates how the shared charging-stop card will look; it is not a verified charging location."},
      {type:"checklist",checklistTitle:"Before setting out",checklistLabels:["Water for the walk","Check charging access","Leave time for a break"]}]},
    {label:"Day 3",title:"Return to a favorite",items:[{type:"place",name:"Fushimi Inari Taisha",placeId:"preview:fushimi",lat:34.9671,lng:135.7727,imageUrl:"/images/plan-covers/kyoto.webp",notes:"We kept this return visit optional. Revisiting a favorite can be better than adding another stop."},{type:"place",name:"A café to decide later",notes:"An example of a stop whose location has not been shared."}]}]},
};
export const readerPreviewPresentation:ReaderPresentation={
  introduction:"Three days with room to wander. This example shows how a planner’s own stops, notes, lists and EV setup can become a calm, easy-to-read shared trip—without turning into a travel article.",
  vehicles:[{id:"example-catalog",source:"catalog",name:"BYD ATTO 3 · example",batteryKwh:60.48,rangeKm:420,connectors:["CCS2","TYPE2"]},{id:"example-custom",source:"custom",name:"Owner’s custom EV · example",batteryKwh:72,connectors:["TYPE2"]}],
  lists:[{title:"If there’s a little extra time",items:[{type:"place",name:"Nishiki Market",placeId:"preview:nishiki",lat:35.005,lng:135.7649,notes:"A flexible idea rather than a scheduled stop."},{type:"place",name:"A second walk through Gion",placeId:"preview:gion",lat:35.003,lng:135.778}]}],
};
