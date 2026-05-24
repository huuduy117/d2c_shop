import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  bigint,
} from "drizzle-orm/pg-core";

// ============================================================
// USERS & CONSENT
// ============================================================
export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    email: text("email").notNull(),
    password_hash: text("password_hash"),
    role: text("role").notNull().default("buyer"),
    full_name: text("full_name"),
    phone: text("phone"),
    avatar_url: text("avatar_url"),
    is_active: boolean("is_active").default(true),
    pdpa_consented_at: timestamp("pdpa_consented_at", { withTimezone: true }),
    pdpa_version: text("pdpa_version"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    roleCheck: check("users_role_check", sql`${table.role} IN ('buyer','admin')`),
  }),
);

// ============================================================
// SHOP & BRANCHES
// ============================================================
export const shopConfig = pgTable("shop_config", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  shop_name: text("shop_name").notNull(),
  logo_url: text("logo_url"),
  contact_email: text("contact_email"),
  contact_phone: text("contact_phone"),
  tax_code: text("tax_code"),
  bank_account: text("bank_account"),
  bank_name: text("bank_name"),
  bank_owner_name: text("bank_owner_name"),
  social_links: jsonb("social_links"),
  vat_invoice_provider: text("vat_invoice_provider"),
  vat_invoice_config: jsonb("vat_invoice_config"),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const branches = pgTable("branches", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  ward: text("ward"),
  district: text("district").notNull(),
  city: text("city").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  phone: text("phone"),
  is_active: boolean("is_active").default(true),
  is_default: boolean("is_default").default(false),
  ghn_shop_id: text("ghn_shop_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================================
// BUYER ADDRESSES
// ============================================================
export const addresses = pgTable("addresses", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  label: text("label"),
  full_name: text("full_name").notNull(),
  phone: text("phone").notNull(),
  street: text("street").notNull(),
  ward: text("ward"),
  district: text("district").notNull(),
  city: text("city").notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  is_default: boolean("is_default").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================================
// PRODUCTS & CATEGORIES
// ============================================================
export const categories = pgTable(
  "categories",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    parent_id: uuid("parent_id"),
    sort_order: integer("sort_order").default(0),
    is_active: boolean("is_active").default(true),
  },
  (table) => ({
    slugIdx: uniqueIndex("categories_slug_idx").on(table.slug),
  }),
);

export const products = pgTable(
  "products",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    base_price: bigint("base_price", { mode: "number" }).notNull(),
    category_id: uuid("category_id").references(() => categories.id),
    status: text("status").notNull().default("draft"),
    meta_title: text("meta_title"),
    meta_description: text("meta_description"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("products_slug_idx").on(table.slug),
    statusCheck: check(
      "products_status_check",
      sql`${table.status} IN ('draft','active','hidden')`,
    ),
  }),
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    product_id: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sku: text("sku").notNull(),
    attributes: jsonb("attributes").notNull(),
    price_override: bigint("price_override", { mode: "number" }),
    weight_gram: integer("weight_gram"),
    is_active: boolean("is_active").default(true),
  },
  (table) => ({
    skuIdx: uniqueIndex("product_variants_sku_idx").on(table.sku),
  }),
);

export const productImages = pgTable("product_images", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  product_id: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  sort_order: integer("sort_order").default(0),
});

// ============================================================
// INVENTORY (per variant x branch)
// ============================================================
export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    product_variant_id: uuid("product_variant_id")
      .notNull()
      .references(() => productVariants.id),
    branch_id: uuid("branch_id")
      .notNull()
      .references(() => branches.id),
    stock: integer("stock").notNull().default(0),
    reserved_stock: integer("reserved_stock").notNull().default(0),
    low_stock_threshold: integer("low_stock_threshold").default(5),
  },
  (table) => ({
    variantBranchUnique: unique("inventory_variant_branch_unique").on(
      table.product_variant_id,
      table.branch_id,
    ),
  }),
);

// ============================================================
// ORDERS
// ============================================================
export const orders = pgTable(
  "orders",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    order_code: text("order_code").notNull(),
    buyer_id: uuid("buyer_id")
      .notNull()
      .references(() => users.id),
    branch_id: uuid("branch_id")
      .notNull()
      .references(() => branches.id),
    original_branch_id: uuid("original_branch_id").references(() => branches.id),
    status: text("status").notNull().default("PENDING"),
    payment_method: text("payment_method").notNull(),
    payment_status: text("payment_status").notNull().default("pending"),
    subtotal: bigint("subtotal", { mode: "number" }).notNull(),
    shipping_fee: bigint("shipping_fee", { mode: "number" }).notNull().default(0),
    discount_total: bigint("discount_total", { mode: "number" }).notNull().default(0),
    grand_total: bigint("grand_total", { mode: "number" }).notNull(),
    shipping_address: jsonb("shipping_address").notNull(),
    note: text("note"),
    vat_invoice_requested: boolean("vat_invoice_requested").default(false),
    vat_invoice_issued: boolean("vat_invoice_issued").default(false),
    vat_invoice_url: text("vat_invoice_url"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    orderCodeIdx: uniqueIndex("orders_order_code_idx").on(table.order_code),
    paymentMethodCheck: check(
      "orders_payment_method_check",
      sql`${table.payment_method} IN ('vnpay','momo','cod')`,
    ),
    paymentStatusCheck: check(
      "orders_payment_status_check",
      sql`${table.payment_status} IN ('pending','paid','failed','refunded','partially_refunded')`,
    ),
  }),
);

export const orderItems = pgTable("order_items", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  order_id: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  product_variant_id: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id),
  quantity: integer("quantity").notNull(),
  unit_price: bigint("unit_price", { mode: "number" }).notNull(),
  product_snapshot: jsonb("product_snapshot").notNull(),
});

export const orderStatusHistory = pgTable("order_status_history", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  order_id: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  from_status: text("from_status"),
  to_status: text("to_status").notNull(),
  changed_by: uuid("changed_by").references(() => users.id),
  note: text("note"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const orderBranchTransfers = pgTable("order_branch_transfers", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  order_id: uuid("order_id")
    .notNull()
    .references(() => orders.id),
  from_branch_id: uuid("from_branch_id")
    .notNull()
    .references(() => branches.id),
  to_branch_id: uuid("to_branch_id")
    .notNull()
    .references(() => branches.id),
  transferred_by: uuid("transferred_by")
    .notNull()
    .references(() => users.id),
  reason: text("reason"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================================
// SHIPPING & TRACKING
// ============================================================
export const shipments = pgTable(
  "shipments",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    order_id: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    branch_id: uuid("branch_id")
      .notNull()
      .references(() => branches.id),
    provider: text("provider").notNull(),
    tracking_code: text("tracking_code"),
    status: text("status"),
    estimated_delivery: date("estimated_delivery"),
    actual_delivery: timestamp("actual_delivery", { withTimezone: true }),
    provider_raw: jsonb("provider_raw"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    trackingCodeIdx: uniqueIndex("shipments_tracking_code_idx").on(
      table.tracking_code,
    ),
    providerCheck: check(
      "shipments_provider_check",
      sql`${table.provider} IN ('ghn','ghtk','manual')`,
    ),
  }),
);

// ============================================================
// CANCELLATIONS & RETURNS
// ============================================================
export const cancellations = pgTable(
  "cancellations",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    order_id: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    reason: text("reason").notNull(),
    requested_by_role: text("requested_by_role").notNull(),
    requested_by: uuid("requested_by").references(() => users.id),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    roleCheck: check(
      "cancellations_role_check",
      sql`${table.requested_by_role} IN ('buyer','admin','system')`,
    ),
  }),
);

export const returns = pgTable(
  "returns",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    order_id: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    requested_by: uuid("requested_by")
      .notNull()
      .references(() => users.id),
    reason: text("reason").notNull(),
    evidence_urls: jsonb("evidence_urls"),
    refund_amount: bigint("refund_amount", { mode: "number" }),
    refund_method: text("refund_method"),
    status: text("status").notNull().default("pending"),
    admin_note: text("admin_note"),
    reviewed_by: uuid("reviewed_by").references(() => users.id),
    reviewed_at: timestamp("reviewed_at", { withTimezone: true }),
    bank_account_name: text("bank_account_name"),
    bank_account_no: text("bank_account_no"),
    bank_name: text("bank_name"),
    transfer_proof_url: text("transfer_proof_url"),
    transfer_at: timestamp("transfer_at", { withTimezone: true }),
    marked_refunded_by: uuid("marked_refunded_by").references(() => users.id),
    refunded_at: timestamp("refunded_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    refundMethodCheck: check(
      "returns_refund_method_check",
      sql`${table.refund_method} IS NULL OR ${table.refund_method} IN ('original_payment','bank_transfer','store_credit')`,
    ),
    statusCheck: check(
      "returns_status_check",
      sql`${table.status} IN ('pending','under_review','approved','rejected','processing_refund','refunded')`,
    ),
  }),
);

// ============================================================
// PAYMENTS
// ============================================================
export const payments = pgTable(
  "payments",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    order_id: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    provider: text("provider").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    status: text("status").notNull().default("pending"),
    provider_txn_id: text("provider_txn_id"),
    raw_callback: jsonb("raw_callback"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    providerTxnIdx: uniqueIndex("payments_provider_txn_idx").on(
      table.provider_txn_id,
    ),
    providerCheck: check(
      "payments_provider_check",
      sql`${table.provider} IN ('vnpay','momo','cod')`,
    ),
    statusCheck: check(
      "payments_status_check",
      sql`${table.status} IN ('pending','success','failed','refunded')`,
    ),
  }),
);

// ============================================================
// VAT INVOICES
// ============================================================
export const vatInvoices = pgTable(
  "vat_invoices",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    order_id: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    invoice_no: text("invoice_no"),
    issue_date: date("issue_date").notNull(),
    buyer_tax_code: text("buyer_tax_code"),
    buyer_company: text("buyer_company"),
    amount_before_tax: bigint("amount_before_tax", { mode: "number" }).notNull(),
    vat_amount: bigint("vat_amount", { mode: "number" }).notNull(),
    total_amount: bigint("total_amount", { mode: "number" }).notNull(),
    pdf_url: text("pdf_url"),
    provider_ref: text("provider_ref"),
    status: text("status").notNull().default("pending"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    invoiceNoIdx: uniqueIndex("vat_invoices_invoice_no_idx").on(table.invoice_no),
    statusCheck: check(
      "vat_invoices_status_check",
      sql`${table.status} IN ('pending','issued','cancelled')`,
    ),
  }),
);

// ============================================================
// PROMOTIONS
// ============================================================
export const vouchers = pgTable(
  "vouchers",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    code: text("code").notNull(),
    discount_type: text("discount_type").notNull(),
    value: bigint("value", { mode: "number" }).notNull(),
    max_discount: bigint("max_discount", { mode: "number" }),
    min_order: bigint("min_order", { mode: "number" }).default(0),
    usage_limit: integer("usage_limit"),
    used_count: integer("used_count").default(0),
    per_user_limit: integer("per_user_limit").default(1),
    starts_at: timestamp("starts_at", { withTimezone: true }),
    expires_at: timestamp("expires_at", { withTimezone: true }),
    is_active: boolean("is_active").default(true),
  },
  (table) => ({
    codeIdx: uniqueIndex("vouchers_code_idx").on(table.code),
    discountTypeCheck: check(
      "vouchers_discount_type_check",
      sql`${table.discount_type} IN ('percent','fixed')`,
    ),
  }),
);

export const userVouchers = pgTable("user_vouchers", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  voucher_id: uuid("voucher_id")
    .notNull()
    .references(() => vouchers.id),
  used_at: timestamp("used_at", { withTimezone: true }),
  order_id: uuid("order_id").references(() => orders.id),
});

export const flashSales = pgTable("flash_sales", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  product_variant_id: uuid("product_variant_id")
    .notNull()
    .references(() => productVariants.id),
  sale_price: bigint("sale_price", { mode: "number" }).notNull(),
  starts_at: timestamp("starts_at", { withTimezone: true }).notNull(),
  ends_at: timestamp("ends_at", { withTimezone: true }).notNull(),
  stock_limit: integer("stock_limit"),
  sold_count: integer("sold_count").default(0),
});

// ============================================================
// ENGAGEMENT
// ============================================================
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    product_id: uuid("product_id")
      .notNull()
      .references(() => products.id),
    buyer_id: uuid("buyer_id")
      .notNull()
      .references(() => users.id),
    order_id: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    rating: integer("rating").notNull(),
    content: text("content"),
    image_urls: jsonb("image_urls"),
    is_verified: boolean("is_verified").default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    orderProductUnique: unique("reviews_order_product_unique").on(
      table.order_id,
      table.product_id,
    ),
    ratingCheck: check(
      "reviews_rating_check",
      sql`${table.rating} >= 1 AND ${table.rating} <= 5`,
    ),
  }),
);

export const wishlists = pgTable(
  "wishlists",
  {
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    product_id: uuid("product_id")
      .notNull()
      .references(() => products.id),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.user_id, table.product_id] }),
  }),
);

export const notifications = pgTable("notifications", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  payload: jsonb("payload"),
  read_at: timestamp("read_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================================
// SUPPORT
// ============================================================
export const supportTickets = pgTable(
  "support_tickets",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    order_id: uuid("order_id").references(() => orders.id),
    subject: text("subject").notNull(),
    status: text("status").notNull().default("open"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    statusCheck: check(
      "support_tickets_status_check",
      sql`${table.status} IN ('open','in_progress','resolved','closed')`,
    ),
  }),
);

export const supportMessages = pgTable("support_messages", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  ticket_id: uuid("ticket_id")
    .notNull()
    .references(() => supportTickets.id),
  sender_id: uuid("sender_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  attachments: jsonb("attachments"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================================
// ANALYTICS
// ============================================================
export const productAnalytics = pgTable(
  "product_analytics",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    product_id: uuid("product_id")
      .notNull()
      .references(() => products.id),
    date: date("date").notNull(),
    views: integer("views").default(0),
    cart_adds: integer("cart_adds").default(0),
    purchases: integer("purchases").default(0),
  },
  (table) => ({
    productDateUnique: unique("product_analytics_product_date_unique").on(
      table.product_id,
      table.date,
    ),
  }),
);

export const cartEvents = pgTable(
  "cart_events",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    session_id: text("session_id").notNull(),
    user_id: uuid("user_id").references(() => users.id),
    product_variant_id: uuid("product_variant_id")
      .notNull()
      .references(() => productVariants.id),
    event: text("event").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    eventCheck: check(
      "cart_events_event_check",
      sql`${table.event} IN ('add','remove','checkout')`,
    ),
  }),
);

export const revenueDaily = pgTable(
  "revenue_daily",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    branch_id: uuid("branch_id")
      .notNull()
      .references(() => branches.id),
    date: date("date").notNull(),
    gross_revenue: bigint("gross_revenue", { mode: "number" }).default(0),
    discount_total: bigint("discount_total", { mode: "number" }).default(0),
    shipping_revenue: bigint("shipping_revenue", { mode: "number" }).default(0),
    net_revenue: bigint("net_revenue", { mode: "number" }).default(0),
    order_count: integer("order_count").default(0),
    by_payment_method: jsonb("by_payment_method"),
  },
  (table) => ({
    branchDateUnique: unique("revenue_daily_branch_date_unique").on(
      table.branch_id,
      table.date,
    ),
  }),
);
