"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentStepProps {
  paymentMethod: string;
  voucherCode: string;
  onPaymentMethodChange: (method: string) => void;
  onVoucherCodeChange: (code: string) => void;
  onValidateVoucher: () => void;
  voucherDiscount: number;
  voucherError?: string;
  onNext: () => void;
  onBack: () => void;
}

const paymentMethods = [
  { id: "vnpay", name: "VNPay", description: "Thanh toán qua VNPay" },
  { id: "momo", name: "MoMo", description: "Thanh toán qua MoMo" },
  { id: "cod", name: "COD", description: "Thanh toán khi nhận hàng" },
];

export function PaymentStep({
  paymentMethod,
  voucherCode,
  onPaymentMethodChange,
  onVoucherCodeChange,
  onValidateVoucher,
  voucherDiscount,
  voucherError,
  onNext,
  onBack,
}: PaymentStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-xl font-bold text-slate-900">
            Phương thức thanh toán
          </h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => onPaymentMethodChange(method.id)}
                className={`block w-full rounded-lg border p-4 text-left transition ${
                  paymentMethod === method.id
                    ? "border-slate-900 bg-slate-50"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`mr-3 h-5 w-5 rounded-full border-2 ${
                      paymentMethod === method.id
                        ? "border-slate-900 bg-slate-900"
                        : "border-slate-300"
                    }`}
                  >
                    {paymentMethod === method.id && (
                      <div className="flex h-full items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{method.name}</p>
                    <p className="text-sm text-slate-600">{method.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-xl font-bold text-slate-900">Mã giảm giá</h2>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Nhập mã giảm giá"
                value={voucherCode}
                onChange={(e) => onVoucherCodeChange(e.target.value)}
              />
              {voucherError && (
                <p className="mt-1 text-sm text-red-600">{voucherError}</p>
              )}
              {voucherDiscount > 0 && (
                <p className="mt-1 text-sm text-green-600">
                  Giảm giá: {voucherDiscount.toLocaleString("vi-VN")} đ
                </p>
              )}
            </div>
            <Button variant="secondary" onClick={onValidateVoucher}>
              Áp dụng
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Quay lại
        </Button>
        <Button onClick={onNext} className="flex-1">
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}
