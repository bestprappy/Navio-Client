import { proxyMobilityRequest } from "@/app/api/_lib/mobility-proxy";

export async function POST(request: Request) {
  const body = await request.text();

  return proxyMobilityRequest(request, "/v1/routes/directions", {
    method: "POST",
    body,
  });
}
