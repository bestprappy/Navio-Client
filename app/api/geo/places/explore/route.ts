import { proxyMobilityRequest } from "@/app/api/_lib/mobility-proxy";
export async function GET(request: Request) {
  return proxyMobilityRequest(
    request,
    `/v1/geo/places/explore?${new URL(request.url).searchParams}`,
    { timeoutMs: 30_000 },
  );
}
