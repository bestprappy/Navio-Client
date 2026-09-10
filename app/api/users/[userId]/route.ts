import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { proxyAuthenticatedApiRequest } from "@/app/api/_lib/authenticated-api-proxy";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  if (!z.string().uuid().safeParse(userId).success) {
    return NextResponse.json(
      { message: "Invalid member ID." },
      { status: 400 },
    );
  }
  return proxyAuthenticatedApiRequest(
    request,
    `/v1/users/${encodeURIComponent(userId)}`,
  );
}
