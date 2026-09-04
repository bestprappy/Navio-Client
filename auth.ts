import NextAuth, { type DefaultSession } from "next-auth";
import type { JWT } from "next-auth/jwt";
import Keycloak from "next-auth/providers/keycloak";

const REFRESH_BUFFER_SECONDS = 30;

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
          refresh_token: token.refreshToken,
        }),
        cache: "no-store",
      },
    );
    const responseBody: unknown = await response.json();

    if (!response.ok || !isKeycloakTokenResponse(responseBody)) {
      throw new Error(`Keycloak refresh failed with status ${response.status}.`);
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

export const { handlers, auth, signIn, signOut } = NextAuth({
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
      if (session.user && token.sub) {
        session.user.id = token.sub;
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
});

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: "RefreshTokenError";
    user: DefaultSession["user"] & {
      id?: string;
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
