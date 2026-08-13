---
description: Testing guidelines for GlamCart — what to test, how, and what to avoid
---

# Testing — GlamCart

## Backend (Express + Prisma)

- Test all API routes with `curl` against `http://localhost:5001/api/` during development
- Use real PostgreSQL — do NOT mock the database in tests
- For protected routes, always test both:
  - Without a token → expect `401`
  - With a valid token → expect success
- Test edge cases: missing fields, invalid IDs, duplicate email on register

## Frontend (Next.js)

- Run `npm run build` before marking any task complete — build errors = broken code
- Run `npm run lint` to catch React hook rule violations and missing `'use client'` directives
- Test the golden path in-browser: add to cart → checkout → place order → view in orders
- For auth flows, test both logged-in and logged-out states

## What NOT to Test

- Do not write unit tests for Prisma queries — they are integration concerns
- Do not mock `fetch` or `axios` in component tests — use the real API client in `lib/api.js`
- Do not test Tailwind class names — visual correctness is verified by browser

## Regression Checklist

After any change, manually verify:
1. Login/register still works (`demo@glamcart.com` / `Demo@1234`)
2. Products load on homepage
3. Cart add/remove/update works
4. Wishlist toggles correctly
5. Coupon `GLAMCART10` applies at checkout
