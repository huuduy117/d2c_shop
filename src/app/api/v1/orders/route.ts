import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextAuthOptions";
import {
  successJsonResponse,
  unauthorizedResponse,
  errorJsonResponse,
  internalErrorResponse,
  validationErrorResponse,
  conflictResponse,
} from "@/lib/utils/api-response";
import { createOrderSchema, orderListQuerySchema } from "@/lib/validations/orders";
import { ZodError } from "zod";
import { getAddressById, getUserOrders } from "@/lib/db/queries";
import { db } from "@/lib/db/client";
import { branches, productVariants } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import {
  createOrder,
  createOrderItems,
  addOrderStatusHistory,
  markVoucherAsUsed,
  incrementVoucherUsage,
} from "@/lib/db/queries";
import { generateOrderCode, calculateOrderTotals } from "@/lib/orders/utils";
import { reserveInventory } from "@/lib/inventory/locking";
import { validateVoucher } from "@/lib/vouchers/validation";

interface CartItem {
  product_variant_id: string;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    // Cart items từ request body
    const cartItems: CartItem[] = body.items || [];
    if (cartItems.length === 0) {
      return errorJsonResponse("Giỏ hàng trống", 400);
    }

    // Validate address
    const address = await getAddressById(
      validated.address_id,
      session.user.id,
    );
    if (!address) {
      return errorJsonResponse("Địa chỉ không tồn tại", 404);
    }

    // Validate branch
    const branch = await db.query.branches.findFirst({
      where: and(
        eq(branches.id, validated.branch_id),
        eq(branches.is_active, true),
      ),
    });
    if (!branch) {
      return errorJsonResponse("Chi nhánh không tồn tại", 404);
    }

    // Get product variants with pricing
    const variantIds = cartItems.map((item) => item.product_variant_id);
    const variants = await db.query.productVariants.findMany({
      where: and(
        inArray(productVariants.id, variantIds),
        eq(productVariants.is_active, true),
      ),
      with: {
        product: true,
      },
    });

    if (variants.length !== cartItems.length) {
      return errorJsonResponse("Một số sản phẩm không tồn tại", 400);
    }

    // Build order items with pricing
    const orderItemsData = cartItems.map((item) => {
      const variant = variants.find((v) => v.id === item.product_variant_id);
      if (!variant) {
        throw new Error("Variant not found");
      }

      const unitPrice = variant.price_override || variant.product.base_price;
      return {
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        unit_price: unitPrice,
        product_snapshot: {
          name: variant.product.name,
          sku: variant.sku,
          attributes: variant.attributes,
        },
      };
    });

    // Calculate subtotal
    const subtotal = orderItemsData.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );

    // Mock shipping fee (in real app, call shipping API)
    const shippingFee = 30000;

    // Validate voucher if provided
    let discountTotal = 0;
    let voucherData: { id: string; code: string } | null = null;

    if (validated.voucher_code) {
      const voucherResult = await validateVoucher(
        validated.voucher_code,
        session.user.id,
        subtotal,
      );

      if (!voucherResult.valid) {
        return errorJsonResponse(
          voucherResult.error || "Mã giảm giá không hợp lệ",
          400,
        );
      }

      discountTotal = voucherResult.discount;
      const voucherRecord = await db.query.vouchers.findFirst({
        where: (vouchers, { eq, and }) =>
          and(
            eq(vouchers.code, validated.voucher_code!),
            eq(vouchers.is_active, true),
          ),
      });
      if (voucherRecord) {
        voucherData = { id: voucherRecord.id, code: voucherRecord.code };
      }
    }

    // Calculate totals
    const totals = calculateOrderTotals(
      orderItemsData,
      shippingFee,
      discountTotal,
    );

    // Generate order code
    const orderCode = generateOrderCode();

    // Reserve inventory
    const reserveResult = await reserveInventory(
      validated.branch_id,
      cartItems,
    );

    if (!reserveResult.success) {
      return conflictResponse(
        `Sản phẩm ${reserveResult.failedItem} không đủ hàng`,
      );
    }

    // Create order
    const orderResult = await createOrder({
      order_code: orderCode,
      buyer_id: session.user.id,
      branch_id: validated.branch_id,
      status: "PENDING",
      payment_method: validated.payment_method,
      payment_status: "pending",
      subtotal: totals.subtotal,
      shipping_fee: totals.shipping_fee,
      discount_total: totals.discount_total,
      grand_total: totals.grand_total,
      shipping_address: {
        full_name: address.full_name,
        phone: address.phone,
        street: address.street,
        ward: address.ward,
        district: address.district,
        city: address.city,
      },
      note: validated.note,
      vat_invoice_requested: validated.vat_invoice_requested,
    });

    const order = orderResult[0];

    // Create order items
    await createOrderItems(
      orderItemsData.map((item) => ({
        order_id: order.id,
        ...item,
      })),
    );

    // Create status history
    await addOrderStatusHistory({
      order_id: order.id,
      from_status: null,
      to_status: "PENDING",
      note: "Đơn hàng được tạo",
    });

    // Mark voucher as used
    if (voucherData) {
      await markVoucherAsUsed(session.user.id, voucherData.id, order.id);
      await incrementVoucherUsage(voucherData.id);
    }

    return successJsonResponse(
      {
        order_id: order.id,
        order_code: order.order_code,
        grand_total: order.grand_total,
        payment_method: order.payment_method,
      },
      201,
    );
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

    console.error("Error creating order:", error);
    return internalErrorResponse();
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return unauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const queryData = {
      page: searchParams.get("page"),
      limit: searchParams.get("limit"),
      status: searchParams.get("status") || undefined,
    };

    const validated = orderListQuerySchema.parse(queryData);

    const result = await getUserOrders(session.user.id, {
      page: validated.page,
      limit: validated.limit,
      status: validated.status,
    });

    return successJsonResponse(result.items, 200, {
      page: result.page,
      total: result.total,
      limit: result.limit,
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

    console.error("Error fetching orders:", error);
    return internalErrorResponse();
  }
}
