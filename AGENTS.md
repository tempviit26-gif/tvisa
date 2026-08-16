# TVISA / Lumière Jewels — Agent Instructions

## Project Overview
Jewelry e-commerce platform with Next.js frontend and Django REST API backend, using Supabase PostgreSQL with RLS.

---

## Repository Structure

```
TVISA/
├── frontend/          # Next.js 14 (App Router) + Tailwind CSS
│   ├── app/           # App Router pages & API routes
│   ├── components/    # React components (home, product, cart, layout)
│   ├── lib/           # API client, auth, queryClient, images, rateLimit
│   ├── providers/     # SessionProvider, QueryClientProvider, CartProvider
│   └── middleware.js  # Edge rate limiter for /api/auth
├── backend/           # Django 5.0.6 + DRF + SimpleJWT
│   ├── apps/          # users, products, cart, wishlist, orders
│   ├── config/        # Django settings (base/development/production)
│   └── scripts/       # Seed/test utilities
├── supabase/          # Database migrations & verification scripts
└── .mcp.json          # MCP server config (if present)
```

---

## Key Commands

### Frontend (from `frontend/`)
```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend (from `backend/`)
```bash
# Activate venv first
source venv/Scripts/activate  # Windows PowerShell: venv\Scripts\Activate.ps1

python manage.py runserver           # Dev server (port 8000)
python manage.py migrate             # Apply migrations
python manage.py makemigrations      # Create migrations
python manage.py createsuperuser     # Admin user
python manage.py collectstatic       # Static files for prod
```

### Database (from `supabase/`)
```bash
python apply_migration.py     # Apply full schema to Supabase
python verify_db.py           # List tables in Supabase
```

---

## Environment Setup

### Backend (`backend/.env` — copy from `.env.example`)
Required variables:
- `DJANGO_SETTINGS_MODULE=config.settings.development`
- `SECRET_KEY` — strong random key
- `DATABASE_URL` or `RDS_DATABASE_URL` — PostgreSQL (Supabase pooler)
- `CORS_ALLOWED_ORIGINS=http://localhost:3000`
- `FRONTEND_URL=http://localhost:3000`
- `REVALIDATION_SECRET` — shared with Next.js for ISR
- `JWT_ACCESS_TOKEN_LIFETIME=15` (minutes)
- `RESEND_API_KEY` — transactional emails
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME`, `AWS_CLOUDFRONT_DOMAIN`

### Frontend
- `NEXT_PUBLIC_API_URL` — defaults to `http://localhost:8000/api`
- `NEXTAUTH_SECRET` — must match backend expectations
- NextAuth configured in `frontend/lib/auth.js` (Credentials provider → Django JWT)

---

## Architecture Notes

### Authentication Flow
1. User logs in via NextAuth (`/api/auth/[...nextauth]`) with email/password
2. NextAuth calls Django `/api/auth/login/` → returns `{ user, tokens: { access, refresh } }`
3. NextAuth stores tokens in JWT session (`accessToken`, `refreshToken`, `accessTokenExpires`)
4. Frontend `api.js` attaches `Authorization: Bearer <accessToken>` to authenticated requests
5. Token auto-refresh at 14 min expiry via `refreshAccessToken()` in `auth.js`
4. Guest cart uses `localStorage` + `X-Guest-ID` header; merges on login

### Database (Supabase)
- Single migration: `supabase/migrations/20260807000000_create_tvisa_tables_and_relations.sql`
- 16 tables with UUID PKs, FK constraints, indexes, triggers (`updated_at`), RLS policies
- RLS: Public read on catalog tables; user-owned data restricted by `auth.uid()`
- Apply via `python supabase/apply_migration.py` (uses hardcoded Supabase pooler URL)

### API Endpoints (Django)
Prefix: `/api/`
- Auth: `/auth/register/`, `/auth/verify-otp/`, `/auth/login/`, `/auth/refresh/`, `/auth/profile/`, `/auth/addresses/`
- Products: `/products/`, `/products/homepage/*`, `/categories/`, `/subcategories/`
- Cart: `/cart/`, `/cart/items/`
- Wishlist: `/wishlist/`
- Orders: `/orders/create/`, `/orders/verify-payment/`, `/orders/`, `/orders/<id>/`

### Rate Limiting
- **Edge (Next.js)**: `middleware.js` — 10 req/min per IP on `/api/auth` POST only
- **Django (DRF)**: Throttle classes in `base.py` — `anon: 60/min`, `user: 300/min`, plus stricter scopes (`login: 5/min`, `order_create: 10/min`, etc.)
- Dev settings disable Django throttling

---

## Development Workflow

1. Start backend: `cd backend && python manage.py runserver`
2. Start frontend: `cd frontend && npm run dev`
3. Frontend at `http://localhost:3000`, API at `http://localhost:8000/api`

### Testing
- No formal test suite configured. Manual verification via scripts:
  - `backend/scripts/seed_test_data.py` — populate test data
  - `backend/scripts/test_supabase_db.py` — verify Supabase connectivity
  - `backend/scripts/live_stress_test.py` — load test

---

## Common Gotchas

| Issue | Resolution |
|-------|------------|
| Supabase pooler URL | Use port 6543 (not 5432) for transaction pooler |
| CORS errors | Ensure `CORS_ALLOWED_ORIGINS` includes frontend origin; dev allows all |
| Token refresh fails | Check `JWT_ACCESS_TOKEN_LIFETIME` matches NextAuth 14-min expiry |
| Cart not persisting | Guest cart uses `localStorage`; authenticated uses Django `/cart/` |
| Images not loading | Configure `AWS_CLOUDFRONT_DOMAIN` or `AWS_STORAGE_BUCKET_NAME` + region |
| Rate limit 429 | Edge middleware (10/min) or DRF scopes; check headers `X-RateLimit-*` |
| NextAuth secret | Must be set in `NEXTAUTH_SECRET` env var |

---

## Deploy Notes

- **Backend**: Dockerfile + `railway.json` / `render.yaml` for Railway/Render; `gunicorn` + `whitenoise` for static
- **Frontend**: Vercel (Next.js native); `REVALIDATION_SECRET` must match backend for `revalidate` API route
- **Database**: Supabase (managed PostgreSQL); migrations applied once via script
- **Static/Media**: AWS S3 + CloudFront via `django-storages` + custom `JPEGS3Storage`

---

## References
- `frontend/lib/api.js` — all API endpoints & auth/guest logic
- `frontend/lib/auth.js` — NextAuth config, JWT refresh
- `frontend/middleware.js` — edge rate limiter
- `backend/config/settings/base.py` — DRF, JWT, CORS, throttling, S3 config
- `supabase/migrations/...sql` — complete schema with RLS