import {NextResponse,type NextRequest} from "next/server";
import {proxyDailyPublicationView} from "@/app/api/_lib/daily-publication-view";
import {GUIDE_ID_PATTERN} from "@/app/api/admin/guides/guide-routes";
export async function POST(request:NextRequest,context:{params:Promise<{source:string;id:string}>}){
 const {source,id}=await context.params;
 if(!['CURATED','TRAVELER'].includes(source)||!GUIDE_ID_PATTERN.test(id))return NextResponse.json({message:'Not found.'},{status:404});
 const body:unknown=await request.json().catch(()=>null);
 const readId=body&&typeof body==='object'&&'readId' in body&&typeof body.readId==='string'?body.readId:'';
 if(!GUIDE_ID_PATTERN.test(readId))return NextResponse.json({message:'A valid read request is required.'},{status:400});
 return proxyDailyPublicationView(request,`/v1/traveler-guides/discovery/${source}/${id.toLowerCase()}/view`);
}
