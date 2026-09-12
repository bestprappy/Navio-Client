import { createHash } from "node:crypto";

type Entry<T> = { promise: Promise<T>; expiresAt: number };

// The production web container runs one Node process. Multiple replicas would
// require a shared coordinator (for example Redis), not independent maps.
export function createTokenRefreshCoordinator<T>(
  reuseMs = 30_000,
  now = Date.now,
) {
  const entries = new Map<string, Entry<T>>();
  return (refreshToken: string, refresh: () => Promise<T>): Promise<T> => {
    const key = createHash("sha256").update(refreshToken).digest("hex");
    for (const [entryKey, entry] of entries) {
      if (entry.expiresAt <= now()) entries.delete(entryKey);
    }
    const existing = entries.get(key);
    if (existing) return existing.promise;

    const entry: Entry<T> = {
      promise: Promise.resolve().then(refresh),
      expiresAt: Infinity,
    };
    entries.set(key, entry);
    entry.promise.then(
      () => {
        entry.expiresAt = now() + reuseMs;
        const timer = setTimeout(() => {
          if (entries.get(key) === entry) entries.delete(key);
        }, reuseMs);
        timer.unref();
      },
      () => { entries.delete(key); },
    );
    return entry.promise;
  };
}
