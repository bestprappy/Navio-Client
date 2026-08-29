import { NextResponse } from "next/server";

import { proxyMobilityRequest } from "@/app/api/_lib/mobility-proxy";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ providerPlaceId: string }> },
) {
  const { providerPlaceId } = await params;

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
