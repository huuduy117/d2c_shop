import { db } from "@/lib/db/client";
import {
  products,
  productVariants,
  productImages,
  categories,
  inventory,
  branches,
  addresses,
  wishlists,
  users,
} from "@/lib/db/schema";
import { eq, like, and, desc, asc, sql } from "drizzle-orm";

// ── Categories ─────────────────────────────────────────────
export async function getCategories() {
  return db.query.categories.findMany({
    where: eq(categories.is_active, true),
    orderBy: asc(categories.sort_order),
  });
}

export async function getCategoryBySlug(slug: string) {
  return db.query.categories.findFirst({
    where: and(eq(categories.slug, slug), eq(categories.is_active, true)),
  });
}

// ── Products ───────────────────────────────────────────────
export async function getProducts(options: {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
}) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  let query = db.query.products.findMany({
    where: and(
      eq(products.status, "active"),
      options.search
        ? like(products.name, `%${options.search}%`)
        : undefined,
      options.category_id
        ? eq(products.category_id, options.category_id)
        : undefined,
    ),
    with: {
      images: {
        orderBy: asc(productImages.sort_order),
        limit: 1,
      },
      variants: {
        where: eq(productVariants.is_active, true),
      },
    },
    orderBy:
      options.sort === "price_asc"
        ? asc(products.base_price)
        : options.sort === "price_desc"
          ? desc(products.base_price)
          : desc(products.created_at),
    limit,
    offset,
  });

  const [items, countResult] = await Promise.all([
    query,
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(
        and(
          eq(products.status, "active"),
          options.search
            ? like(products.name, `%${options.search}%`)
            : undefined,
          options.category_id
            ? eq(products.category_id, options.category_id)
            : undefined,
        ),
      ),
  ]);

  const total = countResult[0]?.count || 0;

  return {
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function getProductBySlug(slug: string) {
  return db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.status, "active")),
    with: {
      category: true,
      images: {
        orderBy: asc(productImages.sort_order),
      },
      variants: {
        where: eq(productVariants.is_active, true),
        with: {
          inventory: {
            with: {
              branch: true,
            },
          },
        },
      },
    },
  });
}

export async function getProductInventoryByBranch(
  productVariantId: string,
  branchId: string,
) {
  return db.query.inventory.findFirst({
    where: and(
      eq(inventory.product_variant_id, productVariantId),
      eq(inventory.branch_id, branchId),
    ),
  });
}

export async function getProductsInventoryByBranch(branchId: string) {
  return db.query.inventory.findMany({
    where: eq(inventory.branch_id, branchId),
    with: {
      productVariant: {
        with: {
          product: true,
        },
      },
    },
  });
}

// ── Addresses ──────────────────────────────────────────────
export async function getUserAddresses(userId: string) {
  return db.query.addresses.findMany({
    where: eq(addresses.user_id, userId),
    orderBy: [desc(addresses.is_default), desc(addresses.created_at)],
  });
}

export async function getAddressById(id: string, userId: string) {
  return db.query.addresses.findFirst({
    where: and(eq(addresses.id, id), eq(addresses.user_id, userId)),
  });
}

export async function createAddress(
  userId: string,
  data: {
    label?: string;
    full_name: string;
    phone: string;
    street: string;
    ward?: string;
    district: string;
    city: string;
    is_default?: boolean;
    latitude?: string;
    longitude?: string;
  },
) {
  return db.insert(addresses).values({
    user_id: userId,
    ...data,
  }).returning();
}

export async function updateAddress(
  id: string,
  userId: string,
  data: Partial<{
    label?: string;
    full_name: string;
    phone: string;
    street: string;
    ward?: string;
    district: string;
    city: string;
    is_default?: boolean;
    latitude?: string;
    longitude?: string;
  }>,
) {
  return db
    .update(addresses)
    .set(data)
    .where(and(eq(addresses.id, id), eq(addresses.user_id, userId)))
    .returning();
}

export async function deleteAddress(id: string, userId: string) {
  return db
    .delete(addresses)
    .where(and(eq(addresses.id, id), eq(addresses.user_id, userId)))
    .returning();
}

// ── Wishlists ──────────────────────────────────────────────
export async function getUserWishlists(userId: string) {
  return db.query.wishlists.findMany({
    where: eq(wishlists.user_id, userId),
    with: {
      product: {
        with: {
          images: {
            orderBy: asc(productImages.sort_order),
            limit: 1,
          },
        },
      },
    },
    orderBy: desc(wishlists.created_at),
  });
}

export async function isProductInWishlist(userId: string, productId: string) {
  const result = await db.query.wishlists.findFirst({
    where: and(
      eq(wishlists.user_id, userId),
      eq(wishlists.product_id, productId),
    ),
  });
  return !!result;
}

export async function addToWishlist(userId: string, productId: string) {
  return db
    .insert(wishlists)
    .values({
      user_id: userId,
      product_id: productId,
    })
    .returning();
}

export async function removeFromWishlist(userId: string, productId: string) {
  return db
    .delete(wishlists)
    .where(
      and(
        eq(wishlists.user_id, userId),
        eq(wishlists.product_id, productId),
      ),
    )
    .returning();
}

// ── Orders ─────────────────────────────────────────────────
import {
  orders,
  orderItems,
  orderStatusHistory,
  vouchers,
  userVouchers,
} from "@/lib/db/schema";

export async function createOrder(data: {
  order_code: string;
  buyer_id: string;
  branch_id: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  shipping_fee: number;
  discount_total: number;
  grand_total: number;
  shipping_address: object;
  note?: string;
  vat_invoice_requested?: boolean;
}) {
  return db.insert(orders).values(data).returning();
}

export async function createOrderItems(
  items: Array<{
    order_id: string;
    product_variant_id: string;
    quantity: number;
    unit_price: number;
    product_snapshot: object;
  }>,
) {
  return db.insert(orderItems).values(items).returning();
}

export async function getUserOrders(
  userId: string,
  options: { page?: number; limit?: number; status?: string },
) {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  const whereConditions = [eq(orders.buyer_id, userId)];
  if (options.status) {
    whereConditions.push(eq(orders.status, options.status));
  }

  const [items, countResult] = await Promise.all([
    db.query.orders.findMany({
      where: and(...whereConditions),
      orderBy: desc(orders.created_at),
      limit,
      offset,
    }),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(and(...whereConditions)),
  ]);

  const total = countResult[0]?.count || 0;

  return {
    items,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}

export async function getOrderById(orderId: string, userId?: string) {
  const whereConditions = [eq(orders.id, orderId)];
  if (userId) {
    whereConditions.push(eq(orders.buyer_id, userId));
  }

  return db.query.orders.findFirst({
    where: and(...whereConditions),
    with: {
      items: {
        with: {
          productVariant: {
            with: {
              product: true,
            },
          },
        },
      },
      branch: true,
      statusHistory: {
        orderBy: desc(orderStatusHistory.created_at),
      },
    },
  });
}

export async function addOrderStatusHistory(data: {
  order_id: string;
  from_status: string | null;
  to_status: string;
  changed_by?: string;
  note?: string;
}) {
  return db.insert(orderStatusHistory).values(data).returning();
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
) {
  return db
    .update(orders)
    .set({ status, updated_at: new Date() })
    .where(eq(orders.id, orderId))
    .returning();
}

// ── Vouchers ───────────────────────────────────────────────
export async function getVoucherByCode(code: string) {
  return db.query.vouchers.findFirst({
    where: and(eq(vouchers.code, code), eq(vouchers.is_active, true)),
  });
}

export async function getUserVoucherUsage(userId: string, voucherId: string) {
  return db.query.userVouchers.findMany({
    where: and(
      eq(userVouchers.user_id, userId),
      eq(userVouchers.voucher_id, voucherId),
    ),
  });
}

export async function markVoucherAsUsed(
  userId: string,
  voucherId: string,
  orderId: string,
) {
  return db
    .insert(userVouchers)
    .values({
      user_id: userId,
      voucher_id: voucherId,
      order_id: orderId,
      used_at: new Date(),
    })
    .returning();
}

export async function incrementVoucherUsage(voucherId: string) {
  return db
    .update(vouchers)
    .set({ used_count: sql`${vouchers.used_count} + 1` })
    .where(eq(vouchers.id, voucherId))
    .returning();
}

