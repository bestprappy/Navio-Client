import {z} from "zod";
import {communityRequest,pageSchema} from "../community/_components/community-api";
import {postSchema} from "../community/_components/community-post-api";
export type CommunityLibraryView="saved"|"voted"|"history"|"comments";
export type CommunityLibrarySort="recent"|"oldest"|"top";
export const entrySchema=z.object({post:postSchema,activityAt:z.string().datetime(),commentId:z.string().uuid().nullable(),commentBody:z.string().nullable()});
export type CommunityLibraryEntry=z.infer<typeof entrySchema>;
export function listCommunityLibrary(view:CommunityLibraryView,q:string,vote:string,sort:CommunityLibrarySort,page:number,signal?:AbortSignal){
 const params=new URLSearchParams({view,q,vote,sort,page:String(page),size:"20"});
 return communityRequest(`/me/library?${params}`,pageSchema(entrySchema),undefined,signal,"social");
}
export const saveCommunityPost=(id:string,saved:boolean)=>communityRequest(`/me/library/saved/${encodeURIComponent(id)}`,z.null(),{method:saved?"PUT":"DELETE"},undefined,"social");
export const recordCommunityVisit=(id:string)=>communityRequest(`/me/library/history/${encodeURIComponent(id)}`,z.null(),{method:"PUT"},undefined,"social");
export const clearCommunityHistory=()=>communityRequest("/me/library/history",z.null(),{method:"DELETE"},undefined,"social");
