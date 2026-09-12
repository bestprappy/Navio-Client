import { z } from "zod";

export const savedPlaceKindSchema = z.enum(["HOME", "WORK", "CUSTOM"]);

export const savedPlaceSchema = z.object({
  id: z.uuid(),
  label: z.string().min(1),
  kind: savedPlaceKindSchema,
  name: z.string().min(1),
  address: z.string().nullable(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  providerPlaceId: z.string().nullable(),
  isDefault: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const createSavedPlaceSchema = z.object({
  label: z.string().trim().min(1, "Give this place a name.").max(80),
  kind: savedPlaceKindSchema,
  name: z.string().trim().min(1).max(255),
  address: z.string().trim().max(512).optional(),
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
  providerPlaceId: z.string().max(512).optional(),
});

export type SavedPlaceKind = z.infer<typeof savedPlaceKindSchema>;
export type SavedPlace = z.infer<typeof savedPlaceSchema>;
export type CreateSavedPlaceInput = z.infer<typeof createSavedPlaceSchema>;

export class SavedPlaceApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "SavedPlaceApiError";
  }
}

async function savedPlaceRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/users/me/places${path}`, {
      ...init,
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      signal: init?.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(20_000)])
        : AbortSignal.timeout(20_000),
    });
  } catch (cause) {
    if (init?.signal?.aborted) throw cause;
    console.error("Saved place request failed.", {
      component: "saved-place-api",
      operation: init?.method ?? "GET",
      path,
      cause,
    });
    throw new SavedPlaceApiError(
      "Could not reach your saved places. Check your connection and try again.",
      0,
    );
  }

  const body: unknown =
    response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    console.error("Saved place request was rejected.", {
      component: "saved-place-api",
      path,
      status: response.status,
    });
    const details = z
      .object({
        message: z.string(),
        validationErrors: z.record(z.string(), z.string()).optional(),
      })
      .safeParse(body);
    const message =
      response.status === 401
        ? "Your session has expired. Please sign in again."
        : response.status === 404
          ? "That saved place is no longer available."
          : response.status >= 500
            ? "Your saved places are temporarily unavailable. Please try again."
            : details.success
              ? Object.values(details.data.validationErrors ?? {}).join(" ") ||
                details.data.message
              : "Could not save that place. Please try again.";
    throw new SavedPlaceApiError(message, response.status);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    console.error("Unexpected saved place response.", {
      component: "saved-place-api",
      path,
      fields: parsed.error.issues.map((issue) => issue.path.join(".")),
    });
    throw new SavedPlaceApiError(
      "Your saved places returned an unexpected response. Please try again.",
      502,
    );
  }
  return parsed.data;
}

export function listSavedPlaces(signal?: AbortSignal): Promise<SavedPlace[]> {
  return savedPlaceRequest("", z.array(savedPlaceSchema), { signal });
}

export function createSavedPlace(input: CreateSavedPlaceInput): Promise<SavedPlace> {
  return savedPlaceRequest("", savedPlaceSchema, {
    method: "POST",
    body: JSON.stringify(createSavedPlaceSchema.parse(input)),
  });
}

export function deleteSavedPlace(placeId: string): Promise<null> {
  return savedPlaceRequest(`/${encodeURIComponent(placeId)}`, z.null(), {
    method: "DELETE",
  });
}

export const savedPlacesQueryKey = ["saved-places"] as const;
