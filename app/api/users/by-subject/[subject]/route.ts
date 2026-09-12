import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

export async function GET(request: Request, context: { params: Promise<{ subject: string }> }) {
  const { subject } = await context.params;
  return proxyAuthenticatedApiRequest(request, `/v1/users/by-subject/${encodeURIComponent(subject)}`);
}
