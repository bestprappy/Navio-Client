import { withAuthenticatedSession } from "@/app/api/_lib/with-authenticated-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 1800;

/**
 * Upper bound for one proxied stream. Community already ends a stream when the
 * access token it was opened with expires; the browser's EventSource then
 * reconnects through here, which refreshes the session and sends a fresh token.
 */
const STREAM_LIFETIME_MS = 25 * 60_000;

/**
 * Same-origin live notification stream. The browser cannot attach a bearer token
 * to EventSource, so this route adds it from the server-side session and pipes
 * Community's text/event-stream through unbuffered. A refused upstream answers
 * with its status and a JSON body, which closes the EventSource; the client
 * provider then backs off instead of retrying in a tight loop.
 */

export async function GET(request: Request) {
  return withAuthenticatedSession(request, async (_request, session) => {
    if (!session?.accessToken || session.error) return Response.json({ message: "Sign in again." }, { status: 401 });
    const base = process.env.NAVIO_API_BASE_URL;
    if (!base) return Response.json({ message: "Service unavailable." }, { status: 503 });
    const controller = new AbortController();
    const abort = () => controller.abort();
    request.signal.addEventListener("abort", abort, { once: true });
    const lifetime = setTimeout(abort, STREAM_LIFETIME_MS);
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
