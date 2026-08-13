# GlamCart Clone (GlamCart) — Project Guide for Claude Code

## Architecture
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS → `frontend/` → port 3000
- **Backend**: Node.js + Express + Prisma ORM → `backend/` → port 5002
- **Database**: PostgreSQL at `127.0.0.1:5432/glamcart_latest`
- **Payments**: Razorpay (test mode)
- **Auth**: JWT (7-day expiry) + bcrypt

## File Map (IMPORTANT — use this to locate files)

### Backend (`backend/`)
```
backend/
├── .env                          # DB URL, JWT secret, Razorpay keys
├── prisma/
│   ├── schema.prisma             # ALL database models defined here
│   └── seed.js                   # Seed data (categories, brands, products, demo user, coupon)
└── src/
    ├── index.js                  # Express entry — all routes registered here
    ├── db.js                     # Singleton PrismaClient — import this in every route
    ├── middleware/auth.js         # JWT authenticate & authorizeAdmin middleware
    ├── utils/jwt.js              # generateToken(payload) → 7-day JWT
    ├── utils/validate.js         # Shared validators: validateEmail, validatePassword, validatePhone, validatePincode
    └── routes/
        ├── auth.js               # POST register, POST login, GET me
        ├── products.js           # GET / (filters,search,pagination), GET /:slug
        ├── categories.js         # GET / (top-level), GET /:slug
        ├── brands.js             # GET /
        ├── cart.js               # GET, POST, PATCH /:productId, DELETE /:productId, DELETE /
        ├── wishlist.js           # GET, POST, DELETE /:productId
        ├── orders.js             # GET, GET /:id, POST (place order from cart)
        ├── users.js              # GET/PATCH profile, GET/POST/DELETE addresses
        ├── coupons.js            # POST /validate
        └── payments.js           # POST /create-order, POST /verify (Razorpay)
```

### Frontend (`frontend/`)
```
frontend/src/
├── lib/api.js                    # ALL API calls (Axios). Auto-attaches JWT from localStorage.
├── context/
│   ├── AuthContext.js            # Login state, token management
│   └── CartContext.js            # Cart state, add/remove/update
├── components/
│   ├── Header.js, Footer.js, ProductCard.js
│   └── ui/
│       ├── ErrorState.js         # Reusable error block (icon + message + optional retry button)
│       └── LoadingGrid.js        # Reusable skeleton loading grid
└── app/                          # Next.js App Router pages
```

## Database Models (schema.prisma)
User, Address, Category (self-referencing tree), Brand, Product, CartItem, WishlistItem, Order, OrderItem, Review, Coupon

## How to Add a New Feature

### Pattern 1: Add new data (category, brand, product, coupon)
- Edit `backend/prisma/seed.js` — follow existing `upsert` pattern
- Run: `cd backend && node prisma/seed.js`
- No route or API changes needed — existing endpoints serve them

### Pattern 2: Add a new API route
1. Create `backend/src/routes/newfeature.js` — copy structure from `cart.js` or `wishlist.js`
2. Register in `backend/src/index.js`: `app.use('/api/newfeature', newfeatureRoutes);`
3. Add API functions in `frontend/src/lib/api.js`
4. Use in frontend components via `import { ... } from '@/lib/api'`

### Pattern 3: Add a new DB model
1. Add model in `backend/prisma/schema.prisma` — follow existing model patterns
2. Run: `cd backend && npx prisma migrate dev --name description`
3. Then follow Pattern 2 to add routes

### Pattern 4: Modify existing feature
- Backend logic: edit the relevant file in `backend/src/routes/`
- Frontend API: edit `frontend/src/lib/api.js`
- Frontend UI: edit components in `frontend/src/components/` or pages in `frontend/src/app/`

## Conventions
- **Prisma**: Import singleton from `../db` — NEVER instantiate `new PrismaClient()` in route files
- **Validators**: Use helpers from `../utils/validate.js` for email, password, phone, pincode checks
- Protected routes use `authenticate` middleware from `../middleware/auth`
- Product lookup is by `slug` (not id) in public routes
- Cart uses composite unique key: `userId_productId`
- All route handlers use try/catch with generic error responses
- Seed uses `upsert` so it's safe to run multiple times
- Frontend stores token as `glamcart_token` in localStorage
- **Error UI**: Use `<ErrorState>` from `@/components/ui/ErrorState` — not inline divs
- **Loading UI**: Use `<LoadingGrid>` from `@/components/ui/LoadingGrid` — not inline skeletons

## Commands
```bash
# Install
cd backend && npm install && cd ../frontend && npm install

# Database setup
cd backend && npx prisma migrate dev --name init && node prisma/seed.js

# Run backend (terminal 1)
cd backend && npm run dev

# Run frontend (terminal 2)
cd frontend && npm run dev
```

## Demo Credentials
- Email: `demo@glamcart.com` / Password: `Demo@1234`
- Coupon: `GLAMCART10` (10% off, min ₹500)

## Color Theme
- Primary Pink: `#fc2779`
- Dark Pink: `#e01f6a`
- Light Pink: `#ffe0ef`
