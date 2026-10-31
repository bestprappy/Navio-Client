import assert from "node:assert/strict";
import { register } from "node:module";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
register(new URL("../support/typescript-loader.mjs", import.meta.url));
const { AuthActions } = await import("../../components/auth-actions.tsx");
const { ProfileMenu } = await import(
  "../../components/profile/profile-menu.tsx"
);
const { ProfileSection } = await import("../../app/feature/settings/_components/profile/profile-section.tsx");

test("expired settings session without cached profile exposes sign-in instead of a permanent skeleton", () => {
  const client = new QueryClient();
  const html = renderToStaticMarkup(React.createElement(SessionProvider, { session: { user: { id: "owner" }, expires: "2099-01-01", error: "RefreshTokenError" } }, React.createElement(QueryClientProvider, { client }, React.createElement(ProfileSection))));
  assert.match(html, /Your session has expired/);
  assert.match(html, /Sign in again/);
  assert.doesNotMatch(html, /animate-pulse/);
  client.clear();
});

for (const Component of [AuthActions, ProfileMenu]) {
  test(`${Component.name} retains normal profile access for a valid session`, () => {
    const client = new QueryClient();
    const html = renderToStaticMarkup(
      React.createElement(
        SessionProvider,
        {
          session: {
            user: { id: "owner", name: "Traveller" },
            expires: "2099-01-01",
          },
        },
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(Component),
        ),
      ),
    );
    assert.equal(
      client
        .getQueryCache()
        .find({ queryKey: ["current-user-profile", "owner"] }).options.enabled,
      true,
    );
    assert.match(html, /href="\/settings\/profile"/);
    client.clear();
  });
  test(`${Component.name} stops profile calls and offers sign-in when token refresh fails`, () => {
    const client = new QueryClient();
    const html = renderToStaticMarkup(
      React.createElement(
        SessionProvider,
        {
          session: {
            user: { id: "owner", name: "Traveller" },
            expires: "2099-01-01",
            error: "RefreshTokenError",
          },
        },
        React.createElement(
          QueryClientProvider,
          { client },
          React.createElement(Component),
        ),
      ),
    );
    assert.equal(
      client
        .getQueryCache()
        .find({ queryKey: ["current-user-profile", "owner"] }).options.enabled,
      false,
    );
    assert.match(html, /href="\/sign-in"/);
    assert.doesNotMatch(html, /href="\/settings\/profile"/);
    client.clear();
  });
}
