import type { z } from "zod";

/**
 * One request path for the profile, social and notification clients.
 *
 * Every call goes through this origin's authenticated `/api/*` proxy, which
 * attaches the access token server-side. Failures become an {@link ApiError}
 * with a sentence safe to show the user; details are logged with context.
 */

const REQUEST_TIMEOUT_MS = 20_000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    /** The service's machine-readable `error` field, such as `reauthentication_required`. */
    readonly code: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ErrorBody = { message?: unknown; error?: unknown };

function readField(body: unknown, field: keyof ErrorBody): string | null {
  if (!body || typeof body !== "object") return null;
  const value = (body as ErrorBody)[field];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** A user-facing sentence for a failed response. Service messages are already written for people. */
export function describeFailure(status: number, body: unknown): string {
  const upstream = readField(body, "message");
  if (status === 401) return "Your session has expired. Sign in again to continue.";
  if (upstream && status < 500) return upstream;
  if (status === 403) return "You don't have access to this.";
  if (status === 404) return "This could not be found.";
  if (status === 409) return "This changed somewhere else. Reload and try again.";
  if (status === 413) return "That file is too large.";
  if (status === 429) return "Too many requests at once. Wait a moment and try again.";
  return "The Navio service is unavailable right now. Try again shortly.";
}

type RequestOptions<T> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  schema?: z.ZodType<T>;
  /** Names the operation in logs, for example "followUser". */
  operation: string;
  signal?: AbortSignal;
};

export async function apiRequest<T = void>(path: string, options: RequestOptions<T>): Promise<T> {
  const { method = "GET", body, schema, operation, signal } = options;
  let response: Response;
  try {
    response = await fetch(path, {
      method,
      cache: "no-store",
      credentials: "same-origin",
      headers: body === undefined || body instanceof FormData
        ? { Accept: "application/json" }
        : { Accept: "application/json", "Content-Type": "application/json" },
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]) : AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    if (signal?.aborted) throw cause;
    const timedOut = cause instanceof Error && (cause.name === "TimeoutError" || cause.name === "AbortError");
    console.error("A Navio request could not be sent.", { component: "api-client", operation, path, timedOut });
    throw new ApiError(
      timedOut ? "The request took too long. Check your connection and try again." : "Navio could not be reached. Check your connection and try again.",
      0,
    );
  }

  let payload: unknown = null;
  if (response.status !== 204) {
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    console.error("A Navio request was rejected.", { component: "api-client", operation, path, status: response.status });
    throw new ApiError(describeFailure(response.status, payload), response.status, readField(payload, "error"));
  }

  if (!schema) return undefined as T;
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    console.error("A Navio response had an unexpected shape.", {
      component: "api-client",
      operation,
      path,
      issues: parsed.error.issues.slice(0, 5).map((issue) => issue.path.join(".")),
    });
    throw new ApiError("Navio sent an unexpected response. Try again.", 502);
  }
  return parsed.data;
}

/**
 * Multipart upload with progress, which `fetch` cannot report. Resolves with the
 * parsed JSON body; rejects with an {@link ApiError} like {@link apiRequest}.
 */
export function uploadWithProgress<T>(
  path: string,
  file: File,
  options: { schema: z.ZodType<T>; operation: string; onProgress?: (percent: number) => void },
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", path);
    request.responseType = "json";
    request.timeout = 60_000;
    request.setRequestHeader("Accept", "application/json");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) options.onProgress?.(Math.round((event.loaded / event.total) * 100));
    };
    const fail = (message: string, status: number) => {
      console.error("A Navio upload failed.", { component: "api-client", operation: options.operation, path, status });
      reject(new ApiError(message, status));
    };
    request.onerror = () => fail("The upload could not be sent. Check your connection and try again.", 0);
    request.ontimeout = () => fail("The upload took too long. Try a smaller image or a faster connection.", 0);
    request.onload = () => {
      const payload: unknown = request.response;
      if (request.status < 200 || request.status >= 300) {
        fail(describeFailure(request.status, payload), request.status);
        return;
      }
      const parsed = options.schema.safeParse(payload);
      if (!parsed.success) {
        fail("Navio sent an unexpected response. Try again.", 502);
        return;
      }
      options.onProgress?.(100);
      resolve(parsed.data);
    };
    const form = new FormData();
    form.append("file", file);
    request.send(form);
  });
}
