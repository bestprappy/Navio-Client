import {catalogueItem} from '@/app/feature/explore/places/catalogue';
export async function GET(_request:Request,{params}:{params:Promise<{providerPlaceId:string}>}){const item=catalogueItem((await params).providerPlaceId);return Response.json(item??{error:'This place is not in the exhibition collection.'},{status:item?200:404});}
