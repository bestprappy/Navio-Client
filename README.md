# Navio Web Client

The Navio client is a Next.js application for EV-aware trip planning, public trip discovery, community participation, account management, and optional AI-assisted planning.

## Backend boundaries

The browser calls Spring Cloud Gateway for all `/v1/**` application APIs. Development connects directly to gateway port `8080`; production connects through NGINX, which forwards to the same gateway. The browser does not call domain services, Eureka, Config Server, Keycloak administration endpoints, Ollama, or a hosted model provider directly.

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

## Architecture references

- [Repository overview](../README.md)
- [Architecture](../docs/summary/Navio%20Architecture.md)
- [API documentation](../docs/api/Navio%20Api%20Documentation.md)
- [OpenAPI specification](../docs/api/Navio%20Open%20API.yaml)
