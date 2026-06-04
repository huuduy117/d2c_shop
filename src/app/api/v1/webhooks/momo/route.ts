import { NextResponse } from "next/server";
import {
  successJsonResponse,
  errorJsonResponse,
  internalErrorResponse,
} from "@/lib/utils/api-response";
import {
  verifyMoMoCallback,
  isMoMoPaymentSuccess,
  getOrderIdFromMoMo,
  type MoMoCallbackParams,
} from "@/lib/payments/momo";
import { getOrderById, updateOrderStatus, addOrderStatusHistory } from "@/lib/db/queries";
import { db } from "@/lib/db/client";
import { payments, orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { commitInventory } from "@/lib/inventory/locking";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params: MoMoCallbackParams = body;

    // Verify signature
    if (!verifyMoMoCallback(params)) {
      return errorJsonResponse("Invalid signature", 401);
    }

    // Get order ID
    const orderId = getOrderIdFromMoMo(params);
    const order = await getOrderById(orderId);

    if (!order) {
      return errorJsonResponse("Order not found", 404);
    }

    // Check if already processed
    if (order.payment_status !== "pending") {
      return successJsonResponse({
        message: "Payment already processed",
        order_id: orderId,
      });
    }

    // Check payment result
    const isSuccess = isMoMoPaymentSuccess(params);

    if (isSuccess) {
      // Update payment record
      await db
        .update(payments)
        .set({
          status: "success",
          raw_callback: params,
        })
        .where(
          and(
            eq(payments.order_id, orderId),
            eq(payments.provider, "momo"),
          ),
        );

      // Update order payment status
      await db
        .update(orders)
        .set({ payment_status: "paid" })
        .where(eq(orders.id, orderId));

      // Update order status to CONFIRMED
      await updateOrderStatus(orderId, "CONFIRMED");

      // Commit inventory (deduct stock, release reserved)
      const cartItems = order.items.map((item) => ({
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
      }));
      await commitInventory(order.branch_id, cartItems);

      // Add status history
      await addOrderStatusHistory({
        order_id: orderId,
        from_status: "PENDING",
        to_status: "CONFIRMED",
        note: "MoMo payment successful",
      });
    } else {
      // Payment failed
      await db
        .update(payments)
        .set({
          status: "failed",
          raw_callback: params,
        })
        .where(
          and(
            eq(payments.order_id, orderId),
            eq(payments.provider, "momo"),
          ),
        );

      await db
        .update(orders)
        .set({ payment_status: "failed" })
        .where(eq(orders.id, orderId));
    }

    return successJsonResponse({
      message: isSuccess ? "Payment successful" : "Payment failed",
      order_id: orderId,
    });
  } catch (error) {
    console.error("Error processing MoMo callback:", error);
    return internalErrorResponse();
  }
}
