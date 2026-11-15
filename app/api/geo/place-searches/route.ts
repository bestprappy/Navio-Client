import { proxyMobilityRequest } from "@/app/api/_lib/mobility-proxy";

/**
 * Places Release 2 explicit Google search. Signed-in only (the proxy refuses requests without a
 * session; the gateway and Mobility refuse them again). Invalid input is rejected here so it never
 * reaches a paid provider call.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const query = (params.get("query") ?? "").trim();
  const country = (params.get("country") ?? "").trim().toUpperCase();
  const cursor = params.get("cursor") ?? "";
  if (query.length < 2 || query.length > 120 || (country && !/^[A-Z]{2}$/.test(country)) || cursor.length > 2100)
    return Response.json(
      { error: "Enter between 2 and 120 characters to search Google Maps." },
      { status: 400 },
    );
  const upstream = new URLSearchParams({ query, country, cursor });
  return proxyMobilityRequest(request, `/v1/geo/place-searches?${upstream}`);
}
