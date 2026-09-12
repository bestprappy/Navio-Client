import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

export async function GET(request: Request, context: { params: Promise<{ userId: string }> }) {
  const { userId } = await context.params;
  return proxyAuthenticatedApiRequest(request, `/v1/users/${encodeURIComponent(userId)}/picture`);
}
