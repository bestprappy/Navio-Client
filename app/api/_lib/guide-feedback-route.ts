import {NextResponse,type NextRequest} from 'next/server';
import {proxyAuthenticatedApiRequest} from './authenticated-api-proxy';
import {GUIDE_ID_PATTERN} from '../admin/guides/guide-routes';
export async function guideFeedbackRoute(request:NextRequest,context:{params:Promise<{source:string;id:string;path?:string[]}>}){
 const {source,id,path=[]}=await context.params;
 const suffix=path.join('/'),method=request.method;
 const root=path.length===0&&method==='GET';
 const valid=root||(suffix==='rating'&&['PUT','DELETE'].includes(method))||(suffix==='comments'&&['GET','POST'].includes(method))||(suffix==='reports'&&method==='GET')
  ||(path[0]==='comments'&&GUIDE_ID_PATTERN.test(path[1]??'')&&((path.length===2&&['PUT','DELETE'].includes(method))||(path.length===3&&path[2]==='reports'&&method==='POST')));
 if(!['CURATED','TRAVELER'].includes(source)||!GUIDE_ID_PATTERN.test(id)||!valid)return NextResponse.json({message:'Not found.'},{status:404});
 return proxyAuthenticatedApiRequest(request,`/v1/traveler-guides/discovery/${source}/${id}/feedback${suffix?`/${suffix}`:''}`,{allowAnonymous:root||(suffix==='comments'&&method==='GET')});
}
