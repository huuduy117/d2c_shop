# Implementation Plan — Vietnamese D2C E-commerce
> AI Agent: GitHub Copilot Workspace
> Version: 3.0 — FINAL (tất cả câu hỏi đã được trả lời)
> Last updated: 2026-05-18

---

## 0. Project Overview & All Decisions

| Field | Decision |
|---|---|
| **Model** | D2C — Single-seller, multi-branch |
| **Market** | Vietnam |
| **Scale** | ~100 users/month → scalable to 10,000+ |
| **Roles** | `buyer` / `admin` (seller = admin) |
| **Payment** | VNPay, MoMo, COD |
| **Shipping** | Đối tác GHN hoặc GHTK — tracking số vận đơn |
| **Branch selection** | Buyer chọn, web đề xuất chi nhánh gần nhất |
| **Branch transfer** | Có — admin reassign đơn sang chi nhánh khác |
| **Inventory** | Chia theo chi nhánh |
| **Refund COD** | Flow 4 bước có state machine rõ ràng |
| **VAT invoice** | Bắt buộc — xuất hóa đơn điện tử |
| **PDPA** | Consent checkbox bắt buộc khi đăng ký |
| **Mobile** | React Native — làm sau web; API phải REST/versioned từ đầu |
| **Agent** | GitHub Copilot Workspace |

---

## 1. Tech Stack (Final)

### 1.1 Frontend
| Layer | Choice | Reason |
|---|---|---|
| Framework | **Next.js 14** (App Router) | SSR/SSG cho SEO, image optimization |
| Language | **TypeScript** | Type safety toàn stack |
| Styling | **Tailwind CSS + shadcn/ui** | Customizable, không vendor lock-in |
| Animation | **Framer Motion** | UX trẻ trung |
| State | **Zustand** | Nhẹ, đủ cho scale này |
| Forms | **React Hook Form + Zod** | Validation type-safe |
| Maps | **Leaflet.js** (OpenStreetMap) | Tính khoảng cách buyer → chi nhánh, free |

### 1.2 Backend — API-first từ đầu (chuẩn bị cho React Native)
| Layer | Choice | Reason |
|---|---|---|
| API | **Next.js API Routes** với prefix `/api/v1/` | Versioned ngay từ đầu, mobile app consume cùng endpoint |
| Auth | **NextAuth.js v5** + JWT | Session cho web, Bearer token cho mobile |
| ORM | **Drizzle ORM** | Type-safe, migration rõ ràng |
| Validation | **Zod** (shared client + server) | Single source of truth |
| PDF | **@react-pdf/renderer** | In phiếu giao hàng, hóa đơn VAT |

### 1.3 Database & Storage
| Layer | Choice | Reason |
|---|---|---|
| Database | **Neon PostgreSQL serverless** | ACID, auto-scale, free tier |
| File/Image | **Cloudflare R2** | Free 10GB egress |
| Cache | **Upstash Redis** | Rate limiting, cart cache, geolocation cache |

### 1.4 Third-party Integrations
| Service | Provider | Purpose |
|---|---|---|
| Shipping | **GHN API** (primary) + GHTK (fallback) | Tính phí ship, tạo vận đơn, tracking |
| Payment | **VNPay** + **MoMo** + COD | 3 phương thức thanh toán |
| Email | **Resend** | Order confirm, shipping update, refund notice |
| VAT Invoice | **VNPT-Invoice** hoặc **MisaInvoice** API | Xuất hóa đơn VAT điện tử tự động |
| Hosting | **Vercel** | Deploy, CDN, Edge |
| Monitoring | **Sentry** | Error tracking |
| Maps | **OpenStreetMap + Nominatim** | Geocoding địa chỉ buyer → tọa độ |

---

## 2. Database Schema (Final — v3)

> Agent: Tạo Drizzle migration files theo thứ tự dependency. Chú ý comment ← MỚI v3 là thay đổi so với v2.

```sql
-- ============================================================
-- USERS & CONSENT
-- ============================================================
users
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  email             text UNIQUE NOT NULL
  password_hash     text
  role              text NOT NULL CHECK (role IN ('buyer','admin'))
  full_name         text
  phone             text
  avatar_url        text
  is_active         boolean DEFAULT true
  pdpa_consented_at timestamptz        -- ← MỚI v3: NULL = chưa đồng ý, NOT NULL = đã đồng ý
  pdpa_version      text               -- ← MỚI v3: version của điều khoản tại thời điểm đồng ý
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()

-- ============================================================
-- SHOP & BRANCHES
-- ============================================================
shop_config                            -- singleton: chỉ 1 row
  id                uuid PRIMARY KEY
  shop_name         text NOT NULL
  logo_url          text
  contact_email     text
  contact_phone     text
  tax_code          text               -- mã số thuế, encrypted AES-256
  bank_account      text               -- số tài khoản NH, encrypted AES-256
  bank_name         text
  bank_owner_name   text
  social_links      jsonb              -- {facebook, instagram, tiktok, ...}
  vat_invoice_provider text            -- 'vnpt' | 'misa'
  vat_invoice_config   jsonb           -- API credentials (encrypted)
  updated_at        timestamptz

branches
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  name              text NOT NULL
  address           text NOT NULL
  ward              text
  district          text NOT NULL
  city              text NOT NULL
  latitude          numeric(10,7)      -- ← MỚI v3: dùng để tính khoảng cách
  longitude         numeric(10,7)      -- ← MỚI v3
  phone             text
  is_active         boolean DEFAULT true
  is_default        boolean DEFAULT false
  ghn_shop_id       text               -- ← MỚI v3: Shop ID trên GHN cho chi nhánh này
  created_at        timestamptz DEFAULT now()

-- ============================================================
-- BUYER ADDRESSES
-- ============================================================
addresses
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
  label             text               -- 'Nhà', 'Công ty', ...
  full_name         text NOT NULL
  phone             text NOT NULL
  street            text NOT NULL
  ward              text
  district          text NOT NULL
  city              text NOT NULL
  latitude          numeric(10,7)      -- ← MỚI v3: cache sau lần geocode đầu tiên
  longitude         numeric(10,7)
  is_default        boolean DEFAULT false
  created_at        timestamptz DEFAULT now()

-- ============================================================
-- PRODUCTS & CATEGORIES
-- ============================================================
categories
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  name              text NOT NULL
  slug              text UNIQUE NOT NULL
  parent_id         uuid REFERENCES categories(id)
  sort_order        int DEFAULT 0
  is_active         boolean DEFAULT true

products
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  name              text NOT NULL
  slug              text UNIQUE NOT NULL
  description       text               -- sanitized HTML (DOMPurify trước khi render)
  base_price        bigint NOT NULL    -- VND, integer (không dùng float)
  category_id       uuid REFERENCES categories(id)
  status            text NOT NULL CHECK (status IN ('draft','active','hidden'))
  meta_title        text               -- SEO
  meta_description  text               -- SEO
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()

product_variants
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  product_id        uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE
  sku               text UNIQUE NOT NULL
  attributes        jsonb NOT NULL     -- {color: 'Đỏ', size: 'XL'}
  price_override    bigint             -- NULL = dùng base_price
  weight_gram       int                -- ← MỚI v3: cần cho GHN tính phí ship
  is_active         boolean DEFAULT true

product_images
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  product_id        uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE
  url               text NOT NULL
  sort_order        int DEFAULT 0

-- ============================================================
-- INVENTORY (per variant × branch)
-- ============================================================
inventory
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  product_variant_id uuid NOT NULL REFERENCES product_variants(id)
  branch_id         uuid NOT NULL REFERENCES branches(id)
  stock             int NOT NULL DEFAULT 0
  reserved_stock    int NOT NULL DEFAULT 0  -- số lượng đang trong đơn chưa CONFIRMED
  low_stock_threshold int DEFAULT 5         -- cảnh báo khi stock <= threshold
  UNIQUE (product_variant_id, branch_id)

-- ============================================================
-- ORDERS
-- ============================================================
orders
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  order_code        text UNIQUE NOT NULL   -- VD: ORD-20260518-0001 (human-readable)
  buyer_id          uuid NOT NULL REFERENCES users(id)
  branch_id         uuid NOT NULL REFERENCES branches(id)
  original_branch_id uuid REFERENCES branches(id)  -- ← MỚI v3: lưu chi nhánh ban đầu khi transfer
  status            text NOT NULL          -- xem State Machine bên dưới
  payment_method    text NOT NULL CHECK (payment_method IN ('vnpay','momo','cod'))
  payment_status    text NOT NULL CHECK (payment_status IN ('pending','paid','failed','refunded','partially_refunded'))
  subtotal          bigint NOT NULL        -- tổng trước giảm giá + ship
  shipping_fee      bigint NOT NULL DEFAULT 0
  discount_total    bigint NOT NULL DEFAULT 0
  grand_total       bigint NOT NULL        -- subtotal + shipping_fee - discount_total
  shipping_address  jsonb NOT NULL         -- snapshot địa chỉ tại thời điểm đặt hàng
  note              text                   -- ghi chú của buyer
  vat_invoice_requested boolean DEFAULT false  -- ← MỚI v3
  vat_invoice_issued    boolean DEFAULT false  -- ← MỚI v3
  vat_invoice_url       text                   -- ← MỚI v3: URL PDF hóa đơn
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()

order_items
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  order_id          uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE
  product_variant_id uuid NOT NULL REFERENCES product_variants(id)
  quantity          int NOT NULL
  unit_price        bigint NOT NULL        -- giá tại thời điểm mua
  product_snapshot  jsonb NOT NULL         -- {name, sku, attributes, image_url}

order_status_history                       -- audit trail đầy đủ
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  order_id          uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE
  from_status       text
  to_status         text NOT NULL
  changed_by        uuid REFERENCES users(id)  -- NULL = system
  note              text
  created_at        timestamptz DEFAULT now()

-- ← MỚI v3: theo dõi việc chuyển chi nhánh
order_branch_transfers
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  order_id          uuid NOT NULL REFERENCES orders(id)
  from_branch_id    uuid NOT NULL REFERENCES branches(id)
  to_branch_id      uuid NOT NULL REFERENCES branches(id)
  transferred_by    uuid NOT NULL REFERENCES users(id)  -- admin
  reason            text
  created_at        timestamptz DEFAULT now()

-- ============================================================
-- SHIPPING & TRACKING  ← MỚI v3 (hoàn toàn mới)
-- ============================================================
shipments
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  order_id          uuid NOT NULL REFERENCES orders(id)
  branch_id         uuid NOT NULL REFERENCES branches(id)  -- chi nhánh giao
  provider          text NOT NULL CHECK (provider IN ('ghn','ghtk','manual'))
  tracking_code     text UNIQUE            -- mã vận đơn từ GHN/GHTK
  status            text                   -- sync từ GHN/GHTK webhook
  estimated_delivery date
  actual_delivery   timestamptz
  provider_raw      jsonb                  -- raw response từ GHN/GHTK
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()

-- ============================================================
-- CANCELLATIONS & RETURNS (tách biệt — khác nhau về logic)
-- ============================================================
cancellations
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  order_id          uuid NOT NULL REFERENCES orders(id)
  reason            text NOT NULL
  requested_by_role text NOT NULL CHECK (requested_by_role IN ('buyer','admin','system'))
  requested_by      uuid REFERENCES users(id)
  created_at        timestamptz DEFAULT now()

-- ← MỚI v3: Refund state machine rõ ràng
returns
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  order_id          uuid NOT NULL REFERENCES orders(id)
  requested_by      uuid NOT NULL REFERENCES users(id)
  reason            text NOT NULL
  evidence_urls     jsonb                  -- ảnh/video hàng lỗi do buyer upload
  refund_amount     bigint                 -- có thể partial refund
  refund_method     text CHECK (refund_method IN ('original_payment','bank_transfer','store_credit'))
  -- STATE MACHINE: pending → under_review → approved / rejected → processing_refund → refunded
  status            text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','under_review','approved','rejected','processing_refund','refunded'))
  admin_note        text                   -- lý do approve/reject
  reviewed_by       uuid REFERENCES users(id)
  reviewed_at       timestamptz
  bank_account_name text                   -- nếu COD refund qua bank transfer
  bank_account_no   text
  bank_name         text
  transfer_proof_url text                  -- ← ảnh bill chuyển khoản (COD refund)
  transfer_at       timestamptz            -- thời điểm admin thực hiện chuyển khoản
  marked_refunded_by uuid REFERENCES users(id)
  refunded_at       timestamptz
  created_at        timestamptz DEFAULT now()
  updated_at        timestamptz DEFAULT now()

-- ============================================================
-- PAYMENTS
-- ============================================================
payments
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  order_id          uuid NOT NULL REFERENCES orders(id)
  provider          text NOT NULL CHECK (provider IN ('vnpay','momo','cod'))
  amount            bigint NOT NULL
  status            text NOT NULL CHECK (status IN ('pending','success','failed','refunded'))
  provider_txn_id   text UNIQUE            -- idempotency key
  raw_callback      jsonb                  -- raw webhook payload
  created_at        timestamptz DEFAULT now()

-- ============================================================
-- VAT INVOICES  ← MỚI v3
-- ============================================================
vat_invoices
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  order_id          uuid NOT NULL REFERENCES orders(id)
  invoice_no        text UNIQUE            -- số hóa đơn từ VNPT/Misa
  issue_date        date NOT NULL
  buyer_tax_code    text                   -- mã số thuế công ty buyer (nếu có)
  buyer_company     text
  amount_before_tax bigint NOT NULL
  vat_amount        bigint NOT NULL        -- 10% VAT
  total_amount      bigint NOT NULL
  pdf_url           text                   -- URL hóa đơn PDF
  provider_ref      text                   -- reference ID từ VNPT/Misa
  status            text NOT NULL CHECK (status IN ('pending','issued','cancelled'))
  created_at        timestamptz DEFAULT now()

-- ============================================================
-- PROMOTIONS
-- ============================================================
vouchers
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  code              text UNIQUE NOT NULL
  discount_type     text NOT NULL CHECK (discount_type IN ('percent','fixed'))
  value             bigint NOT NULL
  max_discount      bigint                 -- cap cho percent discount
  min_order         bigint DEFAULT 0
  usage_limit       int                    -- NULL = unlimited
  used_count        int DEFAULT 0
  per_user_limit    int DEFAULT 1
  starts_at         timestamptz
  expires_at        timestamptz
  is_active         boolean DEFAULT true

user_vouchers
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id           uuid NOT NULL REFERENCES users(id)
  voucher_id        uuid NOT NULL REFERENCES vouchers(id)
  used_at           timestamptz
  order_id          uuid REFERENCES orders(id)

flash_sales
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  product_variant_id uuid NOT NULL REFERENCES product_variants(id)
  sale_price        bigint NOT NULL
  starts_at         timestamptz NOT NULL
  ends_at           timestamptz NOT NULL
  stock_limit       int
  sold_count        int DEFAULT 0

-- ============================================================
-- ENGAGEMENT
-- ============================================================
reviews
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  product_id        uuid NOT NULL REFERENCES products(id)
  buyer_id          uuid NOT NULL REFERENCES users(id)
  order_id          uuid NOT NULL REFERENCES orders(id)
  rating            int NOT NULL CHECK (rating BETWEEN 1 AND 5)
  content           text
  image_urls        jsonb
  is_verified       boolean DEFAULT true   -- luôn true vì check từ order
  created_at        timestamptz DEFAULT now()
  UNIQUE (order_id, product_id)           -- 1 review / sản phẩm / đơn hàng

wishlists
  user_id           uuid NOT NULL REFERENCES users(id)
  product_id        uuid NOT NULL REFERENCES products(id)
  created_at        timestamptz DEFAULT now()
  PRIMARY KEY (user_id, product_id)

notifications
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id           uuid NOT NULL REFERENCES users(id)
  type              text NOT NULL          -- 'order_confirmed','shipped','refund_approved',...
  title             text NOT NULL
  body              text NOT NULL
  payload           jsonb                  -- {order_id, tracking_code, ...}
  read_at           timestamptz
  created_at        timestamptz DEFAULT now()

-- ============================================================
-- SUPPORT
-- ============================================================
support_tickets
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  user_id           uuid NOT NULL REFERENCES users(id)
  order_id          uuid REFERENCES orders(id)
  subject           text NOT NULL
  status            text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved','closed'))
  created_at        timestamptz DEFAULT now()

support_messages
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  ticket_id         uuid NOT NULL REFERENCES support_tickets(id)
  sender_id         uuid NOT NULL REFERENCES users(id)
  content           text NOT NULL
  attachments       jsonb
  created_at        timestamptz DEFAULT now()

-- ============================================================
-- ANALYTICS
-- ============================================================
product_analytics
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  product_id        uuid NOT NULL REFERENCES products(id)
  date              date NOT NULL
  views             int DEFAULT 0
  cart_adds         int DEFAULT 0
  purchases         int DEFAULT 0
  UNIQUE (product_id, date)

cart_events
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  session_id        text NOT NULL
  user_id           uuid REFERENCES users(id)
  product_variant_id uuid NOT NULL REFERENCES product_variants(id)
  event             text NOT NULL CHECK (event IN ('add','remove','checkout'))
  created_at        timestamptz DEFAULT now()

revenue_daily
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid()
  branch_id         uuid NOT NULL REFERENCES branches(id)
  date              date NOT NULL
  gross_revenue     bigint DEFAULT 0
  discount_total    bigint DEFAULT 0
  shipping_revenue  bigint DEFAULT 0
  net_revenue       bigint DEFAULT 0
  order_count       int DEFAULT 0
  by_payment_method jsonb                  -- {vnpay: 500000, momo: 200000, cod: 100000}
  UNIQUE (branch_id, date)
```

---

## 3. Project Structure (Final)

```
/
├── app/
│   ├── (store)/                    # Public storefront
│   │   ├── page.tsx                # Homepage
│   │   ├── products/
│   │   │   ├── page.tsx            # Listing + filter + search
│   │   │   └── [slug]/page.tsx     # Product detail + reviews
│   │   ├── cart/page.tsx
│   │   ├── checkout/
│   │   │   ├── page.tsx            # Địa chỉ + chọn chi nhánh gần nhất
│   │   │   ├── payment/page.tsx    # Chọn phương thức
│   │   │   └── confirm/page.tsx    # Review + đặt hàng
│   │   ├── orders/
│   │   │   ├── page.tsx            # Lịch sử đơn hàng
│   │   │   └── [id]/page.tsx       # Chi tiết + tracking
│   │   ├── wishlist/page.tsx
│   │   └── account/
│   │       ├── profile/page.tsx
│   │       └── addresses/page.tsx
│   │
│   ├── (admin)/                    # Admin dashboard
│   │   ├── dashboard/page.tsx      # GMV, đơn hôm nay, tồn kho thấp
│   │   ├── products/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   ├── inventory/page.tsx      # Tồn kho theo variant × branch
│   │   ├── orders/
│   │   │   ├── page.tsx            # Danh sách + filter
│   │   │   └── [id]/page.tsx       # Chi tiết + đổi trạng thái + transfer branch
│   │   ├── returns/
│   │   │   ├── page.tsx            # Danh sách return requests
│   │   │   └── [id]/page.tsx       # Review + approve/reject + mark refunded
│   │   ├── shipments/page.tsx      # Tracking vận đơn GHN/GHTK
│   │   ├── customers/page.tsx
│   │   ├── promotions/
│   │   │   ├── vouchers/
│   │   │   └── flash-sales/
│   │   ├── analytics/page.tsx
│   │   ├── finance/page.tsx        # Doanh thu + VAT invoices
│   │   ├── branches/page.tsx
│   │   ├── support/page.tsx
│   │   └── settings/page.tsx
│   │
│   └── api/
│       └── v1/                     # ← versioned prefix cho mobile sau này
│           ├── auth/
│           ├── products/
│           ├── cart/
│           ├── orders/
│           ├── payments/
│           │   ├── vnpay/
│           │   └── momo/
│           ├── returns/
│           ├── reviews/
│           ├── vouchers/
│           ├── shipping/
│           │   ├── estimate/       # Tính phí ship GHN
│           │   └── nearest-branch/ # Trả về chi nhánh gần buyer nhất
│           ├── support/
│           ├── vat-invoices/
│           └── webhooks/
│               ├── vnpay/
│               ├── momo/
│               └── ghn/            # ← MỚI: GHN push tracking updates
│
├── components/
│   ├── ui/                         # shadcn/ui base
│   ├── store/                      # Buyer-facing
│   └── admin/
│
├── lib/
│   ├── db/                         # Drizzle schema + queries
│   ├── auth/                       # NextAuth — 2 roles
│   ├── payments/
│   │   ├── vnpay.ts
│   │   └── momo.ts
│   ├── shipping/
│   │   ├── ghn.ts                  # ← MỚI: GHN API wrapper
│   │   └── branch-selector.ts      # ← MỚI: tính chi nhánh gần nhất
│   ├── inventory/
│   │   └── locking.ts              # Pessimistic lock logic
│   ├── vat/
│   │   └── invoice.ts              # ← MỚI: VNPT/Misa API wrapper
│   ├── validations/                # Zod schemas (shared web + mobile)
│   └── utils/
│
├── middleware.ts                    # /admin/* → role=admin
└── drizzle.config.ts
```

---

## 4. Development Roadmap (Final — 13 Weeks)

> Timeline tăng từ 10 → 13 tuần so với v2 vì thêm: GHN integration, branch transfer, VAT invoice, refund state machine, API versioning.

---

### Phase 0 — Foundation (Week 1)
- [ ] Init Next.js 14 + TypeScript + Tailwind + shadcn/ui
- [ ] Drizzle ORM + Neon PostgreSQL — run full schema migration
- [ ] NextAuth.js v5: email/password + Google, 2 roles `buyer` | `admin`
- [ ] PDPA consent: checkbox bắt buộc tại register form, lưu `pdpa_consented_at` + `pdpa_version`
- [ ] Middleware: `/admin/*` → verify `role=admin` server-side
- [ ] Seed: 1 admin account + 1 branch default + `shop_config` row
- [ ] API prefix `/api/v1/` — tất cả routes đặt trong folder này
- [ ] Cloudflare R2, Upstash Redis, Sentry setup
- [ ] Vercel deployment pipeline + env vars

**Exit criteria:** Auth end-to-end. PDPA consent lưu DB. `/admin` block buyer. Schema migrate sạch.

---

### Phase 1 — Storefront & Buyer Core (Week 2–4)
- [ ] Homepage: banner, featured products, categories
- [ ] Product listing: search full-text, filter, sort, pagination (ISR cache)
- [ ] Product detail: image gallery, variant selector, stock check per branch, reviews
- [ ] Shopping cart: Zustand + persist DB khi logged in
- [ ] **Checkout flow:**
  - Bước 1: Nhập/chọn địa chỉ → geocode → gọi `/api/v1/shipping/nearest-branch` → hiển thị chi nhánh gợi ý + map Leaflet + cho phép buyer đổi chi nhánh khác
  - Bước 2: Gọi `/api/v1/shipping/estimate` (GHN API) → hiển thị phí ship + estimated delivery
  - Bước 3: Apply voucher (validate server-side)
  - Bước 4: Chọn thanh toán (VNPay / MoMo / COD)
  - Bước 5: Confirm → tạo đơn + lock inventory
- [ ] VNPay: redirect flow + webhook verify HMAC-SHA512
- [ ] MoMo: redirect flow + webhook verify HMAC-SHA256
- [ ] COD: tạo đơn status `PENDING_CONFIRMATION`
- [ ] Payment timeout: cron mỗi 5 phút, cancel đơn PENDING quá 15 phút + release inventory
- [ ] Order tracking: timeline từ `order_status_history` + tracking GHN (polling hoặc webhook)
- [ ] Order history page
- [ ] Address management: CRUD, set default, geocode tự động
- [ ] Wishlist
- [ ] Request VAT invoice khi checkout (checkbox + nhập thông tin công ty)

**Exit criteria:** Buyer hoàn thành purchase cycle cả 3 payment methods. Chi nhánh được gợi ý đúng.

---

### Phase 2 — Admin: Products & Inventory (Week 5–6)
- [ ] Product CRUD: create/edit/hide/delete + SEO fields (meta title, description, slug)
- [ ] Variant management: SKU, attributes, price override, **weight_gram** (bắt buộc cho GHN)
- [ ] Multi-image upload: drag & drop lên R2, reorder
- [ ] Category tree management
- [ ] **Inventory dashboard:**
  - View stock theo variant × branch (grid view)
  - Điều chỉnh stock thủ công (nhập hàng)
  - Cảnh báo tồn kho thấp (badge + email alert)
  - Export tồn kho Excel
- [ ] Branch management: CRUD, set tọa độ lat/lng, GHN shop ID

**Exit criteria:** Admin đăng sản phẩm đủ weight, inventory đúng theo chi nhánh.

---

### Phase 3 — Admin: Orders & Branch Transfer (Week 7–8)
- [ ] Order list: filter theo status / branch / ngày / payment method
- [ ] Order detail: items, buyer info, payment info, timeline
- [ ] Xử lý trạng thái: `CONFIRMED → PROCESSING → SHIPPED`
- [ ] **GHN integration:**
  - Tạo vận đơn GHN từ order (gọi GHN create-order API)
  - Lưu `tracking_code` vào `shipments`
  - In phiếu giao hàng PDF (A5)
  - GHN webhook → update `shipments.status` + `order_status_history`
- [ ] **Branch transfer:**
  - Admin reassign `order.branch_id` → `to_branch_id`
  - Lưu `order_branch_transfers` với reason
  - Recheck inventory tại branch mới trước khi transfer
  - Notify buyer email: "Đơn hàng bạn sẽ được xử lý từ chi nhánh [X] để giao nhanh hơn"
- [ ] COD: admin confirm → `CONFIRMED`
- [ ] Cancellation: admin/buyer cancel, release inventory

**Exit criteria:** GHN vận đơn tạo được. Transfer chi nhánh có audit trail. Inventory unlock đúng khi cancel.

---

### Phase 4 — Returns & Refunds (Week 9)

> Agent: Implement return flow theo state machine dưới đây. Đây là nghiệp vụ phức tạp — không được shortcut.

**Return State Machine:**

```
PENDING → UNDER_REVIEW → APPROVED  → PROCESSING_REFUND → REFUNDED
                       ↘ REJECTED
```

| Transition | Actor | Action required |
|---|---|---|
| `PENDING → UNDER_REVIEW` | Admin | Admin mở ticket để xem xét |
| `UNDER_REVIEW → APPROVED` | Admin | Ghi `refund_amount`, `refund_method`, `admin_note` |
| `UNDER_REVIEW → REJECTED` | Admin | Ghi `admin_note` lý do từ chối |
| `APPROVED → PROCESSING_REFUND` | System | Tự động sau khi approve |
| `PROCESSING_REFUND → REFUNDED` | Admin | Xác nhận đã chuyển tiền thực tế |

**COD Refund flow cụ thể:**
```
Buyer gửi yêu cầu (evidence_urls bắt buộc)
  → Admin review (UNDER_REVIEW)
  → Admin approve: nhập bank_account_name, bank_account_no, bank_name của buyer
  → Admin chuyển khoản thủ công ngoài hệ thống
  → Admin upload transfer_proof_url (ảnh bill)
  → Admin click "Mark as Refunded" → lưu transfer_at, marked_refunded_by
  → Status → REFUNDED
  → Buyer nhận email thông báo kèm ảnh bill
```

**VNPay/MoMo Refund flow:**
```
Admin approve → system gọi VNPay/MoMo refund API tự động
  → Nếu API success → REFUNDED
  → Nếu API fail → giữ PROCESSING_REFUND, alert admin xử lý thủ công
```

**Tasks:**
- [ ] Return request form (buyer): chọn lý do, upload evidence, nhập bank info (nếu COD)
- [ ] Admin return list: filter theo status
- [ ] Admin return detail: xem evidence, approve/reject với note
- [ ] COD refund: upload bill, mark refunded
- [ ] VNPay/MoMo refund API call
- [ ] Inventory restock khi REFUNDED (sau kiểm tra hàng)
- [ ] Email notifications tại mỗi transition

**Exit criteria:** Toàn bộ state machine hoạt động đúng. COD refund có proof. Inventory restock đúng.

---

### Phase 5 — Finance, VAT & Analytics (Week 10)
- [ ] Finance dashboard: doanh thu theo ngày/tuần/tháng, phân theo branch + payment method
- [ ] **VAT Invoice flow:**
  - Buyer request khi checkout (checkbox + tax code + tên công ty)
  - Sau khi đơn `DELIVERED` → system tự động gọi VNPT-Invoice API / Misa API
  - Lưu `vat_invoices` record + PDF URL
  - Email PDF cho buyer
  - Admin có thể xuất danh sách hóa đơn VAT theo tháng
- [ ] Export báo cáo Excel (doanh thu, hóa đơn VAT, tồn kho)
- [ ] Analytics dashboard: top products, abandoned cart rate, conversion rate
- [ ] Customer list: tổng chi tiêu, số đơn, rank

**Exit criteria:** VAT invoice xuất được PDF. Finance report export Excel.

---

### Phase 6 — Engagement & Support (Week 11)
- [ ] Review system: chỉ sau `DELIVERED`, 1 review/sản phẩm/đơn, upload ảnh
- [ ] Promotions: Voucher CRUD, Flash sale với countdown timer
- [ ] **Email notifications (Resend):**
  - Đặt hàng thành công (kèm order summary)
  - Đơn được xác nhận
  - Đang giao (kèm tracking code GHN)
  - Giao thành công
  - Yêu cầu hoàn hàng được xử lý (approve/reject)
  - COD refund đã chuyển khoản (kèm bill)
  - Branch transfer thông báo
- [ ] In-app notifications (polling 30s hoặc Vercel Edge SSE)
- [ ] Support tickets: buyer tạo, admin reply

**Exit criteria:** Email đúng template, đúng trigger. Notifications hiển thị đúng.

---

### Phase 7 — Hardening, API-readiness & Launch (Week 12–13)
- [ ] **API-first audit:** đảm bảo tất cả `/api/v1/` endpoints trả JSON chuẩn `{data, error, meta}` — mobile app sẽ consume sau
- [ ] Bearer token auth cho API (chuẩn bị cho React Native): NextAuth issue JWT, API route accept `Authorization: Bearer <token>`
- [ ] SEO: sitemap.xml tự động, Open Graph, JSON-LD structured data
- [ ] Performance: ISR cho product pages, Redis cache homepage, lazy load ảnh
- [ ] Security audit (xem Section 6)
- [ ] PDPA: Privacy Policy page, trang "Xóa tài khoản của tôi" (data deletion request)
- [ ] Mobile QA: 375px / 768px
- [ ] Load test: 200 concurrent checkouts
- [ ] Accessibility: contrast, keyboard nav cơ bản

---

## 5. Order State Machine (Final)

```
                   ┌──────────────────┐
                   │     PENDING      │ ← Đơn mới (chờ payment webhook hoặc COD confirm)
                   └────────┬─────────┘
          payment success   │         payment timeout 15' → CANCELLED (system)
          hoặc admin COD    │
                   ┌────────▼─────────┐
                   │    CONFIRMED     │ ← Admin thấy đơn
                   └────────┬─────────┘
                   admin    │
                   ┌────────▼─────────┐
                   │   PROCESSING     │ ← Đang đóng gói, tạo vận đơn GHN
                   └────────┬─────────┘
         admin + GHN order  │
                   ┌────────▼─────────┐
                   │     SHIPPED      │ ← GHN đã nhận hàng, tracking active
                   └────────┬─────────┘
          GHN webhook /     │
          admin confirm     │
                   ┌────────▼─────────┐
                   │    DELIVERED     │ ← Giao thành công
                   └────────┬─────────┘
      buyer (trong 7 ngày)  │
                   ┌────────▼──────────────┐
                   │   RETURN_REQUESTED    │ → returns table (state machine riêng)
                   └───────────────────────┘

CANCELLED path:
  PENDING    → CANCELLED  (buyer self-cancel hoặc payment timeout)
  CONFIRMED  → CANCELLED  (admin cancel hoặc buyer request trước PROCESSING)
  * PROCESSING+ không thể cancel thường — cần return flow
```

**Illegal transitions:** mọi transition không có trong sơ đồ trên phải bị reject với HTTP 422 + message rõ ràng.

---

## 6. Inventory Locking

> Agent: Tất cả thao tác thay đổi stock PHẢI chạy trong PostgreSQL transaction.

```
CHECKOUT (lock & reserve):
  BEGIN
  SELECT stock, reserved_stock FROM inventory
    WHERE product_variant_id = $1 AND branch_id = $2
    FOR UPDATE  ← pessimistic row lock
  IF (stock - reserved_stock) < quantity → ROLLBACK → HTTP 409 "Hết hàng"
  UPDATE inventory SET reserved_stock += quantity
  INSERT INTO orders ...
  INSERT INTO order_items ...
  COMMIT

ORDER CONFIRMED (commit reservation):
  UPDATE inventory
    SET stock -= quantity, reserved_stock -= quantity
    WHERE product_variant_id = $1 AND branch_id = $2

ORDER CANCELLED (before CONFIRMED):
  UPDATE inventory SET reserved_stock -= quantity

ORDER CANCELLED (after CONFIRMED, before SHIPPED):
  UPDATE inventory SET stock += quantity

ORDER RETURNED + REFUNDED:
  UPDATE inventory SET stock += quantity  ← chỉ sau khi admin xác nhận nhận hàng về

BRANCH TRANSFER:
  BEGIN
  Kiểm tra inventory đủ tại branch_mới
  Nếu đủ: UPDATE inventory tại branch_cũ (release reserve)
           UPDATE inventory tại branch_mới (add reserve)
           UPDATE orders SET branch_id = branch_mới
  COMMIT
```

---

## 7. GHN Integration Spec

> Agent: Implement `lib/shipping/ghn.ts` theo spec này.

```typescript
// Các API cần implement:
// 1. Tính phí ship (trước khi buyer confirm)
POST /v2/shipping-order/fee
  body: { shop_id, service_type_id, from_district_id, to_district_id,
          to_ward_code, weight, insurance_value, coupon }
  → shipping_fee (VND)

// 2. Tạo vận đơn (sau khi admin confirm + processing)
POST /v2/shipping-order/create
  body: { shop_id, payment_type_id (1=shop trả, 2=buyer trả),
          required_note, from_name, from_phone, from_address,
          to_name, to_phone, to_address, to_ward_code, to_district_id,
          weight, items: [{name, quantity, price}] }
  → order_code (tracking_code), expected_delivery_time

// 3. In nhãn vận đơn
GET /v2/a5/gen-token  → token
GET https://dev-online-gateway.ghn.vn/a5/public-api/printA5?token={token}

// 4. Webhook nhận cập nhật trạng thái
POST /api/v1/webhooks/ghn
  verify: GHN-Token header
  events: picking → picked → delivering → delivered | delivery_fail → return | returned

// GHN status → Order status mapping:
  'delivered'      → DELIVERED (update order + notify buyer)
  'return'         → flag for admin review (không tự động cancel)
  'delivery_fail'  → notify admin + buyer
```

---

## 8. Security Requirements

### Authentication & Authorization
- [ ] Passwords: bcrypt cost factor 12
- [ ] JWT: access token 15 phút, refresh token 7 ngày (HTTP-only cookie), rotate on use
- [ ] API Bearer token (cho mobile sau): verify trong middleware, separate from session
- [ ] RBAC: `/admin/*` và `/api/v1/admin/*` verify `role=admin` server-side — không tin client
- [ ] Rate limit auth: 5 lần sai → 15 phút lockout (Upstash Redis)
- [ ] PDPA: block registration nếu `pdpa_consented_at` IS NULL

### Input & Data Security
- [ ] Zod validation: client + server, độc lập nhau
- [ ] Drizzle: parameterized queries only, không raw SQL string interpolation
- [ ] File upload: validate MIME type server-side (không tin Content-Type header), max 5MB
- [ ] Evidence upload (return): chỉ accept image/jpeg, image/png, image/webp, video/mp4
- [ ] Rich text (product description): sanitize bằng DOMPurify trước khi render
- [ ] `shop_config.bank_account`, `tax_code`, `vat_invoice_config`: encrypt AES-256 at rest

### Payment & Webhook Security
- [ ] VNPay webhook: verify `vnp_SecureHash` HMAC-SHA512 — reject 401 nếu sai
- [ ] MoMo webhook: verify `signature` HMAC-SHA256 — reject 401 nếu sai
- [ ] GHN webhook: verify `GHN-Token` header — reject 401 nếu sai
- [ ] Payment status: chỉ update từ verified webhook
- [ ] Idempotency: check `provider_txn_id` unique trước khi process
- [ ] Tất cả số tiền: integer VND (bigint) — không bao giờ dùng float
- [ ] Webhook endpoints: IP whitelist nếu provider cung cấp danh sách IP (Vercel Edge Config)

### API Security (chuẩn bị cho mobile)
- [ ] HTTPS only
- [ ] Security headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `CSP`
- [ ] Rate limit: 100 req/min (public), 30 req/min (auth), 20 req/min (checkout)
- [ ] CORS: chỉ whitelist domain web + domain mobile app (khi có)
- [ ] API response: không bao giờ expose `password_hash`, `encryption_key`, raw credentials

### Operational & Compliance
- [ ] Env vars: Vercel dashboard only, không commit `.env`
- [ ] DB: SSL only, Neon PgBouncer connection pooling
- [ ] Sentry: filter PII trước khi gửi (email, phone, địa chỉ, bank account)
- [ ] CI pipeline: `npm audit` — fail build nếu high/critical vulnerability
- [ ] Audit log: mọi admin action (đổi trạng thái đơn, transfer branch, approve refund, issue VAT invoice) → log với `admin_id` + timestamp + payload
- [ ] PDPA compliance: Privacy Policy page, data deletion flow, consent log immutable

---

## 9. Environment Variables (Final)

```bash
# ── Database ──────────────────────────────────────────────
DATABASE_URL=                    # postgresql://...?sslmode=require

# ── Auth ──────────────────────────────────────────────────
NEXTAUTH_SECRET=                 # openssl rand -base64 32
NEXTAUTH_URL=                    # https://yourdomain.com
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=             # Đổi ngay sau deploy đầu tiên
PDPA_VERSION=                    # VD: "v1.0-2026-05-18" — bump khi cập nhật điều khoản

# ── Storage ───────────────────────────────────────────────
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_URL=                   # https://cdn.yourdomain.com

# ── Payment: VNPay ────────────────────────────────────────
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=                       # sandbox hoặc production
VNPAY_RETURN_URL=                # https://yourdomain.com/api/v1/payments/vnpay/return

# ── Payment: MoMo ─────────────────────────────────────────
MOMO_PARTNER_CODE=
MOMO_ACCESS_KEY=
MOMO_SECRET_KEY=
MOMO_ENDPOINT=
MOMO_REDIRECT_URL=
MOMO_IPN_URL=                    # https://yourdomain.com/api/v1/webhooks/momo

# ── Shipping: GHN ─────────────────────────────────────────
GHN_API_TOKEN=
GHN_SHOP_ID=                     # default, override per branch
GHN_ENVIRONMENT=                 # 'sandbox' | 'production'
GHN_WEBHOOK_TOKEN=               # verify GHN-Token header

# ── VAT Invoice ───────────────────────────────────────────
VAT_PROVIDER=                    # 'vnpt' | 'misa'
VNPT_INVOICE_USERNAME=
VNPT_INVOICE_PASSWORD=
VNPT_INVOICE_API_URL=
# hoặc Misa:
MISA_INVOICE_CLIENT_ID=
MISA_INVOICE_CLIENT_SECRET=

# ── Cache ─────────────────────────────────────────────────
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ── Email ─────────────────────────────────────────────────
RESEND_API_KEY=
RESEND_FROM_EMAIL=               # no-reply@yourdomain.com
RESEND_FROM_NAME=                # Tên Shop

# ── Monitoring ────────────────────────────────────────────
SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# ── Encryption ────────────────────────────────────────────
ENCRYPTION_KEY=                  # openssl rand -hex 32 (AES-256, 32 bytes)

# ── App Config ────────────────────────────────────────────
NEXT_PUBLIC_SHOP_NAME=
NEXT_PUBLIC_BASE_URL=            # https://yourdomain.com
NEXT_PUBLIC_GHN_TRACKING_URL=    # https://tracking.ghn.dev/?order_id=
PAYMENT_TIMEOUT_MINUTES=15
RETURN_WINDOW_DAYS=7
LOW_STOCK_THRESHOLD=5
```

---

## 10. Definition of Done (per feature)

- [ ] TypeScript types đầy đủ, không có `any`
- [ ] Server-side Zod validation, độc lập với client
- [ ] API route verify role server-side
- [ ] Error states: handle + hiển thị thân thiện với user
- [ ] Loading states implement
- [ ] Mobile responsive: 375px / 768px / 1280px
- [ ] Không có `console.error` trong production build
- [ ] Sensitive data không log hoặc expose trong API response
- [ ] Inventory thao tác trong PostgreSQL transaction
- [ ] Webhook endpoints verify signature trước khi process
- [ ] Admin action được ghi audit log

---

## 11. Future: Mobile App Readiness Checklist

> Khi bắt đầu làm React Native app, các điều kiện sau phải đã đúng:

- [ ] Tất cả business logic nằm trong `/api/v1/` — không có logic ở server component
- [ ] Mọi endpoint trả format chuẩn: `{ data: T, error: string | null, meta?: { page, total } }`
- [ ] Bearer token auth hoạt động độc lập với NextAuth session cookie
- [ ] CORS whitelist sẵn sàng thêm mobile app bundle ID
- [ ] Image URLs từ R2 CDN (không phải Vercel) — mobile load được
- [ ] Push notification: thêm **Expo Push** hoặc **FCM** integration vào `notifications` table

---

*Version: 3.0 — FINAL | All questions answered | 2026-05-18*
*Nếu quyết định mở rộng sang multi-seller: thêm `seller_id` vào `products` + `inventory` + tách `revenue_daily` theo seller. Schema hiện tại đã thiết kế để migration này minimal.*
