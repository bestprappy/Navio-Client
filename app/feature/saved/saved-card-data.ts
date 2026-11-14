import {fetchExplorePlanSummary,type ExplorePlan} from "../explore/_components/shared-plans/explore-plans-api";
import {readTravelerGuide,type PublishedGuideSummary} from "../guides/user-guides-api";
import {countGuidePlaces} from "../admin/_components/guides/guide-model";
import {feedbackRequest,feedbackSummarySchema} from "../planner/_components/share/feedback/feedback-api";
import type {SavedItem} from "./library-api";

type PublicGuide=Awaited<ReturnType<typeof readTravelerGuide>>;
export function savedGuideSummary({guide,author}:PublicGuide,source:"CURATED"|"TRAVELER"):PublishedGuideSummary & {source:"CURATED"|"TRAVELER"}{
 return {id:guide.id,name:guide.name,country:guide.country,countryCode:guide.countryCode,destinationName:guide.destination.name,destinationProvider:guide.destination.provider,destinationPlaceId:guide.destination.providerPlaceId,description:guide.description,coverPlaceId:guide.coverPlaceId,placeCount:countGuidePlaces(guide),categories:[...guide.categories],author,publishedAt:guide.publishedAt??"",updatedAt:guide.updatedAt,source};
}
const metricsSchema=feedbackSummarySchema.pick({viewCount:true,ratingAverage:true,ratingCount:true});
type GuideMetrics={viewCount?:number;ratingAverage?:number|null;ratingCount?:number};
async function readGuideMetrics(id:string,source:"CURATED"|"TRAVELER",signal?:AbortSignal):Promise<GuideMetrics|undefined>{
 try{return metricsSchema.parse(await feedbackRequest(`guide:${source}:${id}`,"",{signal}));}
 catch(error){if(signal?.aborted)throw error;return undefined;}
}
type Dependencies={readPlan?:typeof fetchExplorePlanSummary;readGuide?:typeof readTravelerGuide;readMetrics?:typeof readGuideMetrics};
export type SavedPublication={kind:"plan";plan:ExplorePlan}|{kind:"guide";guide:ReturnType<typeof savedGuideSummary>&GuideMetrics};
/** Read publication metadata only. Never run Places discovery or count a reader visit. */
export async function loadSavedPublication(item:Pick<SavedItem,"type"|"identity">,signal?:AbortSignal,deps:Dependencies={}):Promise<SavedPublication|null>{
 if(item.type==="PLAN"){
  const plan=await (deps.readPlan??fetchExplorePlanSummary)(item.identity.slice(5),signal);
  return plan?{kind:"plan",plan}:null;
 }
 if(item.type==="GUIDE"){
  const match=/^guide:(curated|traveler):([a-f0-9-]{36})$/i.exec(item.identity);
  if(!match)throw new Error("This saved guide is unavailable.");
  const source=match[1].toUpperCase() as "CURATED"|"TRAVELER";
  const [detail,metrics]=await Promise.all([(deps.readGuide??readTravelerGuide)(match[2],source,signal),(deps.readMetrics??readGuideMetrics)(match[2],source,signal)]);
  return {kind:"guide",guide:{...savedGuideSummary(detail,source),...metrics}};
 }
 return null;
}
