# Phase 0 Runbook

## Setup

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Create or update `.env.local` with the values required for:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `R2_ACCOUNT_ID`
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_BUCKET_NAME`
   - `R2_PUBLIC_URL`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - `RESEND_FROM_NAME`
   - `SENTRY_DSN`
   - `SENTRY_AUTH_TOKEN`
3. Run database migration and seed:
   ```bash
   npm run drizzle:push
   npm run seed
   ```

## Local validation

- `npm run build`
- `npm run lint`

## Smoke test endpoints

- `GET /api/v1/test/health` — checks DB and Redis connectivity flags
- `POST /api/v1/test/send-email` — sends a test Resend email
- `POST /api/v1/test/cache` — verifies Upstash Redis set/get
- `POST /api/v1/test/r2-upload` — verifies Cloudflare R2 upload

## Local test scripts

- `npm run seed` — seed default admin and shop config
- `npm run test:email` — send a Resend test email using `.env.local`

## Notes

- The project uses Next.js 16 App Router, Drizzle ORM, NextAuth, Cloudflare R2, Upstash Redis, Sentry, and Resend.
- `src/app/api/v1/test/health/route.ts` provides a lightweight health check endpoint.
- `src/lib/email/resend.ts` is the Resend email helper.

## Recommended next step

- Deploy to Vercel and then request the user provide the deployment URL for final smoke testing.
