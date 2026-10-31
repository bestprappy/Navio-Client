import { withAuthenticatedSession } from "@/app/api/_lib/with-authenticated-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  return withAuthenticatedSession(request, async (_request, session) => {
    if (!session?.accessToken || session.error) return Response.json({ message: "Sign in again." }, { status: 401 });
    const base = process.env.NAVIO_API_BASE_URL;
    if (!base) return Response.json({ message: "Service unavailable." }, { status: 503 });
    const controller = new AbortController();
    const abort = () => controller.abort();
    request.signal.addEventListener("abort", abort, { once: true });
    const lifetime = setTimeout(abort, 50_000);
    const cleanup = () => { clearTimeout(lifetime); request.signal.removeEventListener("abort", abort); };
    try {
      const upstream = await fetch(new URL("/v1/notifications/stream", base), {
        headers: { Authorization: `Bearer ${session.accessToken}`, Accept: "text/event-stream" },
        cache: "no-store", signal: controller.signal,
      });
      if (!upstream.ok || !upstream.body || !upstream.headers.get("content-type")?.includes("text/event-stream")) {
        cleanup(); controller.abort();
        return Response.json({ message: "Live updates unavailable." }, { status: upstream.ok ? 502 : upstream.status });
      }
      const reader = upstream.body.getReader();
      const body = new ReadableStream<Uint8Array>({
        async pull(stream) {
          try {
            const { done, value } = await reader.read();
            if (done) { cleanup(); stream.close(); }
            else stream.enqueue(value);
          } catch { cleanup(); stream.close(); }
        },
        async cancel() { cleanup(); controller.abort(); await reader.cancel().catch(() => undefined); },
      });
      return new Response(body, { headers: {
        "Content-Type": "text/event-stream", "Cache-Control": "private, no-store", "X-Accel-Buffering": "no",
      } });
    } catch { cleanup(); controller.abort(); return Response.json({ message: "Live updates unavailable." }, { status: 503 }); }
  });
}
