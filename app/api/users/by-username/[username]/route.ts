import { proxySegments } from "@/app/api/_lib/path-proxy";

type Context = { params: Promise<{ username: string }> };

async function proxy(request: Request, context: Context) {
  const { username } = await context.params;
  return proxySegments(request, "/v1/users/by-username", [username]);
}

export const GET = proxy;
