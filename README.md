# Navio Web Client

The Navio client is a Next.js application for EV-aware trip planning, public trip discovery, community participation, account management, and optional AI-assisted planning.

## Backend boundaries

The browser never calls Spring Cloud Gateway directly. It calls same-origin Next.js route handlers under `/api/**`, which act as a backend-for-frontend: they read the Auth.js session server-side, attach the Keycloak access token as a bearer header, and forward to the gateway. `NAVIO_API_BASE_URL` is therefore a server-only variable, and the gateway address is never present in browser code.

In production the client runs as a container in the same stack as the gateway, so those forwarded calls stay on the Docker network and never traverse NGINX or the campus network. Browser, client, and API all share one origin, which means no cross-origin requests, no CORS on the critical path, and first-party session cookies. The one browser-facing hop is the OAuth2 redirect to Keycloak, which is a top-level navigation rather than an XHR.

The browser does not call domain services, Eureka, Config Server, Keycloak administration endpoints, Ollama, or a hosted model provider directly.

Email/password login and registration still use Keycloak's browser-based
Authorization Code flow. The Navio auth pages start the appropriate login or
registration screen. Registration verifies ownership of the email address
before asking the user to create a password. Raw passwords are submitted only
to Keycloak and never pass through a Next.js route handler or Server Action.
Google remains available through the same Keycloak-backed Auth.js provider.

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

## Production deployment

The client ships as a container in the same Compose stack as the gateway,
Keycloak, and Grafana, served by NGINX at `https://navio.sit.kmutt.ac.th`. It is
not deployed separately.

`navio.sit.kmutt.ac.th` resolves to `10.4.56.58`, a private campus address. The
whole stack is therefore reachable only from the KMUTT network or VPN, and no
component may depend on being reachable from the public internet. This is why
the client is co-located rather than hosted externally: an external host's
servers could not reach the gateway or Keycloak, regardless of whether end users
are on the VPN, because the API calls are made server-side.

### Build and image

`.deploy/docker/web-client.Dockerfile` builds a Next.js standalone server
(`output: "standalone"` in `next.config.ts`) and runs it as a non-root user on
port 3000. CI publishes it as `<prefix>-web-client:<sha>` alongside the Java
service images.

`NEXT_PUBLIC_*` values are inlined by `next build`, so they are **build
arguments, not runtime environment**. They come from repository secrets in the
deploy workflow and are baked into the published image — only public,
referrer-restricted keys are acceptable there. Server-side secrets
(`AUTH_SECRET`, `AUTH_KEYCLOAK_SECRET`) are runtime environment and never build
args.

### Runtime configuration

Set in `/opt/navio/.env`; the `navio-web` service in `compose.production.yml`
maps them onto the variables this app reads.

| `.env` variable | Becomes | Notes |
| --- | --- | --- |
| `NAVIO_WEB_ORIGIN` | `AUTH_URL` | Public origin; must match the imported redirect URI |
| `AUTH_SECRET` | `AUTH_SECRET` | `openssl rand -hex 32`, dedicated value |
| `KEYCLOAK_WEB_CLIENT_SECRET` | `AUTH_KEYCLOAK_SECRET` | Same value Keycloak imported for `navio-web` |
| `KEYCLOAK_ISSUER_URI` | `AUTH_KEYCLOAK_ISSUER` | Public issuer — tokens carry it as `iss` |

Two values are fixed in the Compose file rather than `.env`:

- `NAVIO_API_BASE_URL=http://api-gateway:8080` — application API calls stay on
  the Docker network and never traverse NGINX, TLS, or the campus network.
- `NODE_EXTRA_CA_CERTS=/etc/ssl/navio/fullchain.pem` — server-side OIDC calls go
  to the public HTTPS issuer, so the deployed certificate is trusted explicitly.
  Without this a KMUTT-internal or self-signed chain fails Node's verification
  and sign-in breaks with an opaque error.

### Routing

NGINX gives the client every path not claimed by another service. `/v1/`,
`/grafana/`, `/health`, and the Keycloak paths (`/realms`, `/resources`,
`/admin`, `/js`, `/.well-known`) match first; `location /` is last and forwards
everything else — including the client's own `/api/**` BFF routes and
`/_next/**` assets — to `navio-web:3000`.

## Architecture references

- [Repository overview](../README.md)
- [Architecture](../docs/summary/Navio%20Architecture.md)
- [API documentation](../docs/api/Navio%20Api%20Documentation.md)
- [OpenAPI specification](../docs/api/Navio%20Open%20API.yaml)
