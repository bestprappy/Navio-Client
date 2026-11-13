import {NextResponse,type NextRequest} from "next/server";
import {proxyAuthenticatedApiRequest} from "@/app/api/_lib/authenticated-api-proxy";
import {GUIDE_ID_PATTERN} from "@/app/api/admin/guides/guide-routes";
export async function POST(request:NextRequest,context:{params:Promise<{source:string;id:string}>}){
 const {source,id}=await context.params;
 if(!['CURATED','TRAVELER'].includes(source)||!GUIDE_ID_PATTERN.test(id))return NextResponse.json({message:'Not found.'},{status:404});
 const body:unknown=await request.json().catch(()=>null);
 const readId=body&&typeof body==='object'&&'readId' in body&&typeof body.readId==='string'?body.readId:'';
 if(!GUIDE_ID_PATTERN.test(readId))return NextResponse.json({message:'A valid read request is required.'},{status:400});
 const forwarded=new Request(request.url,{method:'POST',body:JSON.stringify({readId}),headers:new Headers(request.headers)});
 forwarded.headers.set('Content-Type','application/json');
 forwarded.headers.delete('content-length');
 return proxyAuthenticatedApiRequest(forwarded,`/v1/traveler-guides/discovery/${source}/${id}/view`,{allowAnonymous:true});
}
