import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthOptions";
import {
  successJsonResponse,
  unauthorizedResponse,
  errorJsonResponse,
  internalErrorResponse,
  notFoundResponse,
} from "@/lib/utils/api-response";
import { getOrderById } from "@/lib/db/queries";
import { db } from "@/lib/db/client";
import { payments } from "@/lib/db/schema";
import { createVNPayPaymentUrl } from "@/lib/payments/vnpay";
import { createMoMoPayment } from "@/lib/payments/momo";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const { order_id } = body;

    if (!order_id) {
      return errorJsonResponse("order_id is required", 400);
    }

    // Get order with buyer validation
    const order = await getOrderById(order_id, session.user.id);

    if (!order) {
      return notFoundResponse();
    }

    // Check order status
    if (order.status !== "PENDING") {
      return errorJsonResponse(
        "Chỉ có thể thanh toán đơn hàng ở trạng thái PENDING",
        400,
      );
    }

    // Check payment status
    if (order.payment_status !== "pending") {
      return errorJsonResponse("Đơn hàng đã được thanh toán", 400);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    let paymentUrl: string | null = null;
    let provider_txn_id: string | null = null;

    // Generate payment URL based on method
    if (order.payment_method === "vnpay") {
      paymentUrl = createVNPayPaymentUrl({
        order_id: order.id,
        order_code: order.order_code,
        amount: order.grand_total,
        return_url: `${baseUrl}/orders/${order.id}/payment-result`,
      });
      provider_txn_id = `VNPAY_${order.id}_${Date.now()}`;
    } else if (order.payment_method === "momo") {
      const momoResult = await createMoMoPayment({
        order_id: order.id,
        order_code: order.order_code,
        amount: order.grand_total,
        redirect_url: `${baseUrl}/orders/${order.id}/payment-result`,
        ipn_url: `${baseUrl}/api/v1/webhooks/momo`,
      });
      paymentUrl = momoResult.payUrl;
      provider_txn_id = momoResult.requestId;
    } else if (order.payment_method === "cod") {
      // COD: no payment URL needed, order stays PENDING until admin confirms
      return successJsonResponse({
        payment_method: "cod",
        message: "Đơn hàng COD đã được tạo, chờ xác nhận",
      });
    } else {
      return errorJsonResponse("Phương thức thanh toán không hợp lệ", 400);
    }

    // Create payment record
    await db.insert(payments).values({
      order_id: order.id,
      provider: order.payment_method,
      amount: order.grand_total,
      status: "pending",
      provider_txn_id,
    });

    return successJsonResponse({
      payment_url: paymentUrl,
      order_id: order.id,
      payment_method: order.payment_method,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return internalErrorResponse();
  }
}
