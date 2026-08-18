---
description: REST API conventions for GlamCart backend (Express + Prisma)
---

# API Conventions — GlamCart

## URL Structure

- Base: `/api/`
- Collections: `/api/products`, `/api/orders`
- Single resource: `/api/products/:slug`, `/api/orders/:id`
- Sub-resources: `/api/users/addresses`, `/api/users/profile`
- Actions: `/api/coupons/validate`, `/api/auth/login`

## HTTP Methods

| Action | Method | Example |
|--------|--------|---------|
| List | GET | `GET /api/products` |
| Get one | GET | `GET /api/products/:slug` |
| Create | POST | `POST /api/cart` |
| Update (partial) | PATCH | `PATCH /api/cart/:productId` |
| Delete | DELETE | `DELETE /api/wishlist/:productId` |

## Response Shape

**Success:**
```json
{ "data": ... }
```
or for lists:
```json
{ "products": [...], "total": 42 }
```

**Error:**
```json
{ "error": "Human-readable message" }
```

## Status Codes

- `200` — success
- `201` — resource created
- `400` — bad request / validation error
- `401` — missing or invalid token
- `403` — authenticated but not authorized
- `404` — resource not found
- `500` — unexpected server error

## Auth

- All protected routes must import and use `authenticate` from `src/middleware/auth.js`
- The middleware attaches `req.user` (id, email) on success
- Never expose the `password` field — use Prisma `select` to whitelist fields

## Query Parameters (Products)

| Param | Type | Example |
|-------|------|---------|
| `category` | string | `?category=skincare` |
| `brand` | string | `?brand=lakme` |
| `search` | string | `?search=foundation` |
| `featured` | boolean | `?featured=true` |
| `bestseller` | boolean | `?bestseller=true` |
| `minPrice` | number | `?minPrice=200` |
| `maxPrice` | number | `?maxPrice=1000` |
