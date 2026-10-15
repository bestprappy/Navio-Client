import { proxyMobilityRequest } from "@/app/api/_lib/mobility-proxy";
export async function GET(request: Request, { params }: { params: Promise<{ providerPlaceId: string }> }) {
  return proxyMobilityRequest(request, `/v1/geo/places/${encodeURIComponent((await params).providerPlaceId)}/reader`);
}
