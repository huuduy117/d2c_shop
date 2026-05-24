import { db } from "@/lib/db/client";
import {
  products,
  productVariants,
  productImages,
  categories,
  inventory,
  branches,
} from "@/lib/db/schema";
import { eq, like, and, desc, asc, sql } from "drizzle-orm";

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
