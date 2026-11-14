import {suggestCatalogue} from '@/app/feature/explore/places/catalogue';
export function GET(request:Request){const p=new URL(request.url).searchParams;return Response.json(suggestCatalogue(p.get('query')??'',p.get('country')??''));}
