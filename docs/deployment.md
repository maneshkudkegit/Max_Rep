# Deployment Guide - Max Rep

## Backend (Render / AWS)

### Render
1. Create PostgreSQL + Redis instances.
2. Deploy `backend/` as Web Service.
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Env: use `backend/.env.example` keys.
6. Run migrations: `alembic upgrade head`
7. Seed: `python -m app.seed_admin`

### AWS (App Runner or ECS)
1. Build/push backend image.
2. Attach RDS PostgreSQL + ElastiCache Redis.
3. Configure env vars and health check `/health`.
4. Run Alembic migration job during deploy.

## Frontend (Vercel / Netlify)
1. Deploy `frontend/`.
2. Build command: `npm run build`
3. Output: `dist`
4. Set `VITE_API_BASE_URL` to backend public `/api/v1` endpoint.

## Managed Services
- PostgreSQL: RDS/Neon/Supabase.
- Redis: ElastiCache/Upstash/Redis Cloud.
- Payments: Stripe.
- Email: Resend.

## Production Checklist
- Set `COOKIE_SECURE=true` in production.
- Restrict CORS origins.
- Rotate `SECRET_KEY` and provider keys.
- Enable HTTPS + WAF/rate limits.
- Monitor failed auth and webhook events.
