# Max Rep

Max Rep is a production-ready, subscription-based gym and fitness tracking SaaS built with FastAPI, PostgreSQL, Redis, React (Vite + Tailwind), and Stripe-ready billing flows.

## Stack
- Backend: FastAPI + SQLAlchemy + Alembic
- DB: PostgreSQL
- Cache/Revocation: Redis
- Frontend: React + Vite + Tailwind + Redux Toolkit + Recharts
- Payments: Stripe (checkout + webhook skeleton)
- Alerts: In-app notifications + email channel hooks
- Auth: JWT access/refresh with HTTP-only cookies, CSRF validation, token rotation, and logout blacklist support

## Core Features
- Multi-tenant SaaS model (tenant, memberships, role-scoped access)
- Subscription tiers: Free / Pro / Premium
- One-time onboarding + personalized roadmap generation
- Daily plan generation (Mifflin-St Jeor, macros, hydration, BMI/body fat estimate)
- Meal/workout/hydration/weight/sleep tracking
- Max Rep AI performance engine for natural-language daily analysis (nutrition, workout, hydration, overall score)
- Dashboard with progress rings, charts, and alerts
- Gym admin and superadmin APIs/pages

## Local Quick Start (Docker)
1. `cd infra`
2. `docker compose up --build -d`
3. `docker compose exec backend alembic upgrade head`
4. `docker compose exec backend python -m app.seed_admin`
5. Open:
- App: `http://localhost:8080`
- API docs: `http://localhost:8080/api/v1/docs` (or direct backend `http://localhost:8000/docs` if exposed)

## Local Dev (without Docker)
See `docs/local-run.md`.

## Brand Consistency
All product-facing naming in this repo uses the exact brand: **Max Rep**.
