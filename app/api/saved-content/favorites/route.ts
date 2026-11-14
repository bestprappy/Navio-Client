import {NextResponse,type NextRequest} from 'next/server';
import {proxyAuthenticatedApiRequest} from '@/app/api/_lib/authenticated-api-proxy';
const identityPattern=/^(?:plan:[A-Za-z0-9_-]{1,128}|guide:(?:curated|traveler):[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
export async function GET(request:NextRequest){
 const ids=request.nextUrl.searchParams.getAll('identity');
 if(!ids.length||ids.length>48||ids.some(id=>!identityPattern.test(id)))return NextResponse.json({message:'Invalid content identities.'},{status:400});
 return proxyAuthenticatedApiRequest(request,'/v1/saved-content/favorites',{allowAnonymous:true});
}
