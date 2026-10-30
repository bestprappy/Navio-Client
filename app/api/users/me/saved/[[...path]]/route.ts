import {proxyAuthenticatedApiRequest} from '@/app/api/_lib/authenticated-api-proxy';
type Context={params:Promise<{path?:string[]}>};
async function proxy(request:Request,context:Context){const {path=[]}=await context.params;return proxyAuthenticatedApiRequest(request,`/v1/users/me/saved${path.length?'/'+path.map(encodeURIComponent).join('/'):''}`);}
export const GET=proxy;export const POST=proxy;export const DELETE=proxy;
