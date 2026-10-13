import { proxyMobilityRequest } from "@/app/api/_lib/mobility-proxy";

export async function POST(request: Request) {
  return proxyMobilityRequest(request, "/v1/routes/directions", {
    method: "POST",
    // Sequential primary/fallback providers each have a bounded HTTP budget.
    timeoutMs: 25_000,
  });
}
