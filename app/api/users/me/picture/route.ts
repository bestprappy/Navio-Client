import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

function proxyPicture(request: Request) { return proxyAuthenticatedApiRequest(request, "/v1/users/me/picture"); }
export const GET = proxyPicture;
export const POST = proxyPicture;
export const DELETE = proxyPicture;
