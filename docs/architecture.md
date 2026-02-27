# Max Rep Architecture

## Multi-Tenant Core
- `tenants`: gym organizations.
- `tenant_memberships`: role mapping (`superadmin`, `gym_admin`, `trainer`, `member`).
- Strict tenant scoping is applied from JWT claims + membership checks.

## Authentication and Logout Security
- Access + refresh JWT with claims: `jti`, `sid`, `tenant_id`, `role`, `tier`.
- HTTP-only auth cookies and CSRF header/cookie validation on mutating routes.
- Refresh token rotation with DB-backed `auth_sessions`.
- Logout revokes current refresh session and blacklists access token JTI in Redis (+ DB fallback table).
- Logout-all revokes all active sessions for a user+tenant.

## Subscription & Entitlements
- `subscriptions` per tenant with Stripe provider linkage.
- `subscription_features` supports strict server-side entitlement matrix.
- Billing webhook events stored idempotently in `billing_events`.

## Fitness Engine
- BMR: Mifflin-St Jeor.
- TDEE: activity multiplier.
- Goal adjustment: deficit/surplus.
- Macros, fiber, hydration (`weight_kg * 35ml`).
- BMI + US Navy body fat estimate.
- Context-based roadmap generation.

## Tracking + Alerts
- `daily_tracking` captures calories, macros, hydration, workouts, weight, sleep.
- Consistency score and streak fields.
- In-app notifications for hydration/meal/workout alerts.
- Email channel hook points using Resend config.

## Frontend
- Redux Toolkit for auth/session bootstrap.
- Axios interceptor for cookie-based refresh retry.
- Protected routes with `/auth/me` bootstrap.
- Colorful responsive dashboard with progress rings, stat cards, and analytics charts.

## Scaling Paths
- Multi-gym onboarding via tenant records.
- White-label styling fields in tenant model.
- AI recommendation APIs feature-flagged for later model integration.
