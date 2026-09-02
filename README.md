# Navio Web Client

The Navio client is a Next.js application for EV-aware trip planning, public trip discovery, community participation, account management, and optional AI-assisted planning.

## Backend boundaries

The browser never calls Spring Cloud Gateway directly. It calls same-origin Next.js route handlers under `/api/**`, which act as a backend-for-frontend: they read the Auth.js session server-side, attach the Keycloak access token as a bearer header, and forward to the gateway. `NAVIO_API_BASE_URL` is therefore a server-only variable, and the gateway address is never present in browser code.

This matters for the production topology, where the client runs on Vercel and the gateway on the Navio VM. Because every application API call is server-to-server, the two origins never exchange credentialed cross-origin browser requests: session cookies stay first-party to the Vercel domain and CORS is not on the critical path. The one browser-facing hop to the VM is the OAuth2 redirect to Keycloak, which is a top-level navigation rather than an XHR.

The browser does not call domain services, Eureka, Config Server, Keycloak administration endpoints, Ollama, or a hosted model provider directly.

Google Places and Routes web-service calls are made only by Mobility & EV. The interactive basemap remains a browser-side Maps JavaScript API integration and uses a separate public key restricted to approved HTTP referrers and the Maps JavaScript API.

| Frontend capability | Public API | Owning component |
| --- | --- | --- |
| Profile, preferences, saved vehicles | `/v1/users/**` | User Management Service |
| Trips, itinerary, Explore, sharing, copies | `/v1/trips/**`, `/v1/public-trips/**`, `/v1/share/**` | Trip Planning Service |
| Places, routes, chargers, EV feasibility | `/v1/places/**`, `/v1/routes/**`, `/v1/geo/**`, `/v1/ev/**`, `/v1/chargers/**` | Mobility & EV Service |
| Groups, posts, feed, media, notifications | `/v1/community/**`, `/v1/groups/**`, `/v1/posts/**`, `/v1/feed/**`, `/v1/media/**`, `/v1/notifications/**` | Community Service |
| AI chat and planning proposals | `/v1/ai/**` | Optional AI Planning Service |
| Login and account sessions | `/auth/**` | Keycloak through the configured environment edge/auth route |

AI provider selection is invisible to the client. The same `/v1/ai/**` contract is used whether Spring AI calls Ollama on the ML VM or a hosted model API from the application VM. The client presents AI output as a proposal and requires confirmation before Trip Planning applies changes.

## Local development

Requirements:

- Node.js 20+
- npm
- A reachable Navio gateway, or configured development API mocks

Install dependencies and start the development server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Available scripts are defined in `package.json`. Keep the gateway base URL and authentication settings in environment configuration; do not embed service addresses, Config Server/Eureka endpoints, secrets, or hosted-AI API keys in browser code.

Use `NAVIO_API_BASE_URL` for the Next.js API proxy and `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` only for browser map rendering. Do not configure `GOOGLE_PLACES_API_KEY`, `GOOGLE_ROUTES_API_KEY`, `GOOGLE_MAPS_SERVER_API_KEY`, or Mapbox web-service credentials in the client environment.

Every API request should accept or generate an `X-Request-Id` and preserve trace response headers needed for support. Client-side error reporting must redact access tokens, cookies, form secrets, and sensitive trip or prompt content before it reaches the centralized observability backend.

## Production deployment (Vercel)

The client deploys to Vercel; the gateway, Keycloak, and Grafana stay on the
Navio VM behind NGINX. Full variable reference is in `.env.example`.

### Prerequisites on the VM

Keycloak must be reachable over HTTPS with a certificate from a **publicly
trusted CA**. Vercel's server-side token exchange and refresh calls verify the
chain and will fail closed against a self-signed certificate — sign-in breaks
with an opaque error. Let's Encrypt is sufficient.

### 1. Create the project

Import the `client` repository in Vercel. Framework preset is detected from
`vercel.json`, which pins functions to `sin1` (Singapore) — the closest region
to the Bangkok VM. Leaving the default `iad1` would route every API call
through Washington DC and back on each request.

### 2. Set environment variables

Add these to the **Production** environment:

| Variable | Value |
| --- | --- |
| `AUTH_SECRET` | Fresh `npx auth secret` output — not the local one |
| `AUTH_URL` | `https://<project>.vercel.app` |
| `AUTH_TRUST_HOST` | `true` |
| `AUTH_KEYCLOAK_ID` | `navio-web` |
| `AUTH_KEYCLOAK_SECRET` | Must equal `KEYCLOAK_WEB_CLIENT_SECRET` on the VM |
| `AUTH_KEYCLOAK_ISSUER` | `https://navio.sit.kmutt.ac.th/realms/navio` |
| `NAVIO_API_BASE_URL` | `https://navio.sit.kmutt.ac.th` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Referrer-restricted browser key |
| `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID` | Optional cloud map style |

Do not set `NEXT_PUBLIC_PLACE_DATA_SOURCE` in production — it forces mock data.

### 3. Point the VM at the Vercel origin

In `/opt/navio/.env`, set both to the Vercel production domain, then redeploy so
Keycloak's realm import picks up the redirect URI:

```
NAVIO_WEB_ORIGIN=https://<project>.vercel.app
NAVIO_CORS_ALLOWED_ORIGINS=https://<project>.vercel.app
```

If the realm already exists, Keycloak will **not** re-import it. Update the
`navio-web` client's Valid Redirect URIs in the admin console instead, or delete
the realm and let it reimport.

### 4. Restrict the Google Maps key

Add `https://<project>.vercel.app/*` to the key's HTTP referrer allowlist, or
the basemap fails to load in production while working locally.

### Preview deployments

Only the production domain is registered as a Keycloak redirect URI. Preview
builds render fine but **sign-in will fail** on them by design — a wildcard
redirect URI would let anyone able to deploy a matching subdomain receive
authorization codes. Test authenticated flows on production, or locally against
the deployed Keycloak.

## Architecture references

- [Repository overview](../README.md)
- [Architecture](../docs/summary/Navio%20Architecture.md)
- [API documentation](../docs/api/Navio%20Api%20Documentation.md)
- [OpenAPI specification](../docs/api/Navio%20Open%20API.yaml)
