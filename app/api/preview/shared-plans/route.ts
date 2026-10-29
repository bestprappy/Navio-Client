import "server-only";
import {z} from "zod";
import {withAuthenticatedSession} from "@/app/api/_lib/with-authenticated-session";
import {isCrossOriginMutation} from "@/app/api/_lib/upload-request";
import {readerReviewSamples} from "@/app/feature/planner/_components/share/reader/review-samples.data";
import {reviewPlannerSource} from "@/app/feature/planner/_components/share/reader/review-source";

export const maxDuration=180;
const tripSchema=z.object({id:z.uuid(),version:z.number(),displayName:z.string().nullable().optional()});
const flights=new Map<string,Promise<Response>>();
/** Explicit, development-only sample preparation using the configured gateway (including dev:vm). */
export async function POST(request:Request):Promise<Response>{
 if(process.env.NODE_ENV!=="development")return Response.json({message:"Not found"},{status:404});
 if(isCrossOriginMutation(request,process.env.AUTH_URL??process.env.NEXTAUTH_URL))return Response.json({message:"This request must come from Navio."},{status:403});
 return withAuthenticatedSession(request,async(req,session)=>{
  if(!session?.accessToken||!session.user?.id||session.error)return Response.json({message:"Sign in to prepare review examples."},{status:401});
  const text=await req.text();if(text.length>128)return Response.json({message:"Invalid confirmation"},{status:400});
  let confirmation:unknown;try{confirmation=JSON.parse(text);}catch{return Response.json({message:"Confirm sample preparation."},{status:400});}
  if(!z.object({confirm:z.literal(true)}).safeParse(confirmation).success)return Response.json({message:"Confirm sample preparation."},{status:400});
  const base=process.env.NAVIO_API_BASE_URL;if(!base)return Response.json({message:"The API gateway is not configured."},{status:503});
  const key=session.user.id;if(flights.has(key))return (await flights.get(key)!).clone();
  const work=prepare(base,session.accessToken);flights.set(key,work);
  try{return (await work).clone();}finally{flights.delete(key);}
 });
}
async function prepare(base:string,token:string):Promise<Response>{
 const examples:{title:string;tripId:string;sharedPath:string|null}[]=[];let created:string|null=null;
 const places=new Map<string,{provider:string;providerPlaceId:string;address?:string|null;rating?:number|null;reviewCount?:number|null;primaryType?:string|null;location:{lat:number;lng:number}}>();
 async function api(method:string,path:string,body?:unknown):Promise<unknown>{
  const response=await fetch(new URL(path,base),{method,headers:{Accept:"application/json","Content-Type":"application/json",Authorization:`Bearer ${token}`},body:body===undefined?undefined:JSON.stringify(body),cache:"no-store",signal:AbortSignal.timeout(20000)});
  const result:unknown=await response.json().catch(()=>null);
  if(!response.ok){const message=z.object({message:z.string()}).safeParse(result);throw new Error(message.success?message.data.message:`Review setup failed (${response.status}).`);}
  return result;
 }
 try{
  const owned:z.infer<typeof tripSchema>[]=[];
  for(let page=0;page<50;page++){const list=z.object({content:z.array(tripSchema),totalPages:z.number()}).parse(await api("GET",`/v1/trips?page=${page}&size=100`));owned.push(...list.content);if(page+1>=list.totalPages)break;if(page===49)throw new Error("Too many trips to safely locate the managed review examples.");}
  const suggestions=z.object({items:z.array(z.object({provider:z.enum(["GOOGLE","MAPBOX"]),providerPlaceId:z.string(),mainText:z.string()}))}).parse(await api("GET","/v1/geo/places/autocomplete?query=Kyoto%20Japan&scope=DESTINATION"));
  const destination=suggestions.items.find(item=>item.mainText.toLowerCase()==="kyoto")??suggestions.items.find(item=>item.mainText.toLowerCase().startsWith("kyoto"));
  if(!destination)throw new Error("Could not resolve the Kyoto example destination. No trips were changed.");
  for(const sample of readerReviewSamples){
   const title=`[Navio review] ${sample.label}`;
   const existing=owned.find(trip=>trip.displayName===title);
   if(existing){const publication=z.object({published:z.boolean(),token:z.string().optional()}).parse(await api("GET",`/v1/trips/${existing.id}/publication`));examples.push({title:sample.label,tripId:existing.id,sharedPath:publication.published&&publication.token?`/explore/shared/${publication.token}`:null});continue;}
   const source=reviewPlannerSource(sample.shared);
   for(const block of source.blocks)for(const item of block.items){
    if(item.type!=="place"||item.evCharger||!item.placeId.startsWith("preview:"))continue;
    const key=item.placeId;
    if(!places.has(key)){
     const query=new URLSearchParams({query:`${item.name} Kyoto Japan`,lat:String(item.lat),lng:String(item.lng)});
     const result=z.object({items:z.array(z.object({provider:z.enum(["GOOGLE","MAPBOX"]),providerPlaceId:z.string(),address:z.string().nullish(),rating:z.number().nullish(),reviewCount:z.number().nullish(),primaryType:z.string().nullish(),location:z.object({lat:z.number(),lng:z.number()})}))}).parse(await api("GET",`/v1/geo/places/search?${query}`));
     const match=result.items.find(place=>Math.abs(place.location.lat-item.lat)<0.02&&Math.abs(place.location.lng-item.lng)<0.02);
     if(!match)throw new Error(`Could not resolve the example stop ${item.name}. No placeholder location was published.`);
     places.set(key,match);
    }
    const place=places.get(key)!;item.placeId=`${place.provider}:${place.providerPlaceId}`;item.lat=place.location.lat;item.lng=place.location.lng;item.address=place.address??item.address;item.rating=place.rating??undefined;item.reviewCount=place.reviewCount??undefined;item.placeType=place.primaryType??undefined;item.imageUrl=undefined;
   }
   const trip=tripSchema.parse(await api("POST","/v1/trips",{displayName:title,startDate:sample.shared.plan.startDate,endDate:sample.shared.plan.endDate,destinationId:`${destination.provider}:${destination.providerPlaceId}`}));created=trip.id;
   const state=z.object({capabilities:z.array(z.string()).optional()}).parse(await api("GET",`/v1/trips/${trip.id}/planner`));
   if(!state.capabilities?.includes("publication-sections-v1"))throw new Error("The connected trip backend needs the new sections update before complete examples can be prepared.");
   const saved=z.object({version:z.number()}).parse(await api("PUT",`/v1/trips/${trip.id}/planner`,{version:trip.version,blocks:source.blocks,budget:source.budget,energyState:source.energyState}));
   const published=z.object({token:z.string()}).parse(await api("PUT",`/v1/trips/${trip.id}/publication`,{expectedTripVersion:saved.version,expectedRevision:null,options:source.options,listInExplore:true,authorDisplayName:"Navio review examples",title:sample.label}));
   examples.push({title:sample.label,tripId:trip.id,sharedPath:`/explore/shared/${published.token}`});created=null;
  }
  return Response.json({examples},{headers:{"Cache-Control":"no-store"}});
 }catch(error){
  if(created)await api("DELETE",`/v1/trips/${created}`).catch(()=>undefined);
  return Response.json({message:error instanceof Error?error.message:"Examples could not be prepared.",examples},{status:502,headers:{"Cache-Control":"no-store"}});
 }
}
