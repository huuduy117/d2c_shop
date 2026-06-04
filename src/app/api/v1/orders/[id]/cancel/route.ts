import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthOptions";
import {
  successJsonResponse,
  unauthorizedResponse,
  notFoundResponse,
  errorJsonResponse,
  internalErrorResponse,
  validationErrorResponse,
} from "@/lib/utils/api-response";
import { cancelOrderSchema } from "@/lib/validations/orders";
import { getOrderById, updateOrderStatus, addOrderStatusHistory } from "@/lib/db/queries";
import { canBuyerCancel, getInventoryAction } from "@/lib/orders/state-machine";
import { handleInventoryAction } from "@/lib/inventory/locking";
import { ZodError } from "zod";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const body = await request.json();
    const validated = cancelOrderSchema.parse(body);

    // Get order with buyer validation
    const order = await getOrderById(id, session.user.id);

    if (!order) {
      return notFoundResponse();
    }

    // Check if buyer can cancel
    if (!canBuyerCancel(order.status as any)) {
      return errorJsonResponse(
        "Không thể hủy đơn hàng ở trạng thái này",
        400,
      );
    }

    // Determine inventory action
    const inventoryAction = getInventoryAction(
      order.status as any,
      "CANCELLED",
    );

    // Prepare cart items for inventory release
    const cartItems = order.items.map((item) => ({
      product_variant_id: item.product_variant_id,
      quantity: item.quantity,
    }));

    // Handle inventory
    const inventoryResult = await handleInventoryAction(
      inventoryAction,
      order.branch_id,
      cartItems,
    );

    if (!inventoryResult.success) {
      return errorJsonResponse("Lỗi xử lý tồn kho", 500);
    }

    // Update order status
    await updateOrderStatus(id, "CANCELLED");

    // Add status history
    await addOrderStatusHistory({
      order_id: id,
      from_status: order.status,
      to_status: "CANCELLED",
      changed_by: session.user.id,
      note: `Buyer cancelled: ${validated.reason}`,
    });

    return successJsonResponse({
      success: true,
      message: "Đơn hàng đã được hủy",
    });
  } catch (error) {
    if (error instanceof ZodError) {
      const errors: Record<string, string[]> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) errors[path] = [];
        errors[path].push(err.message);
      });
      return validationErrorResponse(errors);
    }

    console.error("Error cancelling order:", error);
    return internalErrorResponse();
  }
}
