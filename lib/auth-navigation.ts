export function getSafeCallbackUrl(
  value: string | null | undefined,
  fallback = "/",
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  try {
    const trustedOrigin = "https://navio.local";
    const callbackUrl = new URL(value, trustedOrigin);

    if (callbackUrl.origin !== trustedOrigin) {
      return fallback;
    }

    return `${callbackUrl.pathname}${callbackUrl.search}${callbackUrl.hash}`;
  } catch {
    return fallback;
  }
}

export function getSignInHref(callbackUrl: string): string {
  const params = new URLSearchParams({
    callbackUrl: getSafeCallbackUrl(callbackUrl),
  });
  return `/sign-in?${params.toString()}`;
}
