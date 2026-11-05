import { proxyAuthenticatedApiRequest } from '@/app/api/_lib/authenticated-api-proxy';
type Context={params:Promise<{token:string;path:string[]}>};
async function proxy(request:Request,{params}:Context):Promise<Response>{
  const {token,path}=await params;
  const resource=path.join('/');
  const methods=resource==='rating'?['PUT','DELETE']:resource==='comments'?['GET','POST']:resource==='reports'?['GET']:
    /^comments\/[0-9a-f-]{36}$/i.test(resource)?['PUT','DELETE']:/^comments\/[0-9a-f-]{36}\/reports$/i.test(resource)?['POST']:[];
  if(!methods.includes(request.method))return Response.json({message:'This feedback action is not available.'},{status:404});
  return proxyAuthenticatedApiRequest(request,`/v1/shared-plans/${encodeURIComponent(token)}/feedback/${path.map(encodeURIComponent).join('/')}`,
    {allowAnonymous:request.method==='GET'&&resource==='comments'});
}
export const GET=proxy;
export const POST=proxy;
export const PUT=proxy;
export const DELETE=proxy;
