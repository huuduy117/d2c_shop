# Progress Report: Implementation Plan Comparison
**Date:** 2026-06-04  
**Current Status:** Sub-phase 1.6 Storefront UI Completed

---

## Phase 0 — Foundation ✅ COMPLETED

| Task | Status | Notes |
|---|---|---|
| Next.js 16 + TypeScript setup | ✅ | App Router configured |
| Drizzle ORM + Neon PostgreSQL | ✅ | Full schema migration applied |
| NextAuth.js v4 with roles | ✅ | `buyer` / `admin` roles working |
| PDPA consent flow | ✅ | Required checkbox + version tracking |
| Middleware for `/admin/*` | ✅ | Role verification server-side |
| Seed data | ✅ | Admin + 2 branches + 5 categories + 10 products |
| API versioning `/api/v1/` | ✅ | All endpoints prefixed correctly |
| Cloudflare R2, Upstash Redis, Sentry | ✅ | Configuration ready |

**Exit Criteria:** ✅ Met

---

## Phase 1 — Storefront & Buyer Core (Week 2–4)

### Sub-phase 1.1–1.5: API & Backend ✅ COMPLETED

| Item | Status | Details |
|---|---|---|
| Products API (list, detail, filter, search) | ✅ | `/api/v1/products` with pagination |
| Categories tree API | ✅ | `/api/v1/categories` with hierarchy |
| Addresses CRUD | ✅ | `/api/v1/addresses/*` — create/read/update/delete |
| Wishlist API | ✅ | `/api/v1/wishlist` — add/remove/list |
| Shipping estimate (mock GHN) | ✅ | `/api/v1/shipping/estimate` |
| Nearest branch finder | ✅ | `/api/v1/shipping/nearest-branch` with Haversine |
| Order creation + state machine | ✅ | `/api/v1/orders` with pessimistic locking |
| Order listing, detail, cancellation | ✅ | `/api/v1/orders/*` complete |
| Voucher validation | ✅ | `/api/v1/vouchers/validate` |
| Mock VNPay payment | ✅ | Mock service + webhook handler |
| Mock MoMo payment | ✅ | Mock service + webhook handler |
| COD payment flow | ✅ | Order created with COD status |
| Inventory locking (pessimistic) | ✅ | PostgreSQL `SELECT FOR UPDATE` |

**Status:** ✅ All API endpoints functional (mock integrations)

### Sub-phase 1.6: Storefront UI ✅ COMPLETED

| Page/Component | Status | Details |
|---|---|---|
| Homepage | ✅ | Banner + featured products + categories |
| Product listing | ✅ | Grid + filters (category, price) + sort + pagination |
| Product detail | ✅ | Image gallery + variant selector + stock per branch |
| Shopping cart | ✅ | Zustand store + localStorage persistence |
| Checkout flow (5 steps) | ✅ | Address → Shipping → Payment → Confirm → Success |
| Address step | ✅ | Select/create address + branch suggestion |
| Shipping step | ✅ | Branch selection + fee calculation |
| Payment step | ✅ | Payment method + voucher application |
| Order summary sidebar | ✅ | Price breakdown + total |
| Layout & header | ✅ | Navigation + cart badge + user menu |

**Status:** ✅ All buyer-facing pages complete

**Files Created:** 21 components/pages (100% CHUNKED WRITE PROTOCOL compliant — all <300 lines)

---

## Phase 1 — GAPS & MISSING FEATURES ❌

### Critical Features NOT Implemented (BLOCKING Phase 2):

| Feature | Requirement | Current Status | Impact |
|---|---|---|---|
| **Order History Page** | `/orders` list user's orders | ❌ No UI page | Buyer can't see past orders |
| **Order Tracking Page** | View order status + GHN tracking | ❌ No UI page | No order visibility |
| **Reviews System** | Rate products post-delivery | ❌ API + UI missing | Engagement feature lost |
| **Payment Timeout Job** | Cancel PENDING orders after 15 min | ❌ No cron job | Orders stuck forever |
| **Geocoding** | Auto-populate address lat/lng via Nominatim | ❌ Not implemented | Nearest branch ~accurate only |
| **Wishlist Page** | Display wishlist items | ❌ API exists, no UI | Feature incomplete |
| **VAT Invoice Request** | Checkbox during checkout | ❌ Not implemented | Required for B2B sales |
| **ISR Cache** | Product pages static + on-demand | ❌ Not implemented | Performance suboptimal |
| **Cart DB Persistence** | Sync logged-in cart to database | ❌ localStorage only | Cart lost on logout |
| **Real GHN Integration** | Live shipping calculations | ⚠️ Mock only | Fees inaccurate |
| **Real VNPay/MoMo** | Live payment processing | ⚠️ Mock only | Can't test real payments |

### Minor Issues:

| Issue | Severity | Action |
|---|---|---|
| Checkout map (Leaflet) not rendered in UI | Medium | Add map component to ShippingStep |
| Address geocoding via OpenStreetMap/Nominatim | Medium | Call Nominatim API on address create |
| Product variant options not fully modeled | Low | Schema supports but UI incomplete |

---

## Before Phase 2: Required Actions

### 1. **Order History & Tracking** (High Priority)
- Create `/app/(store)/orders/page.tsx` — list user's orders
- Create `/app/(store)/orders/[id]/page.tsx` — detail + status timeline + GHN tracking
- **Effort:** 2–3 hours

### 2. **Reviews System** (High Priority)
- Create `/api/v1/reviews/*` endpoints (create, list, delete)
- Add reviews section to product detail page
- **Effort:** 3–4 hours

### 3. **Payment Timeout Job** (High Priority)
- Implement cron job (e.g., `vercel/cron`) to cancel PENDING orders after 15 min
- Release inventory on timeout
- **Effort:** 2–3 hours

### 4. **VAT Invoice Feature** (Medium Priority)
- Add VAT checkbox + tax code input to checkout PaymentStep
- Store `vat_invoice_requested` in orders
- **Effort:** 2 hours

### 5. **Geocoding + Leaflet Map** (Medium Priority)
- Call Nominatim API on address save to get lat/lng
- Render Leaflet map in ShippingStep showing branches
- **Effort:** 3 hours

### 6. **ISR Cache** (Low Priority)
- Add `revalidate` to product pages for static regeneration
- Cache homepage every 1 hour
- **Effort:** 1 hour

### 7. **Cart DB Sync** (Low Priority)
- Sync Zustand cart to `cart_events` table on changes (for analytics)
- **Effort:** 1–2 hours

---

## Recommendation: Phase 1.7 — Polish & Completion

**Before moving to Phase 2 (Admin Dashboard):**
1. ✅ Implement Order History + Tracking pages (2–3 hours)
2. ✅ Implement Reviews system (3–4 hours)
3. ✅ Implement Payment Timeout cron (2–3 hours)
4. ✅ Add Geocoding + Leaflet map (3 hours)
5. ✅ Add VAT invoice request (2 hours)

**Estimated effort:** 12–17 hours (1–2 days)

**Then proceed to Phase 2: Admin Dashboard** with complete buyer experience.

---

## Summary

| Phase | Status | Files | Notes |
|---|---|---|---|
| Phase 0 | ✅ Complete | - | Foundation solid |
| Phase 1.1–1.5 | ✅ Complete | 20 API routes | All endpoints working |
| Phase 1.6 | ✅ Complete | 21 UI components | All pages responsive |
| Phase 1.7 (NEW) | ⏳ **Pending** | TBD | 5 critical features |
| Phase 2 | ⏹️ Blocked | - | Awaiting Phase 1.7 |

**Recommendation:** Complete Phase 1.7 before Phase 2 to ensure buyer experience is complete.
