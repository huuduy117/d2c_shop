"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/lib/store/cart";

export default function CartPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, updateQuantity, removeItem, getTotalPrice, getTotalItems } = useCart();

  const handleCheckout = () => {
    if (!session) {
      router.push("/login?redirect=/checkout");
      return;
    }
    router.push("/checkout");
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <svg
            className="h-24 w-24 text-slate-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Giỏ hàng trống</h2>
          <p className="mt-2 text-slate-600">Hãy thêm sản phẩm vào giỏ hàng</p>
          <Button onClick={() => router.push("/products")} className="mt-6">
            Mua sắm ngay
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">
        Giỏ hàng ({getTotalItems()} sản phẩm)
      </h1>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="flex-1 space-y-4">
          {items.map((item) => (
            <Card key={item.product_variant_id}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.product_name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-400">
                        <span className="text-xs">No image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {item.product_name}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">SKU: {item.sku}</p>
                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {item.price.toLocaleString("vi-VN")} đ
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          onClick={() =>
                            updateQuantity(
                              item.product_variant_id,
                              Math.max(1, item.quantity - 1),
                            )
                          }
                          className="h-8 w-8 p-0"
                        >
                          -
                        </Button>
                        <span className="w-12 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            updateQuantity(item.product_variant_id, item.quantity + 1)
                          }
                          className="h-8 w-8 p-0"
                        >
                          +
                        </Button>
                      </div>

                      <Button
                        variant="secondary"
                        onClick={() => removeItem(item.product_variant_id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        Xóa
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <p className="text-xl font-bold text-slate-900">
                      {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="lg:w-96">
          <Card className="sticky top-20">
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-bold text-slate-900">Tổng cộng</h2>

              <div className="space-y-2 border-b border-slate-200 pb-4">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm tính:</span>
                  <span>{getTotalPrice().toLocaleString("vi-VN")} đ</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí vận chuyển:</span>
                  <span>Tính khi thanh toán</span>
                </div>
              </div>

              <div className="mt-4 flex justify-between text-xl font-bold text-slate-900">
                <span>Tổng:</span>
                <span>{getTotalPrice().toLocaleString("vi-VN")} đ</span>
              </div>

              <Button onClick={handleCheckout} className="mt-6 w-full">
                Thanh toán
              </Button>

              <Button
                variant="secondary"
                onClick={() => router.push("/products")}
                className="mt-3 w-full"
              >
                Tiếp tục mua sắm
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
