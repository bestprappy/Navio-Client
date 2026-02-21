# Navio Client

> **The frontend application for Navio** — a Next.js-powered trip planning platform with Keycloak authentication, intelligent EV routing, and a Reddit-like community layer.

---

## Tech Stack

| Layer             | Technology             | Purpose                                    |
| ----------------- | ---------------------- | ------------------------------------------ |
| **Framework**     | Next.js                | SSR/SSG, routing, API layer                |
| **Auth**          | Keycloak JS / NextAuth | OIDC sign-up/sign-in flow                  |
| **Validation**    | Zod                    | Client-side form validation                |
| **Rate Limiting** | Arcjet                 | App-level, auth-aware rate limiting        |
| **Maps**          | Google Maps / Mapbox   | Route rendering, stop placement, polylines |

---

## Authentication & IAM Integration

The client integrates with **Keycloak** (OIDC) for identity management and relies on the backend **IAM module** (inside Trip & Media Service) for authorization and user profile management.

### Authentication Flow

1. **Sign-up / Sign-in** — User authenticates via Keycloak (OIDC). Keycloak issues a JWT containing `sub` (userId), `email`, and `name` claims.
2. **Token Storage** — JWT is managed by NextAuth / Keycloak JS adapter client-side.
3. **Authenticated Requests** — Every API call to the backend includes the JWT in the `Authorization: Bearer <token>` header.
4. **Backend Validation** — Each Spring Boot service independently validates the JWT against Keycloak's JWKS endpoint. The client does **not** handle authorization decisions.
5. **User Profile Sync** — On first authenticated request, the backend IAM module automatically syncs the user's Keycloak profile to `iam.users` and publishes a `UserRegistered.v1` event to Kafka.

### IAM-Dependent Features

| Feature                     | How IAM Is Involved                                                                                       |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| **User Profile (`/v1/me`)** | Client fetches/updates the current user's profile and preferences from the IAM module                     |
| **Trip Access Control**     | IAM's ACL engine (owner/editor/viewer) determines which trips a user can view, edit, or manage            |
| **Collaborator Management** | Client UI for adding/removing trip collaborators — delegates to IAM ACL grant/revoke endpoints            |
| **Moderation Tools**        | Ban/unban UI for mod/admin users — calls `/v1/mod/users/{userId}/ban` and `/v1/mod/users/{userId}/unban`  |
| **Role-Based UI**           | Client conditionally renders admin/mod features based on the user's role from the profile response        |
| **Public Share Links**      | Share link resolution (`GET /v1/share/{token}`) is the only public route that bypasses JWT authentication |

### Key Endpoints Used by the Client

| Method | Endpoint                         | Auth      | Purpose                         |
| ------ | -------------------------------- | --------- | ------------------------------- |
| GET    | `/v1/me`                         | JWT       | Fetch current user profile      |
| PATCH  | `/v1/me/preferences`             | JWT       | Update notification/theme prefs |
| POST   | `/v1/mod/users/{userId}/ban`     | Mod/Admin | Ban a user                      |
| POST   | `/v1/mod/users/{userId}/unban`   | Mod/Admin | Unban a user                    |
| GET    | `/v1/share/{token}`              | None      | Resolve a public share link     |
| POST   | `/v1/trips/{tripId}/permissions` | Owner     | Grant collaborator access       |
| GET    | `/v1/trips/{tripId}/permissions` | Owner     | List trip collaborators         |

### Keycloak Configuration

The client requires the following Keycloak settings:

| Setting           | Description                                    |
| ----------------- | ---------------------------------------------- |
| **Realm**         | `tripplanner`                                  |
| **Client ID**     | OIDC public client registered in Keycloak      |
| **Issuer URI**    | `http://localhost:8180/realms/tripplanner`     |
| **JWKS Endpoint** | Auto-discovered from Keycloak OIDC metadata    |
| **Redirect URIs** | Configured per environment (localhost for dev) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

---

## Related Documentation

- [System Design (Summary)](../docs/Summary.md)
- [Database Design](../docs/Database.md)
- [Implementation Guide](../docs/Implementation.md)
