---
description: Security review skill — automatically checks GlamCart code for common vulnerabilities
triggers:
  - "security review"
  - "check for vulnerabilities"
  - "audit security"
---

# Security Review Skill

When invoked, perform a structured security audit of the GlamCart codebase.

## Checklist

### Authentication & Authorization
- [ ] All protected routes use `authenticate` middleware from `src/middleware/auth.js`
- [ ] JWT secret is set via `JWT_SECRET` env variable (not hardcoded)
- [ ] Passwords are hashed with `bcryptjs` (never stored plain)
- [ ] `password` field is never returned in API responses

### Input Validation
- [ ] User-supplied strings are not interpolated directly into Prisma raw queries
- [ ] Numeric params (`price`, `quantity`) are parsed with `parseInt`/`parseFloat` and validated
- [ ] File uploads (if any) are restricted by type and size

### API Security
- [ ] CORS origin is restricted (not `*`) in production
- [ ] Rate limiting is in place for `/api/auth/login` and `/api/auth/register`
- [ ] Sensitive routes (`/api/orders`, `/api/users/profile`) reject unauthenticated requests with `401`

### Frontend
- [ ] No API keys or secrets in frontend source (only `NEXT_PUBLIC_*` vars allowed)
- [ ] User input rendered via React (XSS-safe by default) — no `dangerouslySetInnerHTML`
- [ ] Auth token stored in `localStorage` (acceptable for SPA; note: not HttpOnly)

## Output Format

Report findings as:
- PASS — no issue found
- WARN — potential issue, low severity
- FAIL — must fix before deploy
