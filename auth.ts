import NextAuth, { type DefaultSession, type NextAuthConfig } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Keycloak from "next-auth/providers/keycloak";
import { readNavioRoles, type NavioRole } from "@/lib/navio-roles";
import { createTokenRefreshCoordinator } from "@/lib/token-refresh-coordinator";

const REFRESH_BUFFER_SECONDS = 30;
// Share across separately bundled routes in the same Node process.
const authGlobal = globalThis as typeof globalThis & {
  navioTokenRefresh?: ReturnType<typeof createTokenRefreshCoordinator<JWT>>;
};
const coordinateRefresh = authGlobal.navioTokenRefresh ??=
  createTokenRefreshCoordinator<JWT>();

type KeycloakTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
};

function isKeycloakTokenResponse(value: unknown): value is KeycloakTokenResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.access_token === "string" &&
    typeof candidate.expires_in === "number"
  );
}

/**
 * Auth.js gives every OAuth sign-in a random user id, so `token.sub` is not the Keycloak subject.
 * Services record authors by the access token subject, so read it from there. The token came from
 * Keycloak through this server and is only used to label the session, never to authorize.
 */
function readAccessTokenClaims(accessToken?: string): unknown {
  const payload = accessToken?.split(".")[1];
  if (!payload) {
    return undefined;
  }

  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return undefined;
  }
}

function getAccessTokenSubject(claims: unknown) {
  return claims &&
    typeof claims === "object" &&
    "sub" in claims &&
    typeof claims.sub === "string"
    ? claims.sub
    : undefined;
}

function getKeycloakEnvironment() {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
  const internalIssuer = process.env.AUTH_KEYCLOAK_INTERNAL_ISSUER ?? issuer;
  const clientId = process.env.AUTH_KEYCLOAK_ID;
  const clientSecret = process.env.AUTH_KEYCLOAK_SECRET;

  if (!issuer || !internalIssuer || !clientId || !clientSecret) {
    throw new Error("Keycloak authentication is not configured.");
  }

  return {
    issuer: issuer.replace(/\/$/, ""),
    internalIssuer: internalIssuer.replace(/\/$/, ""),
    clientId,
    clientSecret,
  };
}

function createKeycloakProvider() {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER?.replace(/\/$/, "");
  const internalIssuer = process.env.AUTH_KEYCLOAK_INTERNAL_ISSUER?.replace(
    /\/$/,
    "",
  );

  return Keycloak({
    issuer,
    authorization: issuer
      ? {
          url: `${issuer}/protocol/openid-connect/auth`,
          params: { scope: "openid email profile" },
        }
      : { params: { scope: "openid email profile" } },
    token: internalIssuer
      ? `${internalIssuer}/protocol/openid-connect/token`
      : undefined,
    userinfo: internalIssuer
      ? `${internalIssuer}/protocol/openid-connect/userinfo`
      : undefined,
  });
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return { ...token, error: "RefreshTokenError" };
  }

  return coordinateRefresh(token.refreshToken, () => requestAccessToken(token));
}

async function requestAccessToken(token: JWT): Promise<JWT> {

  try {
    const { internalIssuer, clientId, clientSecret } =
      getKeycloakEnvironment();
    const response = await fetch(
      `${internalIssuer}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken!,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );
    const responseBody: unknown = await response.json();

    if (!response.ok || !isKeycloakTokenResponse(responseBody)) {
      const code = responseBody && typeof responseBody === "object" &&
        "error" in responseBody && typeof responseBody.error === "string"
        ? responseBody.error : "invalid_response";
      throw new Error(`Keycloak refresh failed with status ${response.status} (${code}).`);
    }

    return {
      ...token,
      accessToken: responseBody.access_token,
      accessTokenExpiresAt:
        Math.floor(Date.now() / 1000) + responseBody.expires_in,
      refreshToken: responseBody.refresh_token ?? token.refreshToken,
      idToken: responseBody.id_token ?? token.idToken,
      error: undefined,
    };
  } catch (error) {
    console.error("AuthSession refreshAccessToken failed.", {
      error: error instanceof Error ? error.message : "Unknown refresh error",
    });
    return { ...token, error: "RefreshTokenError" };
  }
}

async function revokeKeycloakSession(refreshToken?: string) {
  if (!refreshToken) {
    return;
  }

  try {
    const { internalIssuer, clientId, clientSecret } =
      getKeycloakEnvironment();
    await fetch(`${internalIssuer}/protocol/openid-connect/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("AuthSession revokeKeycloakSession failed.", {
      error: error instanceof Error ? error.message : "Unknown logout error",
    });
  }
}

const authConfig = {
  providers: [createKeycloakProvider()],
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60,
  },
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        if (!account.access_token || !account.expires_at) {
          return { ...token, error: "RefreshTokenError" };
        }

        return {
          ...token,
          sub: account.providerAccountId,
          accessToken: account.access_token,
          accessTokenExpiresAt: account.expires_at,
          refreshToken: account.refresh_token,
          idToken: account.id_token,
          error: undefined,
        };
      }

      if (
        token.accessTokenExpiresAt &&
        Date.now() <
          (token.accessTokenExpiresAt - REFRESH_BUFFER_SECONDS) * 1000
      ) {
        return token;
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      const claims = readAccessTokenClaims(token.accessToken);
      // Sessions issued before sign-in stored the Keycloak subject still carry a random `sub`.
      const userId = getAccessTokenSubject(claims) ?? token.sub;
      if (session.user && userId) {
        session.user.id = userId;
      }
      // Display only: decides which navigation and screens appear. The gateway
      // and services authorize every request from the token itself. Roles track
      // the access token, so a change reaches the UI at the next refresh.
      if (session.user) {
        session.user.roles = token.error ? [] : readNavioRoles(claims);
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message) {
        await revokeKeycloakSession(message.token?.refreshToken);
      }
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Server Components cannot persist cookies. They only check session identity;
// rotation belongs in the session endpoint, API wrappers, and request proxy.
export const { auth: readAuth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    jwt: ({ token }) => token,
  },
});

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: "RefreshTokenError";
    user: DefaultSession["user"] & {
      id?: string;
      roles?: NavioRole[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    accessTokenExpiresAt?: number;
    refreshToken?: string;
    idToken?: string;
    error?: "RefreshTokenError";
  }
}
