/** Bound paid discovery requests across visible collections without storing provider content. */
let active = 0;
type Waiter = { start: () => void; signal?: AbortSignal; abort: () => void };
const waiting: Waiter[] = [];

function acquire(signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(signal.reason || new DOMException("Aborted", "AbortError"));
  if (active < 2) { active++; return Promise.resolve(); }
  return new Promise((resolve, reject) => {
    const waiter: Waiter = {
      signal,
      start: () => { signal?.removeEventListener("abort", waiter.abort); resolve(); },
      abort: () => { const index = waiting.indexOf(waiter); if (index >= 0) waiting.splice(index,1); reject(signal?.reason || new DOMException("Aborted", "AbortError")); },
    };
    waiting.push(waiter);
    signal?.addEventListener("abort", waiter.abort, { once: true });
  });
}
function release() {
  active--;
  while (active < 2 && waiting.length) { const waiter = waiting.shift()!; if (waiter.signal?.aborted) { waiter.abort(); continue; } active++; waiter.start(); }
}
export async function placesRequest(url: string, signal?: AbortSignal) {
  await acquire(signal);
  try { signal?.throwIfAborted(); return await fetch(url, { signal, cache: "no-store" }); }
  finally { release(); }
}
