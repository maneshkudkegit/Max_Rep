# Max Rep Local Run Guide

## 1. Prerequisites
- Python 3.12+
- Node 22+
- Docker Desktop

## 2. Backend (local without Docker)
1. `cd backend`
2. `python -m venv .venv`
3. `.venv\Scripts\activate`
4. `pip install -r requirements.txt`
5. Copy env: `copy .env.example .env`
6. Start PostgreSQL + Redis locally (or with Docker)
7. `alembic upgrade head`
8. `python -m app.seed_admin`
9. `uvicorn app.main:app --reload`

## 3. Frontend (local without Docker)
1. `cd frontend`
2. `npm install`
3. Copy env: `copy .env.example .env`
4. `npm run dev`

## 4. Full Docker Stack (recommended)
1. `cd infra`
2. `docker compose up --build -d`
3. `docker compose exec backend alembic upgrade head`
4. `docker compose exec backend python -m app.seed_admin`
5. Open `http://localhost:8080`

## 5. Stripe Webhook Local Test (example)
1. Install Stripe CLI.
2. `stripe login`
3. Forward webhooks:
   `stripe listen --forward-to http://localhost:8080/api/v1/billing/webhook/stripe`
4. Trigger test event:
   `stripe trigger checkout.session.completed`

## 6. API Smoke Test
1. Register gym/admin via `POST /api/v1/auth/register`.
2. Confirm `/api/v1/auth/me` returns tenant, role, tier.
3. Call `/api/v1/tracking/meals`, `/api/v1/tracking/hydration`, `/api/v1/tracking/summary`.
4. Verify logout:
- `POST /api/v1/auth/logout`
- Protected call should return 401.
5. Test Max Rep AI performance engine:
- `POST /api/v1/tracking/performance-report`
- Body example:
```json
{
  "entry_text": "Breakfast: 2 eggs and oats. Lunch: chicken and rice. Workout: squat 5x5, running 20 min. Steps 9000. Water 2.4 liters.",
  "maintenance_kcal": 2200,
  "goal": "fat_loss",
  "body_weight_kg": 78,
  "save_to_daily_log": true
}
```

## 7. Useful Commands
- Run backend tests: `cd backend && pytest -q`
- Frontend build: `cd frontend && npm run build`
- Stop stack: `cd infra && docker compose down`
- Remove volumes: `cd infra && docker compose down -v`
