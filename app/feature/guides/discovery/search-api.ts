import {z} from 'zod';
import {categorySchema} from '../../admin/_components/guides/guide-storage';
import {guideRequestParams,type GuideSearchState} from './search-state';
const entrySchema=z.object({id:z.string().uuid(),source:z.enum(['TRAVELER','CURATED']),name:z.string(),country:z.string(),countryCode:z.string().nullable(),destinationName:z.string(),destinationProvider:z.enum(['GOOGLE','MAPBOX']),destinationPlaceId:z.string(),description:z.string(),coverPlaceId:z.string(),placeCount:z.number().int().nonnegative(),categories:z.array(categorySchema),author:z.object({id:z.string().uuid().nullish(),displayName:z.string(),avatarMediaId:z.string().uuid().nullish()}),publishedAt:z.string().nullish().transform(value=>value??''),updatedAt:z.string(),viewCount:z.number().int().nonnegative(),discoveryLabel:z.enum(['trending','popular','recent']).nullish(),collections:z.array(z.string())});
export const guideDiscoveryPageSchema=z.object({content:z.array(entrySchema),matching:z.array(entrySchema),relevant:z.array(entrySchema),matchingTotal:z.number().int().nonnegative(),relevantTotal:z.number().int().nonnegative(),totalElements:z.number().int().nonnegative(),number:z.number().int().nonnegative(),last:z.boolean(),suggestions:z.array(z.string()),notice:z.string().nullish()});
export type GuideDiscoveryEntry=z.infer<typeof entrySchema>;
export type GuideDiscoveryPage=z.infer<typeof guideDiscoveryPageSchema>;
export async function fetchGuideDiscovery(state:GuideSearchState,page=0,signal?:AbortSignal,size=12):Promise<GuideDiscoveryPage>{
 const response=await fetch(`/api/traveler-guides/discovery?${guideRequestParams(state,page,size)}`,{signal,cache:'no-store'});
 if(!response.ok)throw new Error('Guides could not be loaded. Please try again.');
 const parsed=guideDiscoveryPageSchema.safeParse(await response.json());
 if(!parsed.success)throw new Error('The guide catalogue returned an unexpected response. Please try again.');
 return parsed.data;
}


