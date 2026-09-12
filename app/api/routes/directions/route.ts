import { proxyMobilityRequest } from "@/app/api/_lib/mobility-proxy";

export async function POST(request: Request) {
  return proxyMobilityRequest(request, "/v1/routes/directions", {
    method: "POST",
  });
}
