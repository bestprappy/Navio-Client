import { proxyMobilityRequest } from "@/app/api/_lib/mobility-proxy";

export async function GET(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  searchParams.set("scope", "DESTINATION");

  return proxyMobilityRequest(
    request,
    `/v1/geo/places/autocomplete?${searchParams.toString()}`,
  );
}
