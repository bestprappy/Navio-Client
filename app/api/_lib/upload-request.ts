const MAX_UPLOAD_REQUEST_BYTES = 6 * 1024 * 1024;

export class UploadTooLargeError extends Error {}

/** Read a bounded stream: Content-Length alone is not trustworthy. */
export async function readUploadBody(request: Request): Promise<Uint8Array<ArrayBuffer>> {
  const declared = Number(request.headers.get("content-length"));
  if (declared > MAX_UPLOAD_REQUEST_BYTES) throw new UploadTooLargeError();
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array(0);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.byteLength;
      if (size > MAX_UPLOAD_REQUEST_BYTES) {
        await reader.cancel();
        throw new UploadTooLargeError();
      }
      chunks.push(result.value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return body;
}

export function isCrossOriginMutation(request: Request, publicUrl?: string): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return false;
  if (request.headers.get("sec-fetch-site") === "cross-site") return true;
  const origin = request.headers.get("origin");
  if (!origin || origin === new URL(request.url).origin) return false;
  // A configured public origin supports deployments behind a reverse proxy.
  // Never trust caller-controlled X-Forwarded-Host as an origin allowlist.
  try { return !publicUrl || origin !== new URL(publicUrl).origin; }
  catch { return true; }
}
