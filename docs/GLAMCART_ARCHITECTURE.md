# GlamCart — Architecture Overview

## System Diagram

```
  ┌──────────────────────┐         ┌──────────────────────┐
  │   Next.js Web App    │         │  Flutter Mobile App   │
  │   localhost:3000     │         │  iOS / Android        │
  │                      │         │                       │
  │  React Context API   │         │  Flutter Provider     │
  │  ┌────────────────┐  │         │  ┌─────────────────┐  │
  │  │  AuthContext   │  │         │  │  AuthProvider   │  │
  │  │  CartContext   │  │         │  │  CartProvider   │  │
  │  └────────────────┘  │         │  └─────────────────┘  │
  │                      │         │                       │
  │  Axios (auto-JWT)    │         │  Dio (auto-JWT)       │
  └──────────┬───────────┘         └──────────┬────────────┘
             │         HTTP / JSON            │
             └─────────────┬─────────────────┘
                           │
             ┌─────────────▼──────────────────┐
             │        Express REST API         │
             │        localhost:5002           │
             │                                │
             │  ┌──────────────────────────┐  │
             │  │  JWT Middleware           │  │
             │  │  authenticate()          │  │
             │  │  → attaches req.user.id  │  │
             │  └──────────────────────────┘  │
             │                                │
             │  Routes:                       │
             │  /auth  /products  /cart       │
             │  /orders  /wishlist  /users    │
             │  /coupons  /payments           │
             │                                │
             │  Prisma ORM (singleton db.js)  │
             └─────────────┬──────────────────┘
                           │
             ┌─────────────▼──────────────────┐
             │          PostgreSQL             │
             │       db: glamcart_latest          │
             │                                │
             │  11 models: User, Product,     │
             │  CartItem, WishlistItem,        │
             │  Order, OrderItem, Address,     │
             │  Category, Brand, Review,       │
             │  Coupon                         │
             └────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| Web Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Mobile | Flutter (Dart) |
| Backend | Node.js + Express.js |
| ORM | Prisma 5 |
| Database | PostgreSQL |
| Auth | JWT (7-day) + bcrypt |
| Payments | Razorpay (test mode) |
| HTTP Client (web) | Axios |
| HTTP Client (mobile) | Dio |

---

## Authentication Flow

```
  Client                     API                      DB
    │                         │                        │
    │  POST /auth/login        │                        │
    │  { email, password }     │                        │
    │─────────────────────────►│                        │
    │                          │  findUnique(email)     │
    │                          │───────────────────────►│
    │                          │◄───────────────────────│
    │                          │  bcrypt.compare()      │
    │  { user, token }         │                        │
    │◄─────────────────────────│                        │
    │                          │                        │
    │  Store token:            │                        │
    │  localStorage (web)      │                        │
    │  SharedPreferences (app) │                        │
    │                          │                        │
    │  GET /cart               │                        │
    │  Authorization: Bearer…  │                        │
    │─────────────────────────►│                        │
    │                          │  jwt.verify()          │
    │                          │  → req.user.id         │
    │  [cart items]            │                        │
    │◄─────────────────────────│                        │
```

On 401 response → token is automatically removed from localStorage / SharedPreferences by the Axios / Dio interceptor.

---

## Checkout Flow

```
  Cart page
     │
     ▼
  Apply coupon (optional) ──► POST /coupons/validate
     │
     ▼
  Checkout Step 1: Address
     │  GET /users/addresses
     │  POST /users/addresses (if adding new)
     ▼
  Checkout Step 2: Payment Method
     │  COD / UPI / CARD / NETBANKING
     ▼
  Checkout Step 3: Review
     │
     ├── COD ──────────────────► POST /orders
     │                               │
     └── Razorpay ──────────────►  POST /payments/create-order
                                     │  (Razorpay modal opens)
                                     │  user pays
                                     ▼
                                  POST /payments/verify (HMAC check)
                                     │
                                     ▼
                                  POST /orders
                                     │
                                     ▼
                                  Cart auto-cleared
                                     │
                                     ▼
                                  Redirect → /orders/:id
```

---

## State Management

### Web (React Context)

```
  AuthContext
  ├── user          — logged-in user object (null if guest)
  ├── loading       — true while checking stored token on mount
  ├── signIn()      — saves token to localStorage, sets user state
  └── signOut()     — clears localStorage, resets user to null

  CartContext
  ├── cart[]        — array of CartItem (with nested product)
  ├── cartCount     — total item quantity (sum of all quantities)
  ├── cartTotal     — sum of price × quantity
  ├── loading       — true during any cart mutation
  ├── addItem()     — POST /cart, then refetch
  ├── updateItem()  — PATCH /cart/:id, then refetch
  ├── removeItem()  — DELETE /cart/:id, then refetch
  └── emptyCart()   — DELETE /cart (used after order placed)
```

### Mobile (Flutter Provider)

```
  AuthProvider (ChangeNotifier)
  ├── currentUser   — logged-in user object
  ├── isLoading     — true during auth operations
  ├── init()        — reads token from SharedPreferences on app start
  ├── login()       — POST /auth/login, saves token
  ├── register()    — POST /auth/register, saves token
  └── logout()      — clears SharedPreferences, resets state

  CartProvider (ChangeNotifier)
  ├── items[]       — list of CartItem
  ├── itemCount     — total quantity
  ├── totalPrice    — sum of price × quantity
  ├── fetchCart()   — GET /cart
  ├── addToCart()   — POST /cart (throws on failure)
  ├── updateItem()  — PATCH /cart/:id (throws on failure)
  └── removeItem()  — DELETE /cart/:id (throws on failure)
```

> Cart methods throw on failure so screens catch and show a red snackbar instead of a false success toast.

---

## Folder Structure

```
glamcart_clone/
├── backend/
│   ├── .env.example            # Environment variable template
│   ├── prisma/
│   │   ├── schema.prisma       # All 11 DB models
│   │   └── seed.js             # Sample data (run once)
│   └── src/
│       ├── index.js            # Express entry — routes + request logger
│       ├── db.js               # Singleton PrismaClient (shared across all routes)
│       ├── middleware/
│       │   └── auth.js         # authenticate + authorizeAdmin
│       ├── utils/
│       │   ├── jwt.js          # generateToken(payload)
│       │   └── validate.js     # validateEmail/Password/Phone/Pincode + parseIntParam
│       └── routes/
│           ├── auth.js         # /register  /login  /me
│           ├── products.js     # /products  /products/:slug
│           ├── categories.js
│           ├── brands.js
│           ├── cart.js
│           ├── wishlist.js
│           ├── orders.js
│           ├── users.js        # profile + addresses + change-password
│           ├── coupons.js      # /coupons  /coupons/validate
│           └── payments.js     # Razorpay create-order + verify
│
├── frontend/
│   └── src/
│       ├── lib/api.js          # All API calls — Axios, auto-attaches JWT
│       ├── context/
│       │   ├── AuthContext.js
│       │   └── CartContext.js
│       ├── components/
│       │   ├── Header.js
│       │   ├── Footer.js
│       │   ├── ProductCard.js
│       │   └── ui/
│       │       ├── ErrorState.js   # Reusable error UI (icon + message + retry)
│       │       └── LoadingGrid.js  # Reusable skeleton grid
│       └── app/                # Next.js App Router pages
│           ├── page.js         # Homepage
│           ├── products/       # Listing + [slug] detail
│           ├── cart/
│           ├── checkout/
│           ├── orders/
│           ├── login/
│           ├── register/
│           ├── profile/
│           └── wishlist/
│
└── glamcart_flutter/
    └── lib/
        ├── main.dart
        ├── config/api_config.dart
        ├── models/             # user, product, cart_item, order, address
        ├── providers/          # auth_provider, cart_provider
        ├── services/api_service.dart
        ├── screens/            # one file per screen
        └── widgets/product_card.dart
```

---

## Database Models

```
User ──────< Address
  │
  ├────────< CartItem >────── Product ──< Review
  │                               │
  ├────────< WishlistItem >───────┤
  │                               │
  └────────< Order >──────────────┤
                │                 │
                └───< OrderItem >─┘

Product ─── Category (self-referencing tree: parentId)
Product ─── Brand
Coupon      (standalone — validated at checkout)
```

| Model | Key constraint |
|---|---|
| `CartItem` | Composite unique: `userId + productId` — upsert increments quantity |
| `WishlistItem` | Composite unique: `userId + productId` — upsert is idempotent |
| `Order` | Snapshot pricing — `OrderItem.price` records price at time of order |
| `Category` | `parentId` self-reference for sub-categories |
| `Coupon` | `type: PERCENT \| FLAT`, capped by `maxDiscount`, gated by `minOrder` and `usageLimit` |

---

## Key Design Decisions

| Decision | Reason |
|---|---|
| Single Prisma singleton (`src/db.js`) | Prevents 8+ separate connection pools — one per route file was a resource leak |
| Axios / Dio interceptors attach JWT | No page or screen needs to manually pass the token |
| Cart `useCallback` with `[]` deps | Avoids stale closure after login — token is read from localStorage via interceptor, not React state |
| `navigator.onLine` in error handler | Distinguishes "server is down" from "no internet connection" for a correct user message |
| Shared `utils/validate.js` | Email, password, phone, pincode rules defined once — used in auth and users routes |
| `parseIntParam` / `parseFloatParam` | `parseInt("abc")` returns `NaN` silently; these helpers return `null` so routes reject with a clean 400 |
| Cart methods throw on failure (Flutter) | Screens catch and show red snackbar — no false success toast |
| `OrderItem` price snapshot | Protects against price changes after order is placed |

---

## API Base URL

| Environment | URL |
|---|---|
| Local development | `http://localhost:5002/api` |
| Android emulator | `http://10.0.2.2:5002/api` |
| Physical device (same WiFi) | `http://YOUR_LOCAL_IP:5002/api` |

All protected routes require: `Authorization: Bearer <token>`
