import {searchCatalogue} from '@/app/feature/explore/places/catalogue';
export function GET(request:Request){try{return Response.json(searchCatalogue(new URL(request.url).searchParams));}catch{return Response.json({error:'Invalid catalogue cursor. Start the search again.'},{status:400});}}
