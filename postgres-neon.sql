-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL CHECK (role IN ('buyer', 'admin')),
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    pdpa_consented_at TIMESTAMPTZ,
    pdpa_version TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- SHOP CONFIG
-- ============================================================

CREATE TABLE shop_config (
    id UUID PRIMARY KEY,
    shop_name TEXT NOT NULL,
    logo_url TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    tax_code TEXT,
    bank_account TEXT,
    bank_name TEXT,
    bank_owner_name TEXT,
    social_links JSONB,
    vat_invoice_provider TEXT,
    vat_invoice_config JSONB,
    updated_at TIMESTAMPTZ
);

-- ============================================================
-- BRANCHES
-- ============================================================

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    ward TEXT,
    district TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    ghn_shop_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ADDRESSES
-- ============================================================

CREATE TABLE addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label TEXT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    street TEXT NOT NULL,
    ward TEXT,
    district TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude NUMERIC(10,7),
    longitude NUMERIC(10,7),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_addresses_user_id ON addresses(user_id);

-- ============================================================
-- CATEGORIES
-- ============================================================

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    base_price BIGINT NOT NULL,
    category_id UUID REFERENCES categories(id),
    status TEXT NOT NULL CHECK (
        status IN ('draft', 'active', 'hidden')
    ),
    meta_title TEXT,
    meta_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_slug ON products(slug);

-- ============================================================
-- PRODUCT VARIANTS
-- ============================================================

CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT UNIQUE NOT NULL,
    attributes JSONB NOT NULL,
    price_override BIGINT,
    weight_gram INT,
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_product_variants_product_id
ON product_variants(product_id);

CREATE INDEX idx_product_variants_sku
ON product_variants(sku);

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================

CREATE TABLE product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    sort_order INT DEFAULT 0
);

CREATE INDEX idx_product_images_product_id
ON product_images(product_id);

-- ============================================================
-- INVENTORY
-- ============================================================

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_variant_id UUID NOT NULL REFERENCES product_variants(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    stock INT NOT NULL DEFAULT 0,
    reserved_stock INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 5,
    UNIQUE(product_variant_id, branch_id)
);

CREATE INDEX idx_inventory_variant_id
ON inventory(product_variant_id);

CREATE INDEX idx_inventory_branch_id
ON inventory(branch_id);

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code TEXT UNIQUE NOT NULL,
    buyer_id UUID NOT NULL REFERENCES users(id),
    branch_id UUID NOT NULL REFERENCES branches(id),
    original_branch_id UUID REFERENCES branches(id),

    status TEXT NOT NULL,

    payment_method TEXT NOT NULL CHECK (
        payment_method IN ('vnpay', 'momo', 'cod')
    ),

    payment_status TEXT NOT NULL CHECK (
        payment_status IN (
            'pending',
            'paid',
            'failed',
            'refunded',
            'partially_refunded'
        )
    ),

    subtotal BIGINT NOT NULL,
    shipping_fee BIGINT NOT NULL DEFAULT 0,
    discount_total BIGINT NOT NULL DEFAULT 0,
    grand_total BIGINT NOT NULL,

    shipping_address JSONB NOT NULL,
    note TEXT,

    vat_invoice_requested BOOLEAN DEFAULT false,
    vat_invoice_issued BOOLEAN DEFAULT false,
    vat_invoice_url TEXT,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_branch_id ON orders(branch_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- ============================================================
-- ORDER ITEMS
-- ============================================================

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES product_variants(id),
    quantity INT NOT NULL,
    unit_price BIGINT NOT NULL,
    product_snapshot JSONB NOT NULL
);

CREATE INDEX idx_order_items_order_id
ON order_items(order_id);

-- ============================================================
-- ORDER STATUS HISTORY
-- ============================================================

CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    from_status TEXT,
    to_status TEXT NOT NULL,
    changed_by UUID REFERENCES users(id),
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_order_status_history_order_id
ON order_status_history(order_id);

-- ============================================================
-- ORDER BRANCH TRANSFERS
-- ============================================================

CREATE TABLE order_branch_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    from_branch_id UUID NOT NULL REFERENCES branches(id),
    to_branch_id UUID NOT NULL REFERENCES branches(id),
    transferred_by UUID NOT NULL REFERENCES users(id),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SHIPMENTS
-- ============================================================

CREATE TABLE shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),
    branch_id UUID NOT NULL REFERENCES branches(id),

    provider TEXT NOT NULL CHECK (
        provider IN ('ghn', 'ghtk', 'manual')
    ),

    tracking_code TEXT UNIQUE,
    status TEXT,

    estimated_delivery DATE,
    actual_delivery TIMESTAMPTZ,

    provider_raw JSONB,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_shipments_order_id
ON shipments(order_id);

-- ============================================================
-- CANCELLATIONS
-- ============================================================

CREATE TABLE cancellations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id),

    reason TEXT NOT NULL,

    requested_by_role TEXT NOT NULL CHECK (
        requested_by_role IN ('buyer', 'admin', 'system')
    ),

    requested_by UUID REFERENCES users(id),

    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- RETURNS
-- ============================================================

CREATE TABLE returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL REFERENCES orders(id),

    requested_by UUID NOT NULL REFERENCES users(id),

    reason TEXT NOT NULL,

    evidence_urls JSONB,

    refund_amount BIGINT,

    refund_method TEXT CHECK (
        refund_method IN (
            'original_payment',
            'bank_transfer',
            'store_credit'
        )
    ),

    status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
        status IN (
            'pending',
            'under_review',
            'approved',
            'rejected',
            'processing_refund',
            'refunded'
        )
    ),

    admin_note TEXT,

    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,

    bank_account_name TEXT,
    bank_account_no TEXT,
    bank_name TEXT,

    transfer_proof_url TEXT,
    transfer_at TIMESTAMPTZ,

    marked_refunded_by UUID REFERENCES users(id),
    refunded_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_returns_order_id
ON returns(order_id);

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL REFERENCES orders(id),

    provider TEXT NOT NULL CHECK (
        provider IN ('vnpay', 'momo', 'cod')
    ),

    amount BIGINT NOT NULL,

    status TEXT NOT NULL CHECK (
        status IN (
            'pending',
            'success',
            'failed',
            'refunded'
        )
    ),

    provider_txn_id TEXT UNIQUE,

    raw_callback JSONB,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_order_id
ON payments(order_id);

-- ============================================================
-- VAT INVOICES
-- ============================================================

CREATE TABLE vat_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    order_id UUID NOT NULL REFERENCES orders(id),

    invoice_no TEXT UNIQUE,

    issue_date DATE NOT NULL,

    buyer_tax_code TEXT,
    buyer_company TEXT,

    amount_before_tax BIGINT NOT NULL,
    vat_amount BIGINT NOT NULL,
    total_amount BIGINT NOT NULL,

    pdf_url TEXT,

    provider_ref TEXT,

    status TEXT NOT NULL CHECK (
        status IN ('pending', 'issued', 'cancelled')
    ),

    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- VOUCHERS
-- ============================================================

CREATE TABLE vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code TEXT UNIQUE NOT NULL,

    discount_type TEXT NOT NULL CHECK (
        discount_type IN ('percent', 'fixed')
    ),

    value BIGINT NOT NULL,

    max_discount BIGINT,

    min_order BIGINT DEFAULT 0,

    usage_limit INT,

    used_count INT DEFAULT 0,

    per_user_limit INT DEFAULT 1,

    starts_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,

    is_active BOOLEAN DEFAULT true
);

-- ============================================================
-- USER VOUCHERS
-- ============================================================

CREATE TABLE user_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id),

    voucher_id UUID NOT NULL REFERENCES vouchers(id),

    used_at TIMESTAMPTZ,

    order_id UUID REFERENCES orders(id)
);

-- ============================================================
-- FLASH SALES
-- ============================================================

CREATE TABLE flash_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_variant_id UUID NOT NULL REFERENCES product_variants(id),

    sale_price BIGINT NOT NULL,

    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,

    stock_limit INT,

    sold_count INT DEFAULT 0
);

-- ============================================================
-- REVIEWS
-- ============================================================

CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL REFERENCES products(id),

    buyer_id UUID NOT NULL REFERENCES users(id),

    order_id UUID NOT NULL REFERENCES orders(id),

    rating INT NOT NULL CHECK (
        rating BETWEEN 1 AND 5
    ),

    content TEXT,

    image_urls JSONB,

    is_verified BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(order_id, product_id)
);

-- ============================================================
-- WISHLISTS
-- ============================================================

CREATE TABLE wishlists (
    user_id UUID NOT NULL REFERENCES users(id),
    product_id UUID NOT NULL REFERENCES products(id),
    created_at TIMESTAMPTZ DEFAULT now(),

    PRIMARY KEY(user_id, product_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id),

    type TEXT NOT NULL,

    title TEXT NOT NULL,

    body TEXT NOT NULL,

    payload JSONB,

    read_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user_id
ON notifications(user_id);

-- ============================================================
-- SUPPORT TICKETS
-- ============================================================

CREATE TABLE support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL REFERENCES users(id),

    order_id UUID REFERENCES orders(id),

    subject TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'open'
    CHECK (
        status IN (
            'open',
            'in_progress',
            'resolved',
            'closed'
        )
    ),

    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SUPPORT MESSAGES
-- ============================================================

CREATE TABLE support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ticket_id UUID NOT NULL REFERENCES support_tickets(id),

    sender_id UUID NOT NULL REFERENCES users(id),

    content TEXT NOT NULL,

    attachments JSONB,

    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PRODUCT ANALYTICS
-- ============================================================

CREATE TABLE product_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL REFERENCES products(id),

    date DATE NOT NULL,

    views INT DEFAULT 0,
    cart_adds INT DEFAULT 0,
    purchases INT DEFAULT 0,

    UNIQUE(product_id, date)
);

-- ============================================================
-- CART EVENTS
-- ============================================================

CREATE TABLE cart_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id TEXT NOT NULL,

    user_id UUID REFERENCES users(id),

    product_variant_id UUID NOT NULL REFERENCES product_variants(id),

    event TEXT NOT NULL CHECK (
        event IN ('add', 'remove', 'checkout')
    ),

    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- REVENUE DAILY
-- ============================================================

CREATE TABLE revenue_daily (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    branch_id UUID NOT NULL REFERENCES branches(id),

    date DATE NOT NULL,

    gross_revenue BIGINT DEFAULT 0,
    discount_total BIGINT DEFAULT 0,
    shipping_revenue BIGINT DEFAULT 0,
    net_revenue BIGINT DEFAULT 0,

    order_count INT DEFAULT 0,

    by_payment_method JSONB,

    UNIQUE(branch_id, date)
);