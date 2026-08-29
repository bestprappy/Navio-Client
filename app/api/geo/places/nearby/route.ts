import { proxyMobilityRequest } from "@/app/api/_lib/mobility-proxy";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  return proxyMobilityRequest(
    request,
    `/v1/geo/places/nearby?${searchParams.toString()}`,
  );
}
