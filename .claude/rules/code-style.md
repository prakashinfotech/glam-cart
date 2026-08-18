# Code Style — GlamCart

## General
- JavaScript only (no TypeScript) for both frontend and backend
- No semicolons in frontend (Next.js convention)
- 2-space indentation throughout
- Single quotes for strings

## Frontend (Next.js)
- Add `'use client'` at top of any component using hooks, browser APIs, or event handlers
- Use functional components only — no class components
- Import order: React → Next.js → third-party → local (`@/`)
- Tailwind classes only — no inline styles, no CSS modules
- Use `glamcart-*` color tokens from `tailwind.config.js` (e.g. `text-glamcart-pink`, `bg-glamcart-pink-pale`)
- All API calls go through `frontend/src/lib/api.js` — never call fetch/axios directly in components

## Backend (Express)
- All routes must use try/catch with a consistent error response: `res.status(5xx).json({ error: '...' })`
- Protected routes must use the `authenticate` middleware from `src/middleware/auth.js`
- Never return the `password` field in user responses
- Use Prisma `select` to whitelist returned fields instead of excluding

## Naming
- React components: PascalCase (`ProductCard.js`)
- API route files: camelCase (`products.js`)
- Database models: PascalCase (Prisma schema)
- URL slugs: kebab-case (`/products/lakme-foundation`)
