#!/usr/bin/env bash
# GlamCart API — flow and edge-case tests
# Usage: ./test-flows.sh
# Requires: backend running on localhost:5002

set -euo pipefail

BASE="http://localhost:5002/api"
DEMO_EMAIL="demo@glamcart.com"
DEMO_PASS="Demo@1234"
TEST_EMAIL="testuser_$$@example.com"  # unique per run

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ PASS${NC} $1"; }
fail() { echo -e "${RED}✗ FAIL${NC} $1"; }
section() { echo -e "\n${YELLOW}── $1 ──${NC}"; }

assert_status() {
  local label="$1" expected="$2" actual="$3"
  if [ "$actual" = "$expected" ]; then pass "$label (HTTP $actual)";
  else fail "$label — expected HTTP $expected, got $actual"; fi
}

# ─── Health ───────────────────────────────────────────────────────────────────
section "Health Check"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/health")
assert_status "GET /health" "200" "$STATUS"

# ─── Auth — Happy Path ────────────────────────────────────────────────────────
section "Auth — Register"
REG=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"$TEST_EMAIL\",\"password\":\"Test@1234\"}")
REG_BODY=$(echo "$REG" | head -1)
REG_STATUS=$(echo "$REG" | tail -1)
assert_status "POST /auth/register" "201" "$REG_STATUS"
TOKEN=$(echo "$REG_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

section "Auth — Login"
LOGIN=$(curl -s -w "\n%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DEMO_EMAIL\",\"password\":\"$DEMO_PASS\"}")
LOGIN_BODY=$(echo "$LOGIN" | head -1)
LOGIN_STATUS=$(echo "$LOGIN" | tail -1)
assert_status "POST /auth/login" "200" "$LOGIN_STATUS"
DEMO_TOKEN=$(echo "$LOGIN_BODY" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

section "Auth — GET /me"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer $DEMO_TOKEN")
assert_status "GET /auth/me (valid token)" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me" \
  -H "Authorization: Bearer invalidtoken")
assert_status "GET /auth/me (invalid token → 401)" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/auth/me")
assert_status "GET /auth/me (no token → 401)" "401" "$STATUS"

# ─── Auth — Edge Cases ────────────────────────────────────────────────────────
section "Auth — Edge Cases"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"A","email":"bad-email","password":"Test@1234"}')
assert_status "Register: invalid email → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"ok@test.com","password":"short"}')
assert_status "Register: weak password → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"ok@test.com","password":"nospecialchar1"}')
assert_status "Register: no special char → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test\",\"email\":\"$DEMO_EMAIL\",\"password\":\"Test@1234\"}")
assert_status "Register: duplicate email → 409" "409" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@glamcart.com","password":"wrongpassword"}')
assert_status "Login: wrong password → 401" "401" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"notfound@example.com","password":"Test@1234"}')
assert_status "Login: unknown email → 401" "401" "$STATUS"

# ─── Products ─────────────────────────────────────────────────────────────────
section "Products — Happy Path"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/products")
assert_status "GET /products" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/products?category=skincare&sort=price_asc&limit=5")
assert_status "GET /products?category=skincare&sort=price_asc" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/products?featured=true&limit=8")
assert_status "GET /products?featured=true" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/products?search=foundation")
assert_status "GET /products?search=foundation" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/products?minPrice=100&maxPrice=500")
assert_status "GET /products?minPrice=100&maxPrice=500" "200" "$STATUS"

section "Products — Edge Cases"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/products?minPrice=abc&maxPrice=xyz")
assert_status "GET /products (non-numeric price → 200, NaN safely ignored)" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/products/this-slug-does-not-exist-xyz")
assert_status "GET /products/:slug (not found → 404)" "404" "$STATUS"

# ─── Cart — Happy Path ────────────────────────────────────────────────────────
section "Cart — Happy Path"

# Get first product id from products list
PRODUCTS=$(curl -s "$BASE/products?limit=1")
PRODUCT_ID=$(echo "$PRODUCTS" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/cart" \
  -H "Authorization: Bearer $DEMO_TOKEN")
assert_status "GET /cart" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/cart" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":$PRODUCT_ID,\"quantity\":2}")
assert_status "POST /cart (add item)" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/cart/$PRODUCT_ID" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity":3}')
assert_status "PATCH /cart/:productId (update qty)" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/cart/$PRODUCT_ID" \
  -H "Authorization: Bearer $DEMO_TOKEN")
assert_status "DELETE /cart/:productId (remove)" "200" "$STATUS"

section "Cart — Edge Cases"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/cart" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":9999999,"quantity":1}')
assert_status "POST /cart: non-existent product → 404" "404" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/cart" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":$PRODUCT_ID,\"quantity\":0}")
assert_status "POST /cart: quantity=0 → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/cart" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":$PRODUCT_ID,\"quantity\":-5}")
assert_status "POST /cart: negative quantity → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/cart" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId":"notanumber","quantity":1}')
assert_status "POST /cart: non-integer productId → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/cart/notanumber" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"quantity":1}')
assert_status "PATCH /cart/notanumber → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE/cart/$PRODUCT_ID" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}')
assert_status "PATCH /cart: missing quantity → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/cart" \
  -H "Content-Type: application/json" \
  -d "{\"productId\":$PRODUCT_ID,\"quantity\":1}")
assert_status "POST /cart: no auth → 401" "401" "$STATUS"

# ─── Coupons ─────────────────────────────────────────────────────────────────
section "Coupons — Happy Path"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/coupons")
assert_status "GET /coupons (public)" "200" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/coupons/validate" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"GLAMCART10","orderAmount":600}')
assert_status "POST /coupons/validate (valid coupon)" "200" "$STATUS"

section "Coupons — Edge Cases"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/coupons/validate" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"GLAMCART10","orderAmount":200}')
assert_status "Coupon: below minOrder → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/coupons/validate" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"FAKECODE999","orderAmount":600}')
assert_status "Coupon: invalid code → 404" "404" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/coupons/validate" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"orderAmount":600}')
assert_status "Coupon: missing code → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/coupons/validate" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"GLAMCART10"}')
assert_status "Coupon: missing orderAmount → 400" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/coupons/validate" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"GLAMCART10","orderAmount":-100}')
assert_status "Coupon: negative orderAmount → 400" "400" "$STATUS"

# ─── Orders — Edge Cases ──────────────────────────────────────────────────────
section "Orders — Edge Cases"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/orders/abc" \
  -H "Authorization: Bearer $DEMO_TOKEN")
assert_status "GET /orders/abc (non-numeric id → 400)" "400" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/orders/9999999" \
  -H "Authorization: Bearer $DEMO_TOKEN")
assert_status "GET /orders/9999999 (not found → 404)" "404" "$STATUS"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/orders" \
  -H "Authorization: Bearer $DEMO_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"paymentMethod":"BITCOIN"}')
assert_status "POST /orders: invalid paymentMethod → 400" "400" "$STATUS"

# ─── Users — Edge Cases ───────────────────────────────────────────────────────
section "Users — Edge Cases"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE/users/addresses/abc" \
  -H "Authorization: Bearer $DEMO_TOKEN")
assert_status "DELETE /addresses/abc (non-numeric id → 400)" "400" "$STATUS"

# ─── Summary ──────────────────────────────────────────────────────────────────
echo -e "\n${GREEN}All tests completed.${NC}"
echo "Note: Each FAIL above represents an edge case that was not handled correctly."
