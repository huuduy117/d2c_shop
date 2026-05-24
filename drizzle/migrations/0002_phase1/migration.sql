-- Phase 1 Schema Migration
-- Adds all tables needed for storefront, orders, payments, shipping, returns, etc.

-- ============================================================
-- BUYER ADDRESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label text,
  full_name text NOT NULL,
  phone text NOT NULL,
  street text NOT NULL,
  ward text,
  district text NOT NULL,
  city text NOT NULL,
  latitude numeric(10,7),
  longitude numeric(10,7),
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PRODUCTS & CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  parent_id uuid REFERENCES categories(id),
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text,
  base_price bigint NOT NULL,
  category_id uuid REFERENCES categories(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','hidden')),
  meta_title text,
  meta_description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku text UNIQUE NOT NULL,
  attributes jsonb NOT NULL,
  price_override bigint,
  weight_gram integer,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer DEFAULT 0
);

-- ============================================================
-- INVENTORY (per variant x branch)
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid NOT NULL REFERENCES product_variants(id),
  branch_id uuid NOT NULL REFERENCES branches(id),
  stock integer NOT NULL DEFAULT 0,
  reserved_stock integer NOT NULL DEFAULT 0,
  low_stock_threshold integer DEFAULT 5,
  UNIQUE (product_variant_id, branch_id)
);

-- ============================================================
-- ORDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code text UNIQUE NOT NULL,
  buyer_id uuid NOT NULL REFERENCES users(id),
  branch_id uuid NOT NULL REFERENCES branches(id),
  original_branch_id uuid REFERENCES branches(id),
  status text NOT NULL DEFAULT 'PENDING',
  payment_method text NOT NULL CHECK (payment_method IN ('vnpay','momo','cod')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded','partially_refunded')),
  subtotal bigint NOT NULL,
  shipping_fee bigint NOT NULL DEFAULT 0,
  discount_total bigint NOT NULL DEFAULT 0,
  grand_total bigint NOT NULL,
  shipping_address jsonb NOT NULL,
  note text,
  vat_invoice_requested boolean DEFAULT false,
  vat_invoice_issued boolean DEFAULT false,
  vat_invoice_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_variant_id uuid NOT NULL REFERENCES product_variants(id),
  quantity integer NOT NULL,
  unit_price bigint NOT NULL,
  product_snapshot jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status text,
  to_status text NOT NULL,
  changed_by uuid REFERENCES users(id),
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_branch_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  from_branch_id uuid NOT NULL REFERENCES branches(id),
  to_branch_id uuid NOT NULL REFERENCES branches(id),
  transferred_by uuid NOT NULL REFERENCES users(id),
  reason text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- SHIPPING & TRACKING
-- ============================================================
CREATE TABLE IF NOT EXISTS shipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  branch_id uuid NOT NULL REFERENCES branches(id),
  provider text NOT NULL CHECK (provider IN ('ghn','ghtk','manual')),
  tracking_code text UNIQUE,
  status text,
  estimated_delivery date,
  actual_delivery timestamptz,
  provider_raw jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- CANCELLATIONS & RETURNS
-- ============================================================
CREATE TABLE IF NOT EXISTS cancellations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  reason text NOT NULL,
  requested_by_role text NOT NULL CHECK (requested_by_role IN ('buyer','admin','system')),
  requested_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  requested_by uuid NOT NULL REFERENCES users(id),
  reason text NOT NULL,
  evidence_urls jsonb,
  refund_amount bigint,
  refund_method text CHECK (refund_method IS NULL OR refund_method IN ('original_payment','bank_transfer','store_credit')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','under_review','approved','rejected','processing_refund','refunded')),
  admin_note text,
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  bank_account_name text,
  bank_account_no text,
  bank_name text,
  transfer_proof_url text,
  transfer_at timestamptz,
  marked_refunded_by uuid REFERENCES users(id),
  refunded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================
-- PAYMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  provider text NOT NULL CHECK (provider IN ('vnpay','momo','cod')),
  amount bigint NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','refunded')),
  provider_txn_id text UNIQUE,
  raw_callback jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- VAT INVOICES
-- ============================================================
CREATE TABLE IF NOT EXISTS vat_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id),
  invoice_no text UNIQUE,
  issue_date date NOT NULL,
  buyer_tax_code text,
  buyer_company text,
  amount_before_tax bigint NOT NULL,
  vat_amount bigint NOT NULL,
  total_amount bigint NOT NULL,
  pdf_url text,
  provider_ref text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','issued','cancelled')),
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- PROMOTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_type text NOT NULL CHECK (discount_type IN ('percent','fixed')),
  value bigint NOT NULL,
  max_discount bigint,
  min_order bigint DEFAULT 0,
  usage_limit integer,
  used_count integer DEFAULT 0,
  per_user_limit integer DEFAULT 1,
  starts_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS user_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  voucher_id uuid NOT NULL REFERENCES vouchers(id),
  used_at timestamptz,
  order_id uuid REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS flash_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_variant_id uuid NOT NULL REFERENCES product_variants(id),
  sale_price bigint NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  stock_limit integer,
  sold_count integer DEFAULT 0
);

-- ============================================================
-- ENGAGEMENT
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  buyer_id uuid NOT NULL REFERENCES users(id),
  order_id uuid NOT NULL REFERENCES orders(id),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content text,
  image_urls jsonb,
  is_verified boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE (order_id, product_id)
);

CREATE TABLE IF NOT EXISTS wishlists (
  user_id uuid NOT NULL REFERENCES users(id),
  product_id uuid NOT NULL REFERENCES products(id),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  payload jsonb,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- SUPPORT
-- ============================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  order_id uuid REFERENCES orders(id),
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES support_tickets(id),
  sender_id uuid NOT NULL REFERENCES users(id),
  content text NOT NULL,
  attachments jsonb,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- ANALYTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS product_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id),
  date date NOT NULL,
  views integer DEFAULT 0,
  cart_adds integer DEFAULT 0,
  purchases integer DEFAULT 0,
  UNIQUE (product_id, date)
);

CREATE TABLE IF NOT EXISTS cart_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES users(id),
  product_variant_id uuid NOT NULL REFERENCES product_variants(id),
  event text NOT NULL CHECK (event IN ('add','remove','checkout')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revenue_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid NOT NULL REFERENCES branches(id),
  date date NOT NULL,
  gross_revenue bigint DEFAULT 0,
  discount_total bigint DEFAULT 0,
  shipping_revenue bigint DEFAULT 0,
  net_revenue bigint DEFAULT 0,
  order_count integer DEFAULT 0,
  by_payment_method jsonb,
  UNIQUE (branch_id, date)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_variant_id ON inventory(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_branch_id ON inventory(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_branch_id ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_variant_id ON order_items(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_branch_id ON shipments(branch_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_buyer_id ON reviews(buyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_events_user_id ON cart_events(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_daily_branch_id ON revenue_daily(branch_id);
