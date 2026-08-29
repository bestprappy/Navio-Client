import { proxyMobilityRequest } from "@/app/api/_lib/mobility-proxy";

export async function GET(request: Request) {
  const sourceParams = new URL(request.url).searchParams;
  const upstreamParams = new URLSearchParams();
  const lat = sourceParams.get("lat");
  const lng = sourceParams.get("lng");
  const radiusMeters = Number(sourceParams.get("radius"));

  if (lat) upstreamParams.set("lat", lat);
  if (lng) upstreamParams.set("lng", lng);
  if (Number.isFinite(radiusMeters) && radiusMeters > 0) {
    upstreamParams.set("radiusKm", String(radiusMeters / 1000));
  }

  return proxyMobilityRequest(
    request,
    `/v1/ev/chargers/near?${upstreamParams.toString()}`,
  );
}
