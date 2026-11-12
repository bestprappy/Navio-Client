import {NextResponse,type NextRequest} from "next/server";
import {randomUUID} from "node:crypto";
import {proxyAuthenticatedApiRequest} from "@/app/api/_lib/authenticated-api-proxy";
import {GUIDE_ID_PATTERN} from "@/app/api/admin/guides/guide-routes";
export async function POST(request:NextRequest,context:{params:Promise<{source:string;id:string}>}){
 const {source,id}=await context.params;
 if(!['CURATED','TRAVELER'].includes(source)||!GUIDE_ID_PATTERN.test(id))return NextResponse.json({message:'Not found.'},{status:404});
 const existing=request.cookies.get('navio-guide-reader')?.value;
 const visitorId=existing&&GUIDE_ID_PATTERN.test(existing)?existing:randomUUID();
 // Server-issued first-party identity; never accepts a client-supplied body or account id.
 const forwarded=new Request(request.url,{method:'POST',body:JSON.stringify({visitorId}),headers:new Headers(request.headers)});
 forwarded.headers.set('Content-Type','application/json');
 forwarded.headers.delete('content-length');
 const response=await proxyAuthenticatedApiRequest(forwarded,`/v1/traveler-guides/discovery/${source}/${id}/view`,{allowAnonymous:true});
 if(visitorId!==existing)response.headers.append('Set-Cookie',`navio-guide-reader=${visitorId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${request.nextUrl.protocol==='https:'?'; Secure':''}`);
 return response;
}
