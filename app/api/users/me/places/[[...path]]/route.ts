import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

type SavedPlaceProxyContext = { params: Promise<{ path?: string[] }> };

async function proxySavedPlaceRequest(
  request: Request,
  context: SavedPlaceProxyContext,
) {
  const { path = [] } = await context.params;
  const suffix = path.map(encodeURIComponent).join("/");
  return proxyAuthenticatedApiRequest(
    request,
    `/v1/users/me/places${suffix ? `/${suffix}` : ""}`,
  );
}

export const GET = proxySavedPlaceRequest;
export const POST = proxySavedPlaceRequest;
export const PATCH = proxySavedPlaceRequest;
export const DELETE = proxySavedPlaceRequest;
