---
description: Deploy skill — runs the full GlamCart pre-deployment checklist automatically
triggers:
  - "prepare for deploy"
  - "run deploy checklist"
  - "pre-deploy"
---

# Deploy Skill

When invoked, run each step in order and report status.

## Steps

1. **Frontend build**
   ```bash
   cd frontend && npm run build
   ```
   Must complete with 0 errors. If it fails, stop and report the error.

2. **Lint check**
   ```bash
   cd frontend && npm run lint
   ```
   Fix any errors before continuing.

3. **Prisma migrations**
   ```bash
   cd backend && npx prisma migrate deploy
   ```
   Ensure all migrations are applied to the target database.

4. **Environment variable check**
   Confirm these are set in the production environment:
   - `DATABASE_URL` — PostgreSQL connection string
   - `JWT_SECRET` — strong random value (not the dev default)
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_API_URL` — public backend URL

5. **API health check**
   ```bash
   curl -s http://localhost:5001/api/health
   ```
   Expect `{ "status": "ok" }`.

6. **Security review**
   Run the `security-review` skill before final deploy.

## On Success

Tag the release:
```bash
git tag -a v1.0.0 -m "GlamCart v1.0.0 production release"
```

## Ports

- Backend: `5001`
- Frontend: `3000` (or behind a reverse proxy on `443`)
