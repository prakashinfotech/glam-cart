# /project:deploy

Prepare GlamCart for production deployment.

## Pre-deploy Checklist

1. **Build check**: `cd frontend && npm run build` — must pass with 0 errors
2. **Lint check**: `cd frontend && npm run lint`
3. **Database**: Ensure all Prisma migrations are applied: `cd backend && npx prisma migrate deploy`
4. **Environment variables**: Confirm these are set in production:
   - `DATABASE_URL` — PostgreSQL connection string
   - `JWT_SECRET` — Strong random secret (not the dev default)
   - `NODE_ENV=production`
   - `NEXT_PUBLIC_API_URL` — Public backend URL
5. **Seed**: Run `node prisma/seed.js` only on first deploy
6. **Ports**: Backend on 5001, Frontend on 3000 (or behind a reverse proxy)

## Production Flags to Change
- `backend/.env`: Set `NODE_ENV=production`
- `frontend/next.config.js`: Add domain to `images.domains` if using custom CDN
- CORS origin in `backend/src/index.js`: Update to production domain

## Git Tag
After successful deploy:
```
git tag -a v1.0.0 -m "GlamCart v1.0.0 production release"
```
