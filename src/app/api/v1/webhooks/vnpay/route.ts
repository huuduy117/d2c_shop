import { NextResponse } from "next/server";
import {
  successJsonResponse,
  errorJsonResponse,
  internalErrorResponse,
} from "@/lib/utils/api-response";
import {
  verifyVNPayCallback,
  isVNPayPaymentSuccess,
  getOrderIdFromVNPay,
  type VNPayCallbackParams,
} from "@/lib/payments/vnpay";
import { getOrderById, updateOrderStatus, addOrderStatusHistory } from "@/lib/db/queries";
import { db } from "@/lib/db/client";
import { payments, orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { commitInventory } from "@/lib/inventory/locking";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const params: VNPayCallbackParams = body;

    // Verify signature
    if (!verifyVNPayCallback(params)) {
      return errorJsonResponse("Invalid signature", 401);
    }

    // Get order ID
    const orderId = getOrderIdFromVNPay(params);
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
    const isSuccess = isVNPayPaymentSuccess(params);

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
            eq(payments.provider, "vnpay"),
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
        note: "VNPay payment successful",
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
            eq(payments.provider, "vnpay"),
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
    console.error("Error processing VNPay callback:", error);
    return internalErrorResponse();
  }
}
