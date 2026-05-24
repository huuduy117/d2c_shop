import { relations } from "drizzle-orm";
import {
  users,
  branches,
  addresses,
  categories,
  products,
  productVariants,
  productImages,
  inventory,
  orders,
  orderItems,
  orderStatusHistory,
  orderBranchTransfers,
  shipments,
  cancellations,
  returns,
  payments,
  vatInvoices,
  vouchers,
  userVouchers,
  flashSales,
  reviews,
  wishlists,
  notifications,
  supportTickets,
  supportMessages,
  productAnalytics,
  cartEvents,
  revenueDaily,
} from "./schema";

// ── Users ──────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  reviews: many(reviews),
  wishlists: many(wishlists),
  notifications: many(notifications),
  supportTickets: many(supportTickets),
  userVouchers: many(userVouchers),
}));

// ── Branches ───────────────────────────────────────────────
export const branchesRelations = relations(branches, ({ many }) => ({
  inventory: many(inventory),
  orders: many(orders),
  shipments: many(shipments),
  revenueDaily: many(revenueDaily),
}));

// ── Addresses ──────────────────────────────────────────────
export const addressesRelations = relations(addresses, ({ one }) => ({
  user: one(users, {
    fields: [addresses.user_id],
    references: [users.id],
  }),
}));

// ── Categories ─────────────────────────────────────────────
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parent_id],
    references: [categories.id],
    relationName: "categoryParent",
  }),
  children: many(categories, { relationName: "categoryParent" }),
  products: many(products),
}));

// ── Products ───────────────────────────────────────────────
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.category_id],
    references: [categories.id],
  }),
  variants: many(productVariants),
  images: many(productImages),
  reviews: many(reviews),
  wishlists: many(wishlists),
  analytics: many(productAnalytics),
}));

// ── Product Variants ───────────────────────────────────────
export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.product_id],
      references: [products.id],
    }),
    inventory: many(inventory),
    orderItems: many(orderItems),
    flashSales: many(flashSales),
    cartEvents: many(cartEvents),
  }),
);

// ── Product Images ─────────────────────────────────────────
export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.product_id],
    references: [products.id],
  }),
}));

// ── Inventory ──────────────────────────────────────────────
export const inventoryRelations = relations(inventory, ({ one }) => ({
  productVariant: one(productVariants, {
    fields: [inventory.product_variant_id],
    references: [productVariants.id],
  }),
  branch: one(branches, {
    fields: [inventory.branch_id],
    references: [branches.id],
  }),
}));

// ── Orders ─────────────────────────────────────────────────
export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, {
    fields: [orders.buyer_id],
    references: [users.id],
  }),
  branch: one(branches, {
    fields: [orders.branch_id],
    references: [branches.id],
    relationName: "orderBranch",
  }),
  originalBranch: one(branches, {
    fields: [orders.original_branch_id],
    references: [branches.id],
    relationName: "orderOriginalBranch",
  }),
  items: many(orderItems),
  statusHistory: many(orderStatusHistory),
  branchTransfers: many(orderBranchTransfers),
  shipments: many(shipments),
  cancellations: many(cancellations),
  returns: many(returns),
  payments: many(payments),
  vatInvoices: many(vatInvoices),
  reviews: many(reviews),
}));

// ── Order Items ────────────────────────────────────────────
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.order_id],
    references: [orders.id],
  }),
  productVariant: one(productVariants, {
    fields: [orderItems.product_variant_id],
    references: [productVariants.id],
  }),
}));

// ── Order Status History ───────────────────────────────────
export const orderStatusHistoryRelations = relations(
  orderStatusHistory,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderStatusHistory.order_id],
      references: [orders.id],
    }),
    changedByUser: one(users, {
      fields: [orderStatusHistory.changed_by],
      references: [users.id],
    }),
  }),
);

// ── Order Branch Transfers ─────────────────────────────────
export const orderBranchTransfersRelations = relations(
  orderBranchTransfers,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderBranchTransfers.order_id],
      references: [orders.id],
    }),
    fromBranch: one(branches, {
      fields: [orderBranchTransfers.from_branch_id],
      references: [branches.id],
      relationName: "transferFrom",
    }),
    toBranch: one(branches, {
      fields: [orderBranchTransfers.to_branch_id],
      references: [branches.id],
      relationName: "transferTo",
    }),
    transferredByUser: one(users, {
      fields: [orderBranchTransfers.transferred_by],
      references: [users.id],
    }),
  }),
);

// ── Shipments ──────────────────────────────────────────────
export const shipmentsRelations = relations(shipments, ({ one }) => ({
  order: one(orders, {
    fields: [shipments.order_id],
    references: [orders.id],
  }),
  branch: one(branches, {
    fields: [shipments.branch_id],
    references: [branches.id],
  }),
}));

// ── Cancellations ──────────────────────────────────────────
export const cancellationsRelations = relations(cancellations, ({ one }) => ({
  order: one(orders, {
    fields: [cancellations.order_id],
    references: [orders.id],
  }),
  requestedByUser: one(users, {
    fields: [cancellations.requested_by],
    references: [users.id],
  }),
}));

// ── Returns ────────────────────────────────────────────────
export const returnsRelations = relations(returns, ({ one }) => ({
  order: one(orders, {
    fields: [returns.order_id],
    references: [orders.id],
  }),
  requestedByUser: one(users, {
    fields: [returns.requested_by],
    references: [users.id],
    relationName: "returnRequester",
  }),
  reviewedByUser: one(users, {
    fields: [returns.reviewed_by],
    references: [users.id],
    relationName: "returnReviewer",
  }),
  markedRefundedByUser: one(users, {
    fields: [returns.marked_refunded_by],
    references: [users.id],
    relationName: "returnRefunder",
  }),
}));

// ── Payments ───────────────────────────────────────────────
export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.order_id],
    references: [orders.id],
  }),
}));

// ── VAT Invoices ───────────────────────────────────────────
export const vatInvoicesRelations = relations(vatInvoices, ({ one }) => ({
  order: one(orders, {
    fields: [vatInvoices.order_id],
    references: [orders.id],
  }),
}));

// ── Vouchers ───────────────────────────────────────────────
export const vouchersRelations = relations(vouchers, ({ many }) => ({
  userVouchers: many(userVouchers),
}));

// ── User Vouchers ──────────────────────────────────────────
export const userVouchersRelations = relations(userVouchers, ({ one }) => ({
  user: one(users, {
    fields: [userVouchers.user_id],
    references: [users.id],
  }),
  voucher: one(vouchers, {
    fields: [userVouchers.voucher_id],
    references: [vouchers.id],
  }),
  order: one(orders, {
    fields: [userVouchers.order_id],
    references: [orders.id],
  }),
}));

// ── Flash Sales ────────────────────────────────────────────
export const flashSalesRelations = relations(flashSales, ({ one }) => ({
  productVariant: one(productVariants, {
    fields: [flashSales.product_variant_id],
    references: [productVariants.id],
  }),
}));

// ── Reviews ────────────────────────────────────────────────
export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, {
    fields: [reviews.product_id],
    references: [products.id],
  }),
  buyer: one(users, {
    fields: [reviews.buyer_id],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [reviews.order_id],
    references: [orders.id],
  }),
}));

// ── Wishlists ──────────────────────────────────────────────
export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.user_id],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlists.product_id],
    references: [products.id],
  }),
}));

// ── Notifications ──────────────────────────────────────────
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id],
  }),
}));

// ── Support Tickets ────────────────────────────────────────
export const supportTicketsRelations = relations(
  supportTickets,
  ({ one, many }) => ({
    user: one(users, {
      fields: [supportTickets.user_id],
      references: [users.id],
    }),
    order: one(orders, {
      fields: [supportTickets.order_id],
      references: [orders.id],
    }),
    messages: many(supportMessages),
  }),
);

// ── Support Messages ───────────────────────────────────────
export const supportMessagesRelations = relations(
  supportMessages,
  ({ one }) => ({
    ticket: one(supportTickets, {
      fields: [supportMessages.ticket_id],
      references: [supportTickets.id],
    }),
    sender: one(users, {
      fields: [supportMessages.sender_id],
      references: [users.id],
    }),
  }),
);

// ── Product Analytics ──────────────────────────────────────
export const productAnalyticsRelations = relations(
  productAnalytics,
  ({ one }) => ({
    product: one(products, {
      fields: [productAnalytics.product_id],
      references: [products.id],
    }),
  }),
);

// ── Cart Events ────────────────────────────────────────────
export const cartEventsRelations = relations(cartEvents, ({ one }) => ({
  user: one(users, {
    fields: [cartEvents.user_id],
    references: [users.id],
  }),
  productVariant: one(productVariants, {
    fields: [cartEvents.product_variant_id],
    references: [productVariants.id],
  }),
}));

// ── Revenue Daily ──────────────────────────────────────────
export const revenueDailyRelations = relations(revenueDaily, ({ one }) => ({
  branch: one(branches, {
    fields: [revenueDaily.branch_id],
    references: [branches.id],
  }),
}));
