# GlamCart — Setup Guide

## Prerequisites

| Tool | Version | Download |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| PostgreSQL | 14+ | https://postgresql.org |
| Flutter SDK | 3.x | https://flutter.dev |
| Git | any | https://git-scm.com |

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/hamja-prakash/glamcart_clone.git
cd glamcart_clone
```

---

## Step 2 — Create the PostgreSQL database

```bash
psql -U postgres -c "CREATE DATABASE glamcart_latest;"
```

> If your Postgres user or password differs, update `DATABASE_URL` in Step 3 accordingly.

---

## Step 3 — Backend setup

```bash
cd backend
npm install
cp .env.example .env   # then edit .env with your values
```

### backend/.env

```env
DATABASE_URL="postgresql://postgres:password@127.0.0.1:5432/glamcart_latest"
JWT_SECRET="any-long-random-string"
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
PORT=5002
```

> Razorpay test credentials are free at https://dashboard.razorpay.com  
> Without them, Razorpay flows won't work — but COD, cart, and all other features still work.

### Run migrations and seed

```bash
npm run db:migrate    # creates all tables
npm run db:seed       # inserts categories, brands, 40+ products, coupons, demo user
```

### Start the backend

```bash
npm run dev
```

### Verify it's running

```bash
curl http://localhost:5002/api/health
# Expected: {"status":"ok","message":"GlamCart API running"}
```

---

## Step 4 — Frontend (Web) setup

```bash
cd frontend
npm install
```

Optionally create `frontend/.env.local` if your backend runs on a different port:

```env
NEXT_PUBLIC_API_URL=http://localhost:5002/api
```

> If absent, defaults to `http://localhost:5002/api`.

```bash
npm run dev
```

Open http://localhost:3000

---

## Step 5 — Flutter (Mobile) setup

```bash
cd glamcart_flutter
flutter pub get
```

Update the API URL in `lib/config/api_config.dart`:

```dart
// Same machine (iOS Simulator or web):
static const String baseUrl = 'http://localhost:5002/api';

// Android emulator (maps to your machine's localhost):
static const String baseUrl = 'http://10.0.2.2:5002/api';

// Physical device on the same WiFi:
static const String baseUrl = 'http://YOUR_LOCAL_IP:5002/api';
```

```bash
flutter run
```

---

## Available Scripts

### Backend (`cd backend`)

| Script | Command | What it does |
|---|---|---|
| Dev server | `npm run dev` | Start with nodemon (auto-restart on file change) |
| Production | `npm start` | Start with node (no auto-restart) |
| Migrate DB | `npm run db:migrate` | Run Prisma migrations |
| Seed DB | `npm run db:seed` | Insert sample data |
| Reset DB | `npm run db:reset` | Drop all data and re-seed |
| DB browser | `npm run db:studio` | Open Prisma Studio at localhost:5555 |

### Frontend (`cd frontend`)

| Script | Command | What it does |
|---|---|---|
| Dev server | `npm run dev` | Hot-reload dev server at port 3000 |
| Build | `npm run build` | Create production bundle |
| Production | `npm start` | Serve the production build (run build first) |
| Lint | `npm run lint` | Run ESLint |

### Flutter (`cd glamcart_flutter`)

| Command | What it does |
|---|---|
| `flutter pub get` | Install dependencies |
| `flutter run` | Run on connected device or emulator |
| `flutter build apk` | Build Android APK |
| `flutter build ios` | Build iOS app (requires Mac + Xcode) |

---

## Demo Credentials

| Field | Value |
|---|---|
| Email | `demo@glamcart.com` |
| Password | `Demo@1234` |
| Coupon | `GLAMCART10` (10% off, min ₹500) |

---

## Troubleshooting

| Problem | Cause | Fix |
|---|---|---|
| `EADDRINUSE :::5002` | Previous server still running | `lsof -ti :5002 \| xargs kill -9` |
| `EADDRINUSE :::3000` | Previous Next.js still running | `lsof -ti :3000 \| xargs kill -9` |
| `Cannot find module '.prisma/client'` | Prisma client not generated | `cd backend && npx prisma generate` |
| `npm start` fails with BUILD_ID error | No production build exists | Run `npm run build` first, then `npm start` |
| Flutter: connection refused on Android emulator | `localhost` doesn't resolve in emulator | Use `10.0.2.2` instead of `localhost` |
| Products show "Server is unavailable" | Backend not running | Start backend: `npm run dev` in `backend/` |
| `Invalid database URL` | Wrong Postgres credentials | Check `DATABASE_URL` in `backend/.env` |
