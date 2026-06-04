import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

interface OrderSummaryProps {
  items: {
    product_variant_id: string;
    product_name: string;
    quantity: number;
    price: number;
    image_url?: string;
  }[];
  subtotal: number;
  shippingFee?: number;
  discount?: number;
  total: number;
  voucherCode?: string;
}

export function OrderSummary({
  items,
  subtotal,
  shippingFee = 0,
  discount = 0,
  total,
  voucherCode,
}: OrderSummaryProps) {
  return (
    <Card className="sticky top-20">
      <CardHeader>
        <CardTitle>Đơn hàng ({items.length} sản phẩm)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-64 space-y-3 overflow-y-auto">
          {items.map((item) => (
            <div key={item.product_variant_id} className="flex gap-3">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.product_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">
                    No img
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {item.product_name}
                </p>
                <p className="text-sm text-slate-600">
                  {item.quantity} x {item.price.toLocaleString("vi-VN")} đ
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {(item.quantity * item.price).toLocaleString("vi-VN")} đ
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t border-slate-200 pt-4">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Tạm tính:</span>
            <span>{subtotal.toLocaleString("vi-VN")} đ</span>
          </div>
          {shippingFee > 0 && (
            <div className="flex justify-between text-sm text-slate-600">
              <span>Phí vận chuyển:</span>
              <span>{shippingFee.toLocaleString("vi-VN")} đ</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>
                Giảm giá {voucherCode && `(${voucherCode})`}:
              </span>
              <span>-{discount.toLocaleString("vi-VN")} đ</span>
            </div>
          )}
        </div>

        <div className="flex justify-between border-t border-slate-200 pt-4 text-lg font-bold text-slate-900">
          <span>Tổng cộng:</span>
          <span>{total.toLocaleString("vi-VN")} đ</span>
        </div>
      </CardContent>
    </Card>
  );
}
