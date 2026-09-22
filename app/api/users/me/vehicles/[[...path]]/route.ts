import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

type VehicleProxyContext = { params: Promise<{ path?: string[] }> };

async function proxyVehicleRequest(request: Request, context: VehicleProxyContext) {
  const { path = [] } = await context.params;
  const suffix = path.map(encodeURIComponent).join("/");
  return proxyAuthenticatedApiRequest(request, `/v1/users/me/vehicles${suffix ? `/${suffix}` : ""}`, {
    allowAnonymous: request.method === "GET" && path.length === 1 && path[0] === "catalog",
  });
}

export const GET = proxyVehicleRequest;
export const POST = proxyVehicleRequest;
export const PATCH = proxyVehicleRequest;
export const DELETE = proxyVehicleRequest;
