import {catalogueDetail,isCatalogueId} from "@/app/feature/explore/places/catalogue";
import { NextResponse } from "next/server";

import { proxyMobilityRequest } from "@/app/api/_lib/mobility-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ providerPlaceId: string }> },
) {
  const { providerPlaceId } = await params;

  if (isCatalogueId(providerPlaceId) || new URL(request.url).searchParams.get('provider')==='CATALOGUE') {
    const p=catalogueDetail(providerPlaceId);
    return NextResponse.json(p?{provider:p.provider,providerPlaceId:p.providerPlaceId,name:p.name,address:p.address,location:{lat:p.lat,lng:p.lng,address:p.address,placeId:p.providerPlaceId},photoUrl:p.imageUrl,category:p.category,description:p.description,website:p.website,phone:null,openingHours:{}}:{error:'Catalogue place not found.'},{status:p?200:404});
  }
  if (!providerPlaceId) {
    return NextResponse.json(
      { error: "providerPlaceId path parameter is required." },
      { status: 400 },
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const encodedPlaceId = encodeURIComponent(providerPlaceId);

  return proxyMobilityRequest(
    request,
    `/v1/geo/places/${encodedPlaceId}?${searchParams.toString()}`,
  );
}
