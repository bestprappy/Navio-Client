import { proxyAuthenticatedApiRequest } from '@/app/api/_lib/authenticated-api-proxy';
export async function GET(request:Request,{params}:{params:Promise<{token:string}>}):Promise<Response>{
  const {token}=await params;
  return proxyAuthenticatedApiRequest(request,`/v1/shared-plans/${encodeURIComponent(token)}/feedback`,{allowAnonymous:true});
}
